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

function step(msg: string) {
  console.log(chalk.cyan("  → ") + msg);
}

function success(msg: string) {
  console.log(chalk.green("  ✔ ") + msg);
}

function warn(msg: string) {
  console.log(chalk.yellow("  ⚠ ") + msg);
}

export async function run(config: SyncbackConfig): Promise<void> {
  const originalBranch = await getCurrentBranch();
  const sourceBranch = config.from || originalBranch;

  // print the plan
  console.log(chalk.gray("  source:  ") + chalk.white.bold(sourceBranch));
  console.log(
    chalk.gray("  targets: ") + chalk.white.bold(config.into.join(", ")),
  );
  console.log(chalk.gray("  remote:  ") + chalk.white.bold(config.remote));
  console.log(
    chalk.gray("  push:    ") + chalk.white.bold(config.push ? "yes" : "no"),
  );
  console.log();

  // dry run — just print commands, do nothing
  if (config.dryRun) {
    console.log(chalk.yellow.bold("  DRY RUN — no changes will be made\n"));
    for (const target of config.into) {
      log(`git checkout ${target}`);
      log(`git pull origin ${target}`);
      log(`git merge ${sourceBranch}`);
      if (config.push) log(`git push ${config.remote} ${target}`);
      log(`git checkout ${originalBranch}`);
      console.log();
    }
    return;
  }

  // stash if dirty
  let stashed = false;
  if (config.stash && (await hasUncommittedChanges())) {
    step("Stashing uncommitted changes...");
    await stashChanges();
    stashed = true;
    success("Changes stashed");
  }

  const results: {
    target: string;
    status: "success" | "failed";
    error?: string;
  }[] = [];

  for (const target of config.into) {
    console.log(chalk.cyan.bold(`\n  ↺  syncing into ${target}`));

    try {
      step(`Switching to ${target}...`);
      await checkoutBranch(target);
      success(`On ${target}`);

      step(`Pulling latest ${target}...`);
      await pullBranch(config.remote, target);
      success(`${target} is up to date`);

      step(`Merging ${sourceBranch} into ${target}...`);
      await mergeBranch(sourceBranch);
      success("Merge complete");

      if (config.push) {
        step(`Pushing ${target} to ${config.remote}...`);
        await pushBranch(config.remote, target);
        success(`Pushed ${target}`);
      }

      results.push({ target, status: "success" });
    } catch (err: any) {
      warn(`Failed on ${target}: ${err.message}`);
      await abortMerge();
      results.push({ target, status: "failed", error: err.message });
    } finally {
      // ALWAYS return home no matter what
      step(`Returning to ${originalBranch}...`);
      await checkoutBranch(originalBranch);
      success(`Back on ${originalBranch}`);
    }
  }

  // restore stash
  if (stashed) {
    step("Restoring stashed changes...");
    await popStash();
    success("Stash restored");
  }

  // summary
  console.log(chalk.cyan.bold("\n  ─── Summary ─────────────────────\n"));
  for (const r of results) {
    if (r.status === "success") {
      console.log(
        chalk.green(`  ✔ ${r.target}`) + chalk.gray(" — merged & pushed"),
      );
    } else {
      console.log(
        chalk.red(`  ✖ ${r.target}`) + chalk.gray(` — failed: ${r.error}`),
      );
    }
  }

  const failed = results.filter((r) => r.status === "failed");
  if (failed.length > 0) {
    throw new Error(`${failed.length} target(s) failed`);
  }

  console.log(chalk.green.bold(`\n  All done! Back on ${originalBranch} 🏠\n`));
}
