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
import { resolveSource } from "../resolver.js";

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

  const { resolved } = resolveSource({ source, config });
  const extension = getExtension({ path: resolved.path });
  const filePath = join(getSharedDir(), `${name}${extension}`);
  if (existsSync(filePath)) {
    await unlink(filePath);
  }

  console.log(`Removed rule "${name}"`);
  return { removed: true, name };
}

type GetExtensionArgs = {
  path: string;
};

function getExtension(args: GetExtensionArgs): string {
  const { path } = args;
  const lastDot = path.lastIndexOf(".");
  if (lastDot === -1 || lastDot < path.lastIndexOf("/")) {
    return ".md";
  }
  return path.substring(lastDot);
}
