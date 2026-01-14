# Priorities

Focus 80% on readability and 20% on performance.

In order of importance:
1. Correctness and functionality
2. Readability & Maintainability
3. Performance

# Comments

Add comments only when they explain WHY, not WHAT.
The code itself should be readable enough to show WHAT it does.

DO NOT comment obvious operations like:
```typescript
// increment counter
counter++;
```

DO comment:
- Business logic reasoning
- Non-obvious decisions
- Workarounds or edge cases
- Complex algorithms (brief summary of approach)

Example of a good comment:
```typescript
// Using ceil() here because partial units must be charged as full units per billing policy
const billableUnits = Math.ceil(usage / unitSize);
```

# Development Workflow

After implementing something, always run:
```bash
npm run lint && npm run typecheck
```

Run these in the directory you modified (for monorepos, run in the specific package directory).

## Advisory Code Quality Checks

Consider running these tools to detect code quality issues:

```bash
npm run jscpd   # Detect copy-paste / duplicate code
npm run knip    # Detect unused files, dependencies, and exports
```

These are NOT blocking—code can be committed even if they report issues. However, you SHOULD consider fixing them:
- **jscpd**: Duplicate code often indicates opportunities to extract shared utilities
- **knip**: Unused exports and dependencies add maintenance burden

# Test-Driven Development (TDD)

Use TDD when implementing functions, hooks, or components with **cyclomatic complexity > 2**.

**TDD workflow:**
1. Write the test first (red)
2. Write minimal code to pass (green)
3. Refactor while keeping tests green

**When to apply TDD:**
- Functions with branching logic (if/else, switch, ternary chains)
- Hooks with state machines or complex state transitions
- Components with conditional rendering based on multiple conditions
- Any logic that handles error states, loading states, or edge cases

# Code Review Feedback

When review feedback presents multiple options (e.g., "wire up X **or** remove Y"), always choose the option that **adds value** over the one that merely removes code:

- **Prefer wiring up** unused fields/features over deleting them—they often exist for a reason
- **Prefer fixing** the root cause over working around it
- **Prefer completing** partial implementations over removing them

Removing code is the lazy path. Before choosing deletion, ask: "Is there a reason this exists? Would wiring it up solve a user-facing problem?"

# Session Completion

When ending a work session, complete ALL steps:

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items

Work is NOT complete until you've verified quality gates pass.
