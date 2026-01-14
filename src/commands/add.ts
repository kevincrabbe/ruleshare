import { readConfig, writeConfig, createEmptyConfig } from "../config.js";

const RESERVED_ALIASES = ["github", "http", "https", "file"];

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

  validateRuleName({ name });

  let config = await readConfig();
  if (!config) {
    config = createEmptyConfig();
  }

  config.rules[name] = source;
  await writeConfig(config);

  console.log(`Added rule "${name}" -> ${source}`);
  return { added: true, name };
}

type ValidateNameArgs = {
  name: string;
};

function validateRuleName(args: ValidateNameArgs): void {
  const { name } = args;
  checkNameNotEmpty({ name });
  checkNameChars({ name });
  checkNamePrefix({ name });
}

function checkNameNotEmpty(args: ValidateNameArgs): void {
  if (!args.name || args.name.trim() === "") {
    throw new Error("Rule name cannot be empty");
  }
}

function checkNameChars(args: ValidateNameArgs): void {
  const invalidChars = /[/\\:*?"<>|.]/;
  if (invalidChars.test(args.name) || args.name.includes("..")) {
    throw new Error(
      `Rule name "${args.name}" contains invalid characters. ` +
        `Avoid: / \\ : * ? " < > | .`
    );
  }
}

function checkNamePrefix(args: ValidateNameArgs): void {
  const firstChar = args.name[0];
  if (firstChar === "." || firstChar === "-") {
    throw new Error(`Rule name cannot start with "${firstChar}"`);
  }
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

  validateAliasName({ alias });

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

type ValidateAliasArgs = {
  alias: string;
};

function validateAliasName(args: ValidateAliasArgs): void {
  const { alias } = args;

  if (!alias || alias.trim() === "") {
    throw new Error("Alias name cannot be empty");
  }

  if (RESERVED_ALIASES.includes(alias.toLowerCase())) {
    throw new Error(
      `"${alias}" is a reserved name. ` +
        `Cannot use: ${RESERVED_ALIASES.join(", ")}`
    );
  }

  if (alias.includes(":")) {
    throw new Error("Alias name cannot contain ':'");
  }
}
