#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  init,
  addRule,
  addSource,
  addAll,
  sync,
  status,
  list,
  remove,
} from "./commands/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf-8")
);
const VERSION = pkg.version as string;

type CommandResult = {
  exitCode: number;
};

type CommandHandler = (args: string[]) => Promise<void>;

const commandMap: Record<string, CommandHandler> = {
  init: async () => { await init(); },
  add: handleAdd,
  "add-all": handleAddAll,
  sync: handleSync,
  update: async () => { await sync({ force: true }); },
  status: async () => { await status(); },
  list: async () => { await list(); },
  ls: async () => { await list(); },
  remove: handleRemove,
  rm: handleRemove,
};

function isHelpCommand(command: string | undefined): boolean {
  return !command || command === "help" || command === "--help" || command === "-h";
}

function isVersionCommand(command: string | undefined): boolean {
  return command === "--version" || command === "-v";
}

async function executeCommand(command: string, args: string[]): Promise<CommandResult> {
  const handler = commandMap[command];

  if (!handler) {
    console.error(`Unknown command: ${command}`);
    printHelp();
    return { exitCode: 1 };
  }

  try {
    await handler(args);
    return { exitCode: 0 };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    return { exitCode: 1 };
  }
}

async function main(): Promise<CommandResult> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (isHelpCommand(command)) {
    printHelp();
    return { exitCode: 0 };
  }

  if (isVersionCommand(command)) {
    console.log(`ruleshare ${VERSION}`);
    return { exitCode: 0 };
  }

  return executeCommand(command, args.slice(1));
}

async function handleAdd(args: string[]): Promise<void> {
  if (args[0] === "source") {
    if (args.length < 3) {
      throw new Error(
        "Usage: ruleshare add source <alias> <github:owner/repo>"
      );
    }
    await addSource({ alias: args[1], source: args[2] });
    return;
  }

  if (args.length >= 2) {
    await addRule({ name: args[0], source: args[1] });
    return;
  }

  throw new Error(
    "Usage: ruleshare add <name> <source>\n" +
      "       ruleshare add source <alias> <github:owner/repo>"
  );
}

async function handleSync(args: string[]): Promise<void> {
  const force = args.includes("--force") || args.includes("-f");
  await sync({ force });
}

async function handleRemove(args: string[]): Promise<void> {
  if (args.length < 1) {
    throw new Error("Usage: ruleshare remove <name>");
  }
  await remove({ name: args[0] });
}

async function handleAddAll(args: string[]): Promise<void> {
  if (args.length < 1) {
    throw new Error("Usage: ruleshare add-all <source>");
  }
  await addAll({ source: args[0] });
}

function printHelp(): void {
  console.log(`
ruleshare - Sync Claude Code rules from remote sources

Usage:
  ruleshare <command> [options]

Commands:
  init                          Create shared.json config file
  add <name> <source>           Add a rule
  add source <alias> <source>   Add a source alias
  add-all <source>              Add all .md files from a source
  sync [--force]                Download rules to .claude/rules/shared/
  update                        Force update all rules
  status                        Check for outdated rules
  list, ls                      List configured rules and sources
  remove, rm <name>             Remove a rule

Examples:
  ruleshare init
  ruleshare add source kc github:kevincrabbe/kc-rules
  ruleshare add typescript kc:typescript.md
  ruleshare add-all kc:
  ruleshare sync
`);
}

main().then((result) => {
  process.exit(result.exitCode);
});
