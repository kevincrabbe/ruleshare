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
    console.error("No shared.json found.");
    return { removed: false, name };
  }

  if (!config.rules[name]) {
    console.error(`Rule "${name}" not found.`);
    return { removed: false, name };
  }

  delete config.rules[name];
  await writeConfig(config);

  const lock = await readLock();
  if (lock?.rules[name]) {
    delete lock.rules[name];
    await writeLock(lock);
  }

  const filePath = join(getSharedDir(), `${name}.md`);
  if (existsSync(filePath)) {
    await unlink(filePath);
  }

  console.log(`Removed rule "${name}"`);
  return { removed: true, name };
}
