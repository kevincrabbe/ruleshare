import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import {
  readConfig,
  readLock,
  writeLock,
  getSharedDir,
  createEmptyLock,
} from "../config.js";
import { resolveSource } from "../resolver.js";
import { fetchContent } from "../fetcher.js";
import type { SyncResult, SharedLock } from "../types.js";

type SyncArgs = {
  force?: boolean;
};

type SyncOutput = {
  results: SyncResult[];
};

export async function sync(args: SyncArgs = {}): Promise<SyncOutput> {
  const { force = false } = args;

  const config = await readConfig();
  if (!config) {
    console.error("No shared.json found. Run `ruleshare init` first.");
    return { results: [] };
  }

  const lock = (await readLock()) || createEmptyLock();
  const sharedDir = getSharedDir();
  await mkdir(sharedDir, { recursive: true });

  const results: SyncResult[] = [];

  for (const [name, source] of Object.entries(config.rules)) {
    const result = await syncRule({ name, source, lock, sharedDir, force });
    results.push(result);
  }

  await writeLock(lock);
  return { results };
}

type SyncRuleArgs = {
  name: string;
  source: string;
  lock: SharedLock;
  sharedDir: string;
  force: boolean;
};

async function syncRule(args: SyncRuleArgs): Promise<SyncResult> {
  const { name, source, lock, sharedDir, force } = args;

  try {
    return await attemptSync({ name, source, lock, sharedDir, force });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`  ${name}: error - ${message}`);
    return { name, status: "error", error: message };
  }
}

type AttemptSyncArgs = SyncRuleArgs;

async function attemptSync(args: AttemptSyncArgs): Promise<SyncResult> {
  const { name, source, lock, sharedDir, force } = args;

  const config = await readConfig();
  const resolved = resolveSource({ source, config: config! });
  const { content, sha } = await fetchContent({ resolved: resolved.resolved });

  const existingEntry = lock.rules[name];
  if (existingEntry?.sha === sha && !force) {
    console.log(`  ${name}: unchanged`);
    return { name, status: "unchanged" };
  }

  const filePath = join(sharedDir, `${name}.md`);
  await writeFile(filePath, content, "utf-8");

  lock.rules[name] = { source, sha, updated: new Date().toISOString() };

  const status = existingEntry ? "updated" : "created";
  console.log(`  ${name}: ${status}`);
  return { name, status };
}
