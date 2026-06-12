# Code Quality Standards

This document outlines the code quality standards for the Lands of Glory project.

## TypeScript Configuration

### Strict Mode
Both `game-core` and `prototype` packages use TypeScript strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

## ESLint Rules

### Core Rules

#### game-core
The game-core package uses stricter rules:

- `@typescript-eslint/no-explicit-any`: **error** - No `any` types allowed
- `@typescript-eslint/explicit-function-return-type`: **warn** - Functions should have return types
- `@typescript-eslint/no-floating-promises`: **error** - Handle promises properly
- `@typescript-eslint/prefer-nullish-coalescing`: **warn** - Use `??` instead of `||`
- `@typescript-eslint/prefer-optional-chain`: **warn** - Use `?.` instead of deep checks
- `eqeqeq`: **error** - Always use `===` and `!==`
- `no-console`: **warn** - Avoid console in production code
- `no-debugger`: **error** - No debugger statements

#### prototype
The prototype uses slightly relaxed rules for UI development:

- `@typescript-eslint/no-explicit-any`: **error** - No `any` types allowed
- `@typescript-eslint/explicit-function-return-type`: **off** - Less strict for UI components
- `eqeqeq`: **error** - Always use `===` and `!==`
- `no-debugger`: **error** - No debugger statements

## Code Patterns

### Type Safety

#### ✅ Good
```typescript
// Explicit types
function calculateDamage(attack: number, defense: number): number {
  return Math.max(0, attack - defense);
}

// Proper interfaces
interface CombatResult {
  attackerWins: boolean;
  damage: number;
}

// Type guards
if ('scale' in sprite) {
  (sprite as ScalableSprite).scale.set(1);
}
```

#### ❌ Bad
```typescript
// Implicit any
function calculateDamage(attack, defense) {
  return attack - defense;
}

// Using any
const result: any = getCombatResult();

// Type assertion without check
(sprite as any).scale.set(1);
```

### Error Handling

#### ✅ Good
```typescript
try {
  const result = riskyOperation();
  return result;
} catch (error) {
  if (error instanceof GameRuleError) {
    showError(error.message);
  } else {
    console.error('Unexpected error:', error);
    showError('An unexpected error occurred');
  }
}
```

#### ❌ Bad
```typescript
try {
  const result = riskyOperation();
  return result;
} catch (e) {
  // Empty catch block
}
```

### Null Safety

#### ✅ Good
```typescript
// Optional chaining
const commander = state.commanders.get(id);
const position = commander?.position;

// Nullish coalescing
const health = unit?.health ?? 0;

// Type guards
if (commander !== undefined) {
  moveCommander(commander);
}
```

#### ❌ Bad
```typescript
// Direct access without check
const position = state.commanders.get(id).position; // May throw

// Falsy check for zero
const health = unit.health || 10; // Wrong if health is 0
```

## Testing Standards

### Test Structure

```typescript
describe('Feature', () => {
  describe('Specific behavior', () => {
    it('should do something when condition', () => {
      // Arrange
      const input = createTestData();
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toEqual(expected);
    });
  });
});
```

### Test Coverage

- **game-core**: Target 80% coverage
  - Unit tests for all public functions
  - Edge cases (empty inputs, boundary values)
  - Error conditions

- **prototype**: Target 60% coverage
  - Critical user paths
  - Integration tests

## Documentation Standards

### JSDoc Comments

All public functions should have JSDoc comments:

```typescript
/**
 * Calculate combat result between two commanders
 *
 * @param attacker - The attacking commander
 * @param defender - The defending commander
 * @param rng - Random number generator for dice rolls
 * @returns Combat result with casualties and winner
 * @throws {GameRuleError} If combat is invalid
 *
 * @example
 * const result = resolveCombat(state, attackerId, defenderId, rng);
 * if (result.attackerWins) {
 *   console.log('Attacker won!');
 * }
 */
export function resolveCombat(
  state: GameState,
  attackerId: CommanderId,
  defenderId: CommanderId,
  rng: SeededRNG
): CombatResult {
  // Implementation
}
```

### README Files

Each package should have:
- Installation instructions
- Usage examples
- API overview
- Testing instructions

## Performance Guidelines

### game-core
- Pure functions where possible
- Immutable state updates
- No side effects in game logic
- Efficient algorithms (A* for pathfinding)

### prototype
- 60 FPS target
- Efficient rendering (PixiJS best practices)
- Debounced input handling
- Lazy loading where appropriate

## Git Standards

### Commit Messages

Follow conventional commits:

```
feat: add combat resolution system
fix: correct movement range for cavalry
docs: update API documentation
test: add combat unit tests
refactor: simplify banner rendering
style: fix indentation in game.ts
```

### Code Review Checklist

Before submitting PR:
- [ ] All tests pass
- [ ] No ESLint errors
- [ ] TypeScript compiles without errors
- [ ] JSDoc comments added/updated
- [ ] README updated if needed
- [ ] No `console.log` statements (or justified)
- [ ] No `any` types (or justified)

## Continuous Integration

### Pre-commit Hooks

Recommended setup:
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write", "git add"]
  }
}
```

### CI Pipeline

1. Install dependencies
2. Run linting
3. Run type checking
4. Run tests
5. Build packages

## Tools

### Required
- TypeScript 5.0+
- ESLint with @typescript-eslint
- Prettier (consistent formatting)

### Recommended
- VS Code with:
  - ESLint extension
  - Prettier extension
  - TypeScript Importer
  - GitLens

## Code Review Guidelines

### Reviewer Responsibilities

1. **Functionality**: Does it work as intended?
2. **Tests**: Are there adequate tests?
3. **Type Safety**: Are types correct and strict?
4. **Documentation**: Is it documented?
5. **Performance**: Any obvious issues?
6. **Style**: Consistent with codebase?

### Author Responsibilities

1. Self-review before requesting review
2. Respond to comments promptly
3. Keep PRs focused and small
4. Explain complex logic in comments

## Legacy Code

When modifying legacy code:
1. Add types incrementally
2. Add tests for changed code
3. Document why changes were made
4. Consider refactoring if touching extensively

## Migration Guide

### Upgrading TypeScript Strictness

1. Enable one strict flag at a time
2. Fix all errors before enabling next flag
3. Update tests as needed
4. Document breaking changes

### Removing `any` Types

1. Identify all `any` usages
2. Determine correct type
3. Add type or interface
4. Update tests

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Clean Code TypeScript](https://github.com/labs42io/clean-code-typescript)
