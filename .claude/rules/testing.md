# Unit Testing

Unit tests should only test the subject under test and should mock, fake, or abstract out any externalities.

## Guidelines

- ALWAYS isolate the unit under test
- NEVER make real network calls in unit tests
- ALWAYS mock external dependencies (databases, APIs, file system)
- Use dependency injection to make code testable
- Test behavior, not implementation details
- Each test should test one thing

## Structure

Follow the AAA pattern:
1. **Arrange** - Set up test data and mocks
2. **Act** - Call the function under test
3. **Assert** - Verify the expected outcome

```typescript
// Good
describe('calculateTotal', () => {
  it('should sum item prices correctly', () => {
    // Arrange
    const items = [{ price: 10 }, { price: 20 }];

    // Act
    const result = calculateTotal({ items });

    // Assert
    expect(result.total).toBe(30);
  });
});
```
