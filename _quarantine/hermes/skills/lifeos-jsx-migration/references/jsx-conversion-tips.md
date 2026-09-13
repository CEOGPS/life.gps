# JSX Conversion Tips

## Common TypeScript to JSX conversions

### Type Aliases and Interfaces
Remove them entirely if they are only used for type checking. If they are used for documentation, consider converting to JSDoc comments.

**Before:**
```typescript
type User = {
  id: string;
  name: string;
};

interface Props {
  user: User;
  onClick: (id: string) => void;
}
```

**After:**
```javascript
// No direct equivalent. If needed for documentation, use JSDoc:
/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 */
/**
 * @typedef {Object} Props
 * @property {User} user
 * @property {(id: string) => void} onClick
 */
```

### Function Components with Type Annotations
Remove the type annotations from parameters and return type.

**Before:**
```typescript
const MyComponent: React.FC<Props> = ({ user, onClick }: Props) => {
  return <div onClick={() => onClick(user.id)}>{user.name}</div>;
};
```

**After:**
```javascript
const MyComponent = ({ user, onClick }) => {
  return <div onClick={() => onClick(user.id)}>{user.name}</div>;
};
```

### useState with Type Arguments
Remove the type argument and let the initial value infer the type.

**Before:**
```typescript
const [count, setCount] = useState<number>(0);
const [user, setUser] = useState<User | null>(null);
```

**After:**
```javascript
const [count, setCount] = useState(0);
const [user, setUser] = useState(null);
```

### Object Types
Replace `Record<string, string>` with a plain object literal or remove the type.

**Before:**
```typescript
const colors: Record<string, string> = {
  primary: '#ff0000',
  secondary: '#00ff00',
};
```

**After:**
```javascript
const colors = {
  primary: '#ff0000',
  secondary: '#00ff00',
};
```

### Union Types as Props
Replace with a comment or remove if not needed for runtime.

**Before:**
```typescript
type Status = 'active' | 'inactive' | 'pending';

const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
  return <span>{status}</span>;
};
```

**After:**
```javascript
// Status can be: 'active', 'inactive', 'pending'
const StatusBadge = ({ status }) => {
  return <span>{status}</span>;
};
```

### Generic Components
Remove the generic type parameter.

**Before:**
```typescript
const List: React.FC<{ items: T[] }> = ({ items }) => {
  return <ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
};
```

**After:**
```javascript
const List = ({ items }) => {
  return <ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
};
```

### as const Assertions
Remove the `as const` and use a regular array or object. If you need to prevent reassignment, use `const` (which is already the case for object/array literals in const declarations).

**Before:**
```typescript
const COLORS = ['red', 'green', 'blue'] as const;
const STATUS = { ACTIVE: 'active', INACTIVE: 'inactive' } as const;
```

**After:**
```javascript
const COLORS = ['red', 'green', 'blue'];
const STATUS = { ACTIVE: 'active', INACTIVE: 'inactive' };
```
Note: The array is still mutable unless you use Object.freeze, but in React, we usually don't mutate these.

### Enums
Convert to a plain object.

**Before:**
```typescript
enum Status {
  Active = 'active',
  Inactive = 'inactive',
}
```

**After:**
```javascript
const Status = {
  Active: 'active',
  Inactive: 'inactive',
};
```

### Namespaces
Convert to a regular object.

**Before:**
```typescript
namespace Utils {
  export function formatDate(date: Date) {
    return date.toISOString();
  }
}
```

**After:**
```javascript
const Utils = {
  formatDate(date) {
    return date.toISOString();
  },
};
```

## JSX-Specific Tips
- Remove `React.` from JSX element types if you're not using the React namespace (e.g., `<React.Fragment>` -> `<>` or `<Fragment>` if imported).
- Ensure you have the necessary imports for JSX (usually `import React from 'react'` is not needed in new JSX transform, but keep it if using old JSX or if you use React.jsx).

## Testing
After conversion, run the app and check the console for any runtime errors. Use PropTypes or TypeScript (if you want to keep type checking in a separate step) to validate props if necessary.
