import simpleGit, { SimpleGit } from "simple-git";

const git: SimpleGit = simpleGit();

export async function getCurrentBranch(): Promise<string> {
  const status = await git.status();
  if (!status.current) {
    throw new Error("Could not determine current branch");
  }
  return status.current;
}

export async function hasUncommittedChanges(): Promise<boolean> {
  const status = await git.status();
  return status.files.length > 0;
}

export async function stashChanges(): Promise<void> {
  await git.stash();
}

export async function popStash(): Promise<void> {
  await git.stash(["pop"]);
}

export async function checkoutBranch(branch: string): Promise<void> {
  await git.checkout(branch);
}

export async function pullBranch(
  remote: string,
  branch: string,
): Promise<void> {
  await git.pull(remote, branch);
}

export async function mergeBranch(branch: string): Promise<void> {
  await git.merge([branch]);
}

export async function abortMerge(): Promise<void> {
  try {
    await git.merge(["--abort"]);
  } catch (_) {
    // nothing to abort
  }
}

export async function pushBranch(
  remote: string,
  branch: string,
): Promise<void> {
  await git.push(remote, branch);
}
