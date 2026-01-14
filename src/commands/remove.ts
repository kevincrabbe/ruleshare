import { unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  readConfig,
  writeConfig,
  readLock,
  writeLock,
  getSharedDir,
} from "../config.js";

type RemoveArgs = {
  name: string;
};

type RemoveResult = {
  removed: boolean;
  name: string;
};

export async function remove(args: RemoveArgs): Promise<RemoveResult> {
  const { name } = args;

  const config = await readConfig();
  if (!config) {
    throw new Error("No shared.json found.");
  }

  if (!config.rules[name]) {
    throw new Error(`Rule "${name}" not found.`);
  }

  const source = config.rules[name];
  delete config.rules[name];
  await writeConfig(config);

  const lock = await readLock();
  if (lock?.rules[name]) {
    delete lock.rules[name];
    await writeLock(lock);
  }

  const extension = getExtension({ source });
  const filePath = join(getSharedDir(), `${name}${extension}`);
  if (existsSync(filePath)) {
    await unlink(filePath);
  }

  console.log(`Removed rule "${name}"`);
  return { removed: true, name };
}

type GetExtensionArgs = {
  source: string;
};

function getExtension(args: GetExtensionArgs): string {
  const { source } = args;
  const lastDot = source.lastIndexOf(".");
  const lastSlash = source.lastIndexOf("/");
  const lastAt = source.lastIndexOf("@");
  const pathEnd = lastAt > lastSlash ? lastAt : source.length;
  const dotInPath = lastDot > lastSlash && lastDot < pathEnd;
  if (!dotInPath) {
    return ".md";
  }
  return source.substring(lastDot, pathEnd);
}
