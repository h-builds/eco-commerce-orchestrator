# Project Context

## Security and Architecture Notes

### Resolving Prototype Pollution (Code Injection)
**Commits:**
- `097f889` - fix(app): resolve prototype pollution in graphql route
- `71b88b8` - chore(config): pin exact dependency versions in package.json

**Approach:**
- **Dynamic Object Keys:** When indexing objects with dynamic strings that come from user input, databases, or external JSON RPC services, avoid using plain JavaScript objects (`{}`) as they are vulnerable to prototype pollution if the key is `__proto__`. 
- **Fix:** Always use JavaScript `Map` objects (`new Map()`) and its `.get()` / `.set()` methods instead of bracket notation for collections with dynamic string keys. This is immune to prototype poisoning.
- **Scanner False Positives:** Static analysis tools (like `semgrep`) may flag safe array indices (e.g., `i` in a `for` loop) or static properties as object injection risks. These should be treated as False Positives and safely suppressed via the local SecureCoder API instead of arbitrarily refactoring working and safe component code.

### UI Component Refactoring
**Commits:**
- `f174527` - refactor(components): extract redundant conditional classes

**Approach:**
- **Conditional Classes:** Extract repeated utility classes from conditional logic branches to simplify JSX and improve readability in components.
