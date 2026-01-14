# Types

## Avoid using 'any'

## Do not define inline object types

Do not define object/record types inline in parameter lists or return types. Create a named type/interface (or import an existing one) and use that name in the signature. Do the same for return shapes (e.g. `Promise<Result>` not `Promise<{…}>`).

```typescript
// Bad
async execute(args: { sessionId: string; voiceId: string }): Promise<{ sessionAudioId: string }> { … }

// Good
export type ExecuteArgs = {
  sessionId: string;
  voiceId: string;
};

export type ExecuteResult = {
  sessionAudioId: string;
};

export async function execute(args: ExecuteArgs): Promise<ExecuteResult> {
  …
}
```

## Use 'is' and 'has' prefixes for booleans

# Functions

## Use the RORO pattern

Receive an object, return an object.

# Complexity

## Keep cyclomatic complexity below 6

If you have a large switch case, consider strategy pattern/dispatch table.

## Do not chain more than 2 array iteration methods

Store as variable and continue on next line if more processing is needed.

## Do not nest blocks more than 3 levels deep

# Validation

## Use Zod for data validation and transformation

NEVER write verbose field-by-field if-statements:

```typescript
// Bad
if (data.field1 !== undefined) updateValues.field1 = data.field1;
if (data.field2 !== undefined) updateValues.field2 = data.field2;
```

ALWAYS use Zod schemas:

```typescript
// Good
const updateSchema = z.object({
  field1: z.string().optional(),
  field2: z.number().optional(),
}).strict();

type UpdateData = z.infer<typeof updateSchema>;
const validated = updateSchema.parse(data);
```
