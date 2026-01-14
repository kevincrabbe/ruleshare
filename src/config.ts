import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import type { SharedConfig, SharedLock } from "./types.js";

const CONFIG_FILE = "shared.json";
const LOCK_FILE = "shared.lock";
const RULES_DIR = ".claude/rules";

export function getConfigPath(): string {
  return join(process.cwd(), RULES_DIR, CONFIG_FILE);
}

export function getLockPath(): string {
  return join(process.cwd(), RULES_DIR, LOCK_FILE);
}

export function getSharedDir(): string {
  return join(process.cwd(), RULES_DIR, "shared");
}

export async function readConfig(): Promise<SharedConfig | null> {
  const path = getConfigPath();
  if (!existsSync(path)) {
    return null;
  }
  const content = await readFile(path, "utf-8");
  try {
    return JSON.parse(content) as SharedConfig;
  } catch {
    throw new Error(`Invalid JSON in ${path}. Please fix or delete the file.`);
  }
}

export async function writeConfig(config: SharedConfig): Promise<void> {
  const path = getConfigPath();
  await mkdir(dirname(path), { recursive: true });
  const content = JSON.stringify(config, null, 2);
  await writeFile(path, content, "utf-8");
}

export async function readLock(): Promise<SharedLock | null> {
  const path = getLockPath();
  if (!existsSync(path)) {
    return null;
  }
  const content = await readFile(path, "utf-8");
  try {
    return JSON.parse(content) as SharedLock;
  } catch {
    throw new Error(`Invalid JSON in ${path}. Please fix or delete the file.`);
  }
}

export async function writeLock(lock: SharedLock): Promise<void> {
  const path = getLockPath();
  await mkdir(dirname(path), { recursive: true });
  const content = JSON.stringify(lock, null, 2);
  await writeFile(path, content, "utf-8");
}

export function createEmptyConfig(): SharedConfig {
  return { sources: {}, rules: {} };
}

export function createEmptyLock(): SharedLock {
  return { version: 1, rules: {} };
}
