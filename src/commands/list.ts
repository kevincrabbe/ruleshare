import { readConfig, readLock } from "../config.js";

type RuleEntry = {
  name: string;
  source: string;
  synced: boolean;
};

type SourceEntry = {
  alias: string;
  url: string;
};

type ListOutput = {
  rules: RuleEntry[];
  sources: SourceEntry[];
};

export async function list(): Promise<ListOutput> {
  const config = await readConfig();
  if (!config) {
    console.log("No shared.json found. Run `ruleshare init` first.");
    return { rules: [], sources: [] };
  }

  const lock = await readLock();

  const rules = Object.entries(config.rules).map(([name, source]) => ({
    name,
    source,
    synced: !!lock?.rules[name],
  }));

  const sources = Object.entries(config.sources || {}).map(([alias, url]) => ({
    alias,
    url,
  }));

  printSources({ sources });
  printRules({ rules });
  printEmptyMessage({ rules, sources });

  return { rules, sources };
}

type PrintSourcesArgs = {
  sources: SourceEntry[];
};

function printSources(args: PrintSourcesArgs): void {
  const { sources } = args;
  if (sources.length === 0) return;

  console.log("\nSources:");
  for (const { alias, url } of sources) {
    console.log(`  ${alias}: ${url}`);
  }
}

type PrintRulesArgs = {
  rules: RuleEntry[];
};

function printRules(args: PrintRulesArgs): void {
  const { rules } = args;
  if (rules.length === 0) return;

  console.log("\nRules:");
  for (const { name, source, synced } of rules) {
    const marker = synced ? "✓" : " ";
    console.log(`  ${marker} ${name}: ${source}`);
  }
}

type PrintEmptyArgs = {
  rules: RuleEntry[];
  sources: SourceEntry[];
};

function printEmptyMessage(args: PrintEmptyArgs): void {
  const { rules, sources } = args;
  if (rules.length === 0 && sources.length === 0) {
    console.log("\nNo rules or sources configured.");
  }
}
