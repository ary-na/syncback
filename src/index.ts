import chalk from "chalk";
import ora from "ora";
import { SyncbackConfig } from "./config";
import {
  getCurrentBranch,
  hasUncommittedChanges,
  stashChanges,
  popStash,
  checkoutBranch,
  pullBranch,
  mergeBranch,
  abortMerge,
  pushBranch,
} from "./git";

function log(msg: string) {
  console.log("  " + msg);
}

function warn(msg: string) {
  console.log(chalk.yellow("  ⚠  ") + msg);
}

function spin(text: string) {
  return ora({ text, indent: 2 }).start();
}

export async function run(config: SyncbackConfig): Promise<void> {
  const originalBranch = await getCurrentBranch();
  const sourceBranch = config.from || originalBranch;

  console.log(chalk.gray("  source:  ") + chalk.white.bold(sourceBranch));
  console.log(chalk.gray("  targets: ") + chalk.white.bold(config.into.join(", ")));
  console.log(chalk.gray("  remote:  ") + chalk.white.bold(config.remote));
  console.log(chalk.gray("  push:    ") + chalk.white.bold(config.push ? "yes" : "no"));
  console.log();

  if (config.dryRun) {
    console.log(chalk.yellow.bold("  DRY RUN — no changes will be made\n"));
    for (const target of config.into) {
      log(chalk.gray("$ ") + `git checkout ${target}`);
      log(chalk.gray("$ ") + `git pull ${config.remote} ${target}`);
      log(chalk.gray("$ ") + `git merge ${sourceBranch}`);
      if (config.push) log(chalk.gray("$ ") + `git push ${config.remote} ${target}`);
      log(chalk.gray("$ ") + `git checkout ${originalBranch}`);
      console.log();
    }
    return;
  }

  let stashed = false;
  if (config.stash && (await hasUncommittedChanges())) {
    const sp = spin("Stashing uncommitted changes...");
    await stashChanges();
    stashed = true;
    sp.succeed(chalk.green("Changes stashed"));
  }

  const results: { target: string; status: "success" | "failed"; error?: string }[] = [];

  for (let i = 0; i < config.into.length; i++) {
    const target = config.into[i];
    const counter =
      config.into.length > 1 ? chalk.gray(` [${i + 1}/${config.into.length}]`) : "";
    console.log("\n" + chalk.cyan(`  ↺${counter}  syncing into `) + chalk.cyan.bold(target));

    let sp = spin(`Switching to ${target}...`);

    try {
      await checkoutBranch(target);
      sp.succeed(chalk.green(`On ${target}`));

      sp = spin(`Pulling latest ${target}...`);
      await pullBranch(config.remote, target);
      sp.succeed(chalk.green(`${target} is up to date`));

      sp = spin(`Merging ${sourceBranch}...`);
      await mergeBranch(sourceBranch);
      sp.succeed(chalk.green("Merge complete"));

      if (config.push) {
        sp = spin(`Pushing to ${config.remote}...`);
        await pushBranch(config.remote, target);
        sp.succeed(chalk.green(`Pushed ${target}`));
      }

      results.push({ target, status: "success" });
    } catch (err: any) {
      sp.fail(chalk.red(err.message));
      await abortMerge();
      results.push({ target, status: "failed", error: err.message });
    } finally {
      try {
        const returnSp = spin(`Returning to ${originalBranch}...`);
        await checkoutBranch(originalBranch);
        returnSp.succeed(chalk.green(`Back on ${originalBranch}`));
      } catch (checkoutErr: any) {
        warn(`Could not return to ${originalBranch}: ${checkoutErr.message}`);
      }
    }
  }

  if (stashed) {
    const sp = spin("Restoring stashed changes...");
    await popStash();
    sp.succeed(chalk.green("Stash restored"));
  }

  const failed = results.filter((r) => r.status === "failed");

  console.log("\n" + chalk.cyan.bold("  ─── Summary ─────────────────────\n"));
  const maxLen = Math.max(...results.map((r) => r.target.length));
  for (const r of results) {
    const name = r.target.padEnd(maxLen);
    if (r.status === "success") {
      const label = config.push ? "merged & pushed" : "merged";
      console.log(chalk.green(`  ✔  ${name}`) + chalk.gray(`  ${label}`));
    } else {
      console.log(chalk.red(`  ✖  ${name}`) + chalk.gray(`  ${r.error}`));
    }
  }
  console.log();

  if (failed.length > 0) {
    throw new Error(`${failed.length} target(s) failed`);
  }

  console.log(chalk.green.bold("  All done!") + chalk.gray(` Back on ${originalBranch}.\n`));
}
