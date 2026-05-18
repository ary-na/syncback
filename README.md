# ↺ syncback

> Automatically merge your branch into a target, push, and switch back — all in one command.

[![npm version](https://img.shields.io/npm/v/@ariian/syncback?color=black&style=flat-square)](https://www.npmjs.com/package/@ariian/syncback)
[![npm downloads](https://img.shields.io/npm/dm/@ariian/syncback?color=black&style=flat-square)](https://www.npmjs.com/package/@ariian/syncback)
[![license](https://img.shields.io/npm/l/@ariian/syncback?color=black&style=flat-square)](./LICENSE)
[![node](https://img.shields.io/node/v/@ariian/syncback?color=black&style=flat-square)](https://nodejs.org)

---

## The problem

Every time you need to push your work to `main`, `production`, or `release` you do this manually:

```bash
git checkout main
git pull origin main
git merge feature/my-branch
git push origin main
git checkout feature/my-branch  # easy to forget!
```

One slip — forgetting to switch back, or leaving a dirty state after a conflict — and you're in trouble.

---

## The solution

```bash
syncback --into main
```

syncback handles the full round trip: **switch → pull → merge → push → switch back**. If anything goes wrong it aborts cleanly and returns you to your original branch automatically.

---

## Install

```bash
npm install -g syncback
```

---

## Usage

```bash
# merge current branch into main
syncback --into main

# merge a specific branch into release
syncback --from feature/payments --into release

# merge into multiple targets at once
syncback --into main --into staging

# merge but don't push
syncback --into main --no-push

# preview what it will do without executing
syncback --into main --dry-run

# use a different remote
syncback --into main --remote upstream
```

---

## Options

| Option                   | Description                              | Default          |
|--------------------------|------------------------------------------|------------------|
| `-f, --from <branch>`    | Source branch to merge from              | current branch   |
| `-i, --into <branches...>` | Target branch(es) to merge into        | required         |
| `-r, --remote <remote>`  | Git remote to push to                    | `origin`         |
| `-n, --no-push`          | Merge locally, don't push                | `false`          |
| `-d, --dry-run`          | Preview commands without executing       | `false`          |
| `--no-stash`             | Don't auto-stash uncommitted changes     | `false`          |

---

## How it works

Given you're on `feature/my-branch` and run `syncback --into main`:

```
1. detect current branch    → feature/my-branch
2. git checkout main
3. git pull origin main     → get latest
4. git merge feature/my-branch
5. git push origin main
6. git checkout feature/my-branch  ← back home 🏠
```

If you pass multiple targets with `--into main --into staging`, it repeats the round trip for each one and always returns you home at the end.

---

## Conflict safety

If a merge conflict is detected, syncback will:

1. Abort the merge immediately
2. Return you to your original branch
3. Leave your working tree clean
4. Report exactly which target failed

You'll never be left stranded on the wrong branch.

---

## Auto stash

If you have uncommitted changes, syncback automatically stashes them before switching branches and restores them when it's done. Use `--no-stash` to disable this.

---

## Dry run

Not sure what syncback will do? Run with `--dry-run` to preview every git command without executing any of them:

```bash
syncback --into main --into staging --dry-run
```

Output:
```
  DRY RUN — no changes will be made

  git checkout main
  git pull origin main
  git merge feature/my-branch
  git push origin main
  git checkout feature/my-branch

  git checkout staging
  git pull origin staging
  git merge feature/my-branch
  git push origin staging
  git checkout feature/my-branch
```

---

## License

MIT © [arii](https://github.com/ary-na)
