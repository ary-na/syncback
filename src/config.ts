export interface SyncbackConfig {
  from: string | null;
  into: string[];
  remote: string;
  push: boolean;
  dryRun: boolean;
  stash: boolean;
}

export function parseConfig(options: {
  from?: string;
  into?: string[];
  remote?: string;
  push?: boolean;
  dryRun?: boolean;
  stash?: boolean;
}): SyncbackConfig {
  if (!options.into || options.into.length === 0) {
    throw new Error("No target branch specified. Use --into <branch>");
  }

  return {
    from: options.from || null,
    into: options.into,
    remote: options.remote || "origin",
    push: options.push !== false,
    dryRun: options.dryRun || false,
    stash: options.stash !== false,
  };
}
