# ruleshare

Sync shared Claude Code rules from remote sources.

## Installation

```bash
npm install -g ruleshare
# or
npx ruleshare
```

## Usage

### Initialize

Create a `shared.json` config file in `.claude/rules/`:

```bash
ruleshare init
```

### Add Sources

Define source aliases to avoid repeating full GitHub paths:

```bash
ruleshare add source anthropic github:anthropic/claude-rules
ruleshare add source company github:mycompany/team-rules/rules
```

### Add Rules

Add rules using source aliases or full paths:

```bash
# Using alias
ruleshare add typescript anthropic:typescript.md
ruleshare add react anthropic:react.md

# Using full path
ruleshare add security github:company/rules/security.md@v2.0.0

# With version pinning
ruleshare add api-design company:backend/api.md@v1.0.0
```

### Sync Rules

Download all rules to `.claude/rules/shared/`:

```bash
ruleshare sync
```

### Check Status

See which rules are outdated:

```bash
ruleshare status
```

### Update Rules

Force re-download all rules:

```bash
ruleshare update
```

### List Configuration

Show configured sources and rules:

```bash
ruleshare list
```

### Remove Rules

```bash
ruleshare remove typescript
```

## File Structure

```
.claude/
└── rules/
    ├── your-team-rules.md      # Your own rules (not managed)
    ├── shared.json             # Config file (commit this)
    ├── shared.lock             # Lock file (commit this)
    └── shared/                 # Synced rules
        ├── typescript.md
        └── react.md
```

## Config Format

`.claude/rules/shared.json`:

```json
{
  "sources": {
    "anthropic": "github:anthropic/claude-rules",
    "company": "github:mycompany/team-rules/rules"
  },
  "rules": {
    "typescript": "anthropic:typescript.md",
    "react": "anthropic:react.md@v1.0.0",
    "security": "company:security.md"
  }
}
```

## Source Formats

| Format | Example |
|--------|---------|
| GitHub | `github:owner/repo/path/file.md` |
| GitHub + version | `github:owner/repo/path/file.md@v1.0.0` |
| Alias | `alias:path/file.md` |
| URL | `https://example.com/rules.md` |

## Private Repos

Private GitHub repos work automatically if you have the [GitHub CLI](https://cli.github.com/) authenticated:

```bash
gh auth login
```

No additional configuration needed. Ruleshare tries unauthenticated access first, then falls back to `gh` for private repos.

## License

MIT
