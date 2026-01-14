import { existsSync } from "node:fs";
import {
  getConfigPath,
  writeConfig,
  createEmptyConfig,
} from "../config.js";

type InitResult = {
  created: boolean;
  path: string;
};

export async function init(): Promise<InitResult> {
  const path = getConfigPath();

  if (existsSync(path)) {
    console.log(`Config already exists at ${path}`);
    return { created: false, path };
  }

  const config = createEmptyConfig();
  await writeConfig(config);

  console.log(`Created ${path}`);
  return { created: true, path };
}
