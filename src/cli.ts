#!/usr/bin/env node

import {
  init,
  addRule,
  addSource,
  sync,
  status,
  list,
  remove,
} from "./commands/index.js";

type CommandResult = {
  exitCode: number;
};

type CommandHandler = (args: string[]) => Promise<void>;

const commandMap: Record<string, CommandHandler> = {
  init: async () => { await init(); },
  add: handleAdd,
  sync: handleSync,
  update: async () => { await sync({ force: true }); },
  status: async () => { await status(); },
  list: async () => { await list(); },
  ls: async () => { await list(); },
  remove: handleRemove,
  rm: handleRemove,
};

function isHelpCommand(command: string | undefined): boolean {
  return !command || command === "help" || command === "--help";
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

  return executeCommand(command, args.slice(1));
}

async function handleAdd(args: string[]): Promise<void> {
  if (args[0] === "source" && args.length >= 3) {
    await addSource({ alias: args[1], source: args[2] });
    return;
  }

  if (args.length >= 2) {
    await addRule({ name: args[0], source: args[1] });
    return;
  }

  console.error("Usage: ruleshare add <name> <source>");
  console.error("       ruleshare add source <alias> <github:owner/repo>");
}

async function handleSync(args: string[]): Promise<void> {
  const force = args.includes("--force") || args.includes("-f");
  console.log("Syncing rules...");
  await sync({ force });
}

async function handleRemove(args: string[]): Promise<void> {
  if (args.length < 1) {
    console.error("Usage: ruleshare remove <name>");
    return;
  }
  await remove({ name: args[0] });
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
  sync [--force]                Download rules to .claude/rules/shared/
  update                        Force update all rules
  status                        Check for outdated rules
  list, ls                      List configured rules and sources
  remove, rm <name>             Remove a rule

Examples:
  ruleshare init
  ruleshare add source anthropic github:anthropic/claude-rules
  ruleshare add typescript anthropic:typescript.md
  ruleshare sync
`);
}

main().then((result) => {
  process.exit(result.exitCode);
});
