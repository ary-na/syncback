import { Command } from "commander";
import chalk from "chalk";
import { parseConfig } from "./config";
import { run } from "./index";

const pkg = require("../package.json");

console.log(
  chalk.cyan.bold("\n  ↺  syncback") + chalk.gray(` v${pkg.version}\n`),
);

const program = new Command();

program
  .name("syncback")
  .description(
    "Merge your branch into a target, push, and switch back automatically",
  )
  .version(pkg.version, "-v, --version", "output the version number")
  .option("-f, --from <branch>", "source branch (defaults to current branch)")
  .option("-i, --into <branches...>", "target branch(es) to merge into")
  .option("-r, --remote <remote>", "git remote (default: origin)", "origin")
  .option("-n, --no-push", "merge locally but do not push")
  .option("-d, --dry-run", "preview commands without executing")
  .option("--no-stash", "do not auto-stash uncommitted changes")
  .action(async (options) => {
    try {
      const config = parseConfig(options);
      await run(config);
    } catch (err: any) {
      console.error(chalk.red("\n  ✖  " + err.message + "\n"));
      process.exit(1);
    }
  });

program.parse(process.argv);
