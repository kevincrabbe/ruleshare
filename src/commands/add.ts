import { readConfig, writeConfig, createEmptyConfig } from "../config.js";

type AddRuleArgs = {
  name: string;
  source: string;
};

type AddRuleResult = {
  added: boolean;
  name: string;
};

export async function addRule(args: AddRuleArgs): Promise<AddRuleResult> {
  const { name, source } = args;

  let config = await readConfig();
  if (!config) {
    config = createEmptyConfig();
  }

  config.rules[name] = source;
  await writeConfig(config);

  console.log(`Added rule "${name}" -> ${source}`);
  return { added: true, name };
}

type AddSourceArgs = {
  alias: string;
  source: string;
};

type AddSourceResult = {
  added: boolean;
  alias: string;
};

export async function addSource(args: AddSourceArgs): Promise<AddSourceResult> {
  const { alias, source } = args;

  let config = await readConfig();
  if (!config) {
    config = createEmptyConfig();
  }

  if (!config.sources) {
    config.sources = {};
  }

  config.sources[alias] = source;
  await writeConfig(config);

  console.log(`Added source alias "${alias}" -> ${source}`);
  return { added: true, alias };
}
