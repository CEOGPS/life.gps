---
name: lifeos-jsx-migration
description: Convert LifeOS1 dashboard components from TypeScript (.tsx) to plain JavaScript (.jsx) to enable builds with Bun/Vite when TypeScript compiler is not available.
version: 1.0
---
# LifeOS JSX Migration Skill

Convert LifeOS1 dashboard components from TypeScript (.tsx) to plain JavaScript (.jsx) to enable builds with Bun/Vite when TypeScript compiler is not available.

## When to Use
- You have a LifeOS1 dashboard with .tsx files that need to run in an environment lacking `tsc`.
- Build fails due to TypeScript syntax errors (e.g., `:`, `as const`, type annotations).
- You want to keep the project using plain JSX while preserving functionality.

## Steps

1. **Rename files**
   ```bash
   find . -name '*.tsx' -exec sh -c 'mv "$0" "${0%.tsx}.jsx"' {} \;
   ```

2. **Update imports**
   Ensure any internal imports reference the new `.jsx` extension (though Vite often works without it, be safe):
   ```bash
   find . -name '*.jsx' -exec sed -i 's/\.tsx\"/.jsx\"/g' {} \;
   find . -name '*.jsx' -exec sed -i 's/\.tsx\'/.jsx\'/g' {} \;
   ```

3. **Remove TypeScript-specific syntax**
   - Delete `as const` assertions.
   - Remove type annotations in variable declarations: `const foo: Type = bar` → `const foo = bar`.
   - Remove type annotations in function parameters: `function foo(param: Type)` → `function foo(param)`.
   - Remove type annotations in arrow function parameters: `(param: Type) =>` → `(param) =>`.
   - Remove type aliases and interfaces (or convert to JSDoc comments if needed for clarity).
   - Remove generic type arguments in JSX: `<Component<Prop>>` → `<Component>`.
   - Remove `React.ReactNode` and similar imports; replace with plain children or remove if unused.

4. **Fix common patterns**
   - Replace `Record<string, string>` with plain object (no type).
   - Replace `Exclude<Category, \"All\">` with string union or plain string.
   - Replace `typeof STATUSES[number]` with plain string (define constant array and use string literals).
   - Replace `useState<Type>` with `useState()` and rely on initial value for type inference.

5. **Validate build**
   Run the build script to catch remaining issues:
   ```bash
   cd /path/to/LifeOS1
   bun run build
   ```
   If errors persist, inspect the output for remaining TypeScript syntax and repeat step 3.

6. **Commit changes**
   Ensure all `.tsx` files are removed and only `.jsx` remain.
   Update any configuration that might reference `.tsx` (e.g., `tsconfig.json` can be ignored or removed).

## Pitfalls
- **Missing `.env.example`**: The build may expect an `.env.example` file; create a placeholder if needed.
- **Missing context providers**: If the dashboard uses `WorkerContext` or `ModelContext`, ensure they are provided or stubbed.
- **Leftover `.tsx` references**: After conversion, some files may still reference `.tsx` in strings or dynamic imports; search and update.
- **Style loss**: Ensure any CSS modules or global styles still apply; class names are unchanged.
- **Runtime type safety**: You lose compile-time type checking; rely on PropTypes or runtime checks if needed.
- **JSX template literal syntax**: When using template literals in JSX attributes (like `className`), ensure they are properly formatted with backticks. Incorrect: \`className={\`text-${variable}\`}\` (missing closing backtick before }). Correct: \`className=\`text-${variable}\`\`.

## Verification
- The dashboard should load in the browser without console errors related to syntax.
- All components render as expected.
- No `vite` or `esbuild` transform errors appear.

## References
- See `references/jsx-conversion-tips.md` for detailed examples of TypeScript to JSX transformations.
- See `scripts/convert-to-jsx.sh` for a helper script (adjust paths as needed).