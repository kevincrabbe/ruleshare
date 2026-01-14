import { readConfig, readLock } from "../config.js";
import { resolveSource } from "../resolver.js";
import { checkForUpdate } from "../fetcher.js";
import type { StatusEntry, SharedConfig, SharedLock } from "../types.js";

type StatusOutput = {
  entries: StatusEntry[];
  hasOutdated: boolean;
};

export async function status(): Promise<StatusOutput> {
  const config = await readConfig();
  if (!config) {
    console.error("No shared.json found. Run `ruleshare init` first.");
    return { entries: [], hasOutdated: false };
  }

  const lock = await readLock();
  if (!lock) {
    console.log("No lock file. Run `ruleshare sync` first.");
    return { entries: [], hasOutdated: false };
  }

  const entries = await collectStatusEntries({ config, lock });
  const hasOutdated = entries.some((e) => e.isOutdated);

  printStatusTable({ entries });

  return { entries, hasOutdated };
}

type CollectArgs = {
  config: SharedConfig;
  lock: SharedLock;
};

async function collectStatusEntries(args: CollectArgs): Promise<StatusEntry[]> {
  const { config, lock } = args;
  const entries: StatusEntry[] = [];

  for (const [name, source] of Object.entries(config.rules)) {
    const entry = await checkRuleStatus({ name, source, config, lock });
    entries.push(entry);
  }

  return entries;
}

type CheckStatusArgs = {
  name: string;
  source: string;
  config: SharedConfig;
  lock: SharedLock;
};

async function checkRuleStatus(args: CheckStatusArgs): Promise<StatusEntry> {
  const { name, source, config, lock } = args;
  const lockEntry = lock.rules[name];

  if (!lockEntry) {
    return createNotSyncedEntry({ name, source });
  }

  return checkRemoteStatus({ name, source, config, lockEntry });
}

type NotSyncedArgs = {
  name: string;
  source: string;
};

function createNotSyncedEntry(args: NotSyncedArgs): StatusEntry {
  const { name, source } = args;
  return {
    name,
    currentSha: "not synced",
    latestSha: "unknown",
    isOutdated: true,
    source,
  };
}

type CheckRemoteArgs = {
  name: string;
  source: string;
  config: SharedConfig;
  lockEntry: { sha: string };
};

async function checkRemoteStatus(args: CheckRemoteArgs): Promise<StatusEntry> {
  const { name, source, config, lockEntry } = args;

  try {
    const resolved = resolveSource({ source, config });
    const { isOutdated, latestSha } = await checkForUpdate({
      resolved: resolved.resolved,
      currentSha: lockEntry.sha,
    });

    return {
      name,
      currentSha: lockEntry.sha.substring(0, 8),
      latestSha: latestSha.substring(0, 8),
      isOutdated,
      source,
    };
  } catch {
    return {
      name,
      currentSha: lockEntry.sha.substring(0, 8),
      latestSha: "error",
      isOutdated: false,
      source,
    };
  }
}

type PrintArgs = {
  entries: StatusEntry[];
};

function printStatusTable(args: PrintArgs): void {
  const { entries } = args;

  console.log("\nRule Status:");
  console.log("-".repeat(60));

  for (const entry of entries) {
    const marker = entry.isOutdated ? "!" : " ";
    const status = entry.isOutdated ? "outdated" : "current";
    console.log(`${marker} ${entry.name}: ${entry.currentSha} (${status})`);
  }
}
