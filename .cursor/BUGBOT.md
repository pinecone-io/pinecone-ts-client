# Code Review Guidance

## Quick Reference

Verify: code compiles, tests pass, JSDoc updated, no generated code edits, proper error handling, input validation, adequate test coverage, TypeScript types are correct.

## Code Quality Review

### Documentation

- Update JSDoc near changed code. Include `@throws` tags for errors that methods can throw. Use code blocks with ` ```typescript ` for public API examples. Document parameter constraints and validation rules. JSDoc must describe actual behavior, not intended behavior.
- All public methods/classes/interfaces need complete JSDoc. Provide examples for complex APIs. Document parameters and return values clearly. Use TypeDoc tags like `@param`, `@returns`, `@throws`, `@example`.
- Mark internal APIs with `/** @internal */` to exclude them from public documentation.

### Error Handling

- Use custom error classes from `src/errors`: `PineconeArgumentError` for invalid inputs, `PineconeBadRequestError` for bad requests, etc. All custom errors extend `BasePineconeError`. Avoid generic `Error` instances.
- Error messages must be descriptive, actionable, and reference docs when appropriate. When wrapping errors, preserve cause: `new ErrorClass(message, cause)`.
- Map HTTP status codes to errors using `mapHttpStatusError` patterns. Ensure consistent error handling across the codebase.

### Validation

- Validate inputs early in public methods. Throw `PineconeArgumentError` with clear messages. Use helper validation functions for reusable logic. Explicitly check `null`, `undefined`, and empty strings/arrays.
- Handle edge cases (`null`, `undefined`, empty, max values) with appropriate error messages. Leverage TypeScript's type system to catch many issues at compile time.

### Code Generation

- Never edit `src/pinecone-generated-ts-fetch/**` files directly. Update source OpenAPI/Proto files in `codegen/` and regenerate using `npm run generate:openapi`. Verify regeneration results.

### Testing

- Capture all major requirements as tests. Unit tests cover validation and error paths. Integration tests cover end-to-end workflows (sparingly). Test success and failure scenarios including edge cases. Use descriptive test names.
- Tests must be readable, maintainable, follow coding standards, avoid unnecessary complexity, use mocks appropriately. Use Jest's `describe` and `it` blocks effectively.
- Test both Node.js and Edge runtime environments when applicable (see `jest.config.integration-node.js` and `jest.config.integration-edge.js`).

### Async/Await and Concurrency

- Prefer `async/await` over promise chains for readability. Handle promise rejections properly. Use `Promise.all()` for parallel operations when appropriate.
- Be aware of shared mutable state in async contexts. Document concurrency guarantees in JSDoc. Verify async operations are properly awaited and errors are caught.

### Resource Management

- Reuse HTTP client instances where possible. Document resource lifecycle in JSDoc. Ensure cleanup in error scenarios (use `try/finally` or `finally` blocks). Verify no resource leaks in normal and error paths.
- Close streams, file handles, and other resources properly. Use `AbortController` for request cancellation when appropriate.

### Code Style

- Code must be readable, follow TypeScript/JavaScript idioms, prefer clarity over cleverness. Use descriptive names. Break up files over 800 lines. Modules should have single responsibility.
- Follow ESLint and Prettier configurations. Use TypeScript's type system effectively (avoid `any` when possible, use proper types and interfaces).
- Avoid breaking public interfaces. If unavoidable, provide migration path and deprecation strategy. Document breaking changes in PR description. Use `@deprecated` JSDoc tags.

## Pull Request Review

### PR Title and Description

- Title: Use Conventional Commits 1.0.0 format (e.g., `fix: handle undefined values in query method`). Clearly describe PR purpose.
- Description: Problem and solution, GitHub/Linear issue references, usage examples, value summary (concise), relevant links.

### Code Changes

- Scope: Single concern per PR. Focused changes. Separate unrelated changes.
- Backward compatibility: Maintain when possible. Document and justify breaking changes. Add deprecation warnings for removed functionality.
- Dependencies: No unnecessary additions. Justify and document new dependencies. Ensure version compatibility. Check `package.json` and `package-lock.json` changes.

## Common Issues

- Missing null/undefined checks (especially public APIs)
- Incomplete error handling
- Missing tests for new functionality
- Outdated JSDoc
- Resource leaks (unclosed streams, unhandled promises)
- Breaking changes without notice
- Editing generated code directly (`src/pinecone-generated-ts-fetch/**`)
- Using `==` instead of `===` (use strict equality)
- Error swallowing (log or rethrow, avoid empty catch blocks)
- Array/object mutation during iteration (create a copy first or use `filter`/`map`)
- Mutable objects as Map/Set keys (ensure immutability or use proper identity)
- String concatenation in loops (use template literals or `Array.join()`)
- Using `any` type unnecessarily (leverage TypeScript's type system)
- Incorrect optional chaining/nullish coalescing usage (use `?.` and `??` appropriately)
- Not preserving error cause (use `new ErrorClass(message, cause)`)
- Date/time API misuse (use native `Date` appropriately, consider libraries like `date-fns` for complex operations)
- Memory leaks with event listeners (remove listeners in cleanup)
- Not validating array/object contents (validate elements, not just reference)
- Object comparison with `==` (use `===` or deep equality when needed)
- Ignoring promise rejections (handle with `.catch()` or `try/catch` in async functions)
- Missing `await` on async operations
- Incorrect type assertions (use type guards instead of `as` when possible)
- Not handling both Node.js and Edge runtime differences
- Using `var` instead of `const`/`let`
- Missing return type annotations on public functions
- Not using TypeScript's `readonly` for immutable data structures

## Review Focus by Change Type

**Bug Fixes**: Address root cause, not symptoms. No regressions. Handle related edge cases. Tests demonstrate fix.

**New Features**: Complete and functional. Well-designed public API with documentation. Tests cover happy path and errors. No breaking changes unless intentional.

**Refactoring**: Behavior unchanged (verify with tests). More maintainable/readable. No performance regressions. Update docs if needed.

**Performance Improvements**: Measurable and significant. No correctness regressions. Tests verify improvement. Document trade-offs.
