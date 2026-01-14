# Ruleshare

A CLI tool for syncing Claude Code rules from remote sources.

## Development

- After implementing something, always run `npm run lint`
- After implementing something, run `npm run typecheck`

## Code Style

- Keep cyclomatic complexity below 6 (enforced by ESLint)
- Keep files under 200 lines (enforced by ESLint)
- Keep functions under 30 lines (enforced by ESLint)
- Follow the RORO pattern (receive object, return object)
- Use explicit return types on all functions

## Architecture

This is a simple CLI tool with the following structure:

```
src/
├── cli.ts           # CLI entry point and command routing
├── commands/        # Individual command implementations
├── config.ts        # shared.json and shared.lock handling
├── fetcher.ts       # GitHub/URL fetching logic
├── resolver.ts      # Source alias resolution
└── types.ts         # Type definitions
```

## Rules

See @.claude/rules/typescript.md for TypeScript conventions.
See @.claude/rules/general.md for general coding guidelines.
See @.claude/rules/testing.md for testing guidelines.
