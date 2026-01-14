import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import {
  readConfig,
  readLock,
  writeLock,
  getSharedDir,
  createEmptyLock,
} from "../config.js";
import { resolveSource } from "../resolver.js";
import { fetchContent } from "../fetcher.js";
import type { SyncResult, SharedLock, SharedConfig } from "../types.js";

type SyncArgs = {
  force?: boolean;
};

type SyncOutput = {
  results: SyncResult[];
};

export async function sync(args: SyncArgs = {}): Promise<SyncOutput> {
  const { force = false } = args;

  const config = await loadAndValidateConfig();
  const ruleEntries = Object.entries(config.rules);

  if (ruleEntries.length === 0) {
    console.log("No rules configured. Use `ruleshare add` to add rules.");
    return { results: [] };
  }

  console.log("Syncing rules...");
  const results = await syncAllRules({ ruleEntries, config, force });

  printSummary({ results });
  return { results };
}

async function loadAndValidateConfig(): Promise<SharedConfig> {
  const config = await readConfig();
  if (!config) {
    throw new Error("No shared.json found. Run `ruleshare init` first.");
  }
  return config;
}

type SyncAllArgs = {
  ruleEntries: [string, string][];
  config: SharedConfig;
  force: boolean;
};

async function syncAllRules(args: SyncAllArgs): Promise<SyncResult[]> {
  const { ruleEntries, config, force } = args;
  const lock = (await readLock()) || createEmptyLock();
  const sharedDir = getSharedDir();
  await mkdir(sharedDir, { recursive: true });

  const results: SyncResult[] = [];
  for (const [name, source] of ruleEntries) {
    const result = await syncRule({ name, source, lock, sharedDir, force, config });
    results.push(result);
  }

  await writeLock(lock);
  return results;
}

type SyncRuleArgs = {
  name: string;
  source: string;
  lock: SharedLock;
  sharedDir: string;
  force: boolean;
  config: SharedConfig;
};

async function syncRule(args: SyncRuleArgs): Promise<SyncResult> {
  try {
    return await attemptSync(args);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`  ${args.name}: error - ${message}`);
    return { name: args.name, status: "error", error: message };
  }
}

type AttemptSyncArgs = SyncRuleArgs;

async function attemptSync(args: AttemptSyncArgs): Promise<SyncResult> {
  const { name, source, lock, sharedDir, force, config } = args;

  const resolved = resolveSource({ source, config });
  const { content, sha } = await fetchContent({ resolved: resolved.resolved });

  const existingEntry = lock.rules[name];
  if (existingEntry?.sha === sha && !force) {
    console.log(`  ${name}: unchanged`);
    return { name, status: "unchanged" };
  }

  const extension = getExtension({ source: resolved.resolved.path });
  const filePath = join(sharedDir, `${name}${extension}`);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf-8");

  lock.rules[name] = { source, sha, updated: new Date().toISOString() };

  const status = existingEntry ? "updated" : "created";
  console.log(`  ${name}: ${status}`);
  return { name, status };
}

type GetExtensionArgs = {
  source: string;
};

function getExtension(args: GetExtensionArgs): string {
  const { source } = args;
  const lastDot = source.lastIndexOf(".");
  if (lastDot === -1 || lastDot < source.lastIndexOf("/")) {
    return ".md";
  }
  return source.substring(lastDot);
}

type PrintSummaryArgs = {
  results: SyncResult[];
};

function printSummary(args: PrintSummaryArgs): void {
  const { results } = args;
  const created = results.filter((r) => r.status === "created").length;
  const updated = results.filter((r) => r.status === "updated").length;
  const unchanged = results.filter((r) => r.status === "unchanged").length;
  const errors = results.filter((r) => r.status === "error").length;

  const parts: string[] = [];
  if (created > 0) parts.push(`${created} created`);
  if (updated > 0) parts.push(`${updated} updated`);
  if (unchanged > 0) parts.push(`${unchanged} unchanged`);
  if (errors > 0) parts.push(`${errors} failed`);

  console.log(`Done: ${parts.join(", ")}`);
}
