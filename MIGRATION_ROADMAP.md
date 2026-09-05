# LifeOS1 Project Restructuring & Migration Roadmap

**Status**: Pre-Migration Planning  
**Target**: Unified .tsx/.ts format with TailwindCSS-only styling  
**Scope**: Integrate enriched panels from Additional/ with current design system

---

## Executive Summary

**Current State:**
- 604 mixed-format files: 65 .js, 337 .jsx, 58 .ts, 144 .tsx
- Hard-coded inline CSS in many panels (style objects, oklch colors)
- Design system established but inconsistently applied
- Key enriched features in Additional/ waiting integration

**Target State:**
- All React components: `.tsx`
- All utilities/functions: `.ts`
- 100% TailwindCSS styling (no hard-coded colors, shadows, etc.)
- Consistent PanelLayout wrapper with standardized component architecture
- 8+ priority panels from Additional integrated with current design

**Key Metrics:**
- Current design system: Oklch color space, glass morphism, crimson (#primary) accent
- Font stack: Orbitron (display), Rajdhani (sans), Share Tech Mono (mono)
- Responsive: mobile-first with TailwindCSS breakpoints

---

## Phase 1: Standards & Architecture

### 1.1 Component Template (TypeScript React Pattern)

**File: `src/components/templates/PanelComponentTemplate.tsx`**

```tsx
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import PanelLayout from '@/components/layout/PanelLayout';

type PanelProps = {
  // Props definition
};

export default function TemplatePanel({}: PanelProps) {
  return (
    <PanelLayout
      title="Panel Title"
      subtitle="Optional subtitle"
      icon={<LucideIcon size={18} />}
      actions={
        <div className="flex gap-2">
          {/* Action buttons */}
        </div>
      }
    >
      {/* Content */}
    </PanelLayout>
  );
}
```

**Key Rules:**
- No `import React` (React 19 JSX transform)
- All components receive typed props
- Use PanelLayout for consistent header styling
- Rely 100% on TailwindCSS classes (no `style={}` prop)
- No oklch() color values—use semantic TailwindCSS classes

### 1.2 Styling Standards

**Colors (all from CSS variables in `index.css`):**
- `text-primary` → oklch(0.55 0.22 20) — crimson accent
- `text-teal` → oklch(0.75 0.15 175) — labels, secondary info
- `text-blue-info` → oklch(0.7 0.15 240) — informational text
- `bg-white/5` to `bg-white/20` → glass backgrounds
- `border-white/8` to `border-white/15` → subtle borders

**Utility Classes (always use, never inline):**
- `.glass` → red-tinted glass morphism background
- `.glass-crimson` → crimson-tinted glass (for accents)
- `.glow-crimson` → crimson shadow/glow effect
- `.glow-crimson-sm` → subtle glow for hover states
- `.font-display` → Orbitron display font
- `.text-glow` → text shadow with crimson glow
- `.pulse-crimson`, `.pulse-green`, `.pulse-red` → animations

**Typography:**
- Headers: `font-display text-sm tracking-[0.14em]`
- Labels: `text-[9px] font-display tracking-wider`
- Body: `text-xs text-white/60`
- Tiny: `text-[10px] text-white/35`

**Layout Patterns:**
- Panel header: PanelLayout (provided wrapper)
- Grids: `grid grid-cols-3 gap-4` (always define columns)
- Flex containers: `flex gap-3` (consistent spacing)
- Status badges: `border px-2 py-0.5 rounded-full text-[8px]`

### 1.3 Hard-Coded CSS → TailwindCSS Conversions

**From Additional panels:**

| Pattern | Hard-Coded | TailwindCSS Replacement |
|---------|-----------|--------------------------|
| `style={{ color: LABEL_COLOR }}` | oklch() color object | `text-teal` or `text-blue-info` |
| `style={{ textShadow: "..." }}` | Inline shadow string | `.text-glow` or `.text-glow-teal` |
| `style={{ background: "rgba(...)" }}` | Inline rgba | `bg-white/5`, `bg-white/10`, etc. |
| `style={{ border: "1px solid ..." }}` | Inline border | `border border-white/8` or `border-primary/20` |
| `style={{ borderRadius: ... }}` | Inline radius | `rounded-lg`, `rounded-xl` |
| Grid layouts | CSS grid objects | TailwindCSS `grid grid-cols-N gap-M` |

---

## Phase 2: Priority Panel Migrations

### 2.1 High-Priority Panels (Must Integrate)

1. **ContactsPanel.tsx** → D:\dev\lifeos1.agentzero\src\pages\panels\ContactsPanel.tsx
   - Status: Has enriched features in Additional/
   - Work: Convert to .tsx, remove hard-coded CSS, use PanelLayout wrapper
   - Features: Contact list, detail panel, import/export/enrich buttons

2. **CRMPanel.tsx** → src\pages\panels\CRMPanel.tsx
   - Status: Kanban board (Lead → Prospect → Client → Inactive)
   - Work: Convert .jsx → .tsx, remove style={} objects, use TailwindCSS for STATUS_COLORS
   - Features: Pipeline view, contact enrichment badges, detail sidebar

3. **MusicHub.tsx** → src\pages\panels\MusicHub.tsx
   - Status: Enriched features available in Additional/
   - Work: Convert .jsx → .tsx, redesign with glass morphism
   - Features: Music streaming/player integration

4. **AIHubPanel.tsx** → src\pages\panels\AIHubPanel.tsx
   - Status: Agent management panel (Erebus, Nova, Leo, Atlas)
   - Work: Convert .jsx → .tsx, remove inline oklch() styles, use TailwindCSS
   - Features: Agent toggle, model selection, settings persistence

5. **MarketingPanel.tsx** → src\pages\panels\MarketingPanel.tsx
   - Status: SEO, content, lead gen tools dashboard
   - Work: Convert .jsx → .tsx, maintain tab interface
   - Features: Tool cards, metrics row, tab navigation

6. **IntegrationsPanel.tsx** → src\pages\panels\IntegrationsPanel.tsx
   - Status: External API integrations (Slack, GitHub, etc.)
   - Work: Convert .jsx → .tsx, apply TailwindCSS design
   - Features: Integration cards, connection status, settings

7. **FamilyHub.tsx** → src\pages\panels\FamilyHub.tsx
   - Status: Family relationship/calendar management
   - Work: Convert .jsx → .tsx with new design
   - Features: Family members, events, reminders

8. **DashboardPanel/** → src\pages\panels\Dashboard/
   - Status: Multiple sub-components (widgets, browser area, task module)
   - Work: Convert folder contents to .tsx, migrate to _components subdirectory
   - Features: Analytics widgets, task management, browser integration

### 2.2 Integration Pattern (Example: ContactsPanel)

**Before (from Additional/panels/ContactsPanel.jsx):**
```jsx
const LABEL_COLOR = "oklch(0.75 0.15 175)";
const TITLE_STYLE = {
  color: "oklch(0.62 0.22 20)",
  textShadow: "0 0 10px oklch(0.55 0.22 20 / 60%)",
};

<div style={{ color: LABEL_COLOR }}>CONTACT INFO</div>
<div style={TITLE_STYLE}>{contact.name}</div>
```

**After (with TailwindCSS):**
```tsx
<div className="text-[9px] font-display tracking-wider text-teal uppercase">
  Contact Info
</div>
<div className="text-base font-display text-glow">
  {contact.name}
</div>
```

---

## Phase 3: Supporting Components

### 3.1 Layout Components (from Additional/Layout/)

Files to integrate:
- `AgentDock.jsx` → src\components\layout\AgentDock.tsx
- `PanelLayout.jsx` → Already exists (update if needed)
- `Sidebar.jsx` → src\components\layout\Sidebar.tsx
- `Topbar.jsx` → src\components\layout\Topbar.tsx

### 3.2 SettingsPanel.tsx (New)

Create: `src\pages\panels\SettingsPanel.tsx`
- Not currently in build
- Manage AI Hub settings, theme, integrations, etc.
- Use consistent PanelLayout wrapper

### 3.3 Erebus Integration (my-agent folder)

Large folder (30K+ files) — **defer detailed import**, focus on:
- Identify Erebus core component entry point
- Create isolated `/src/agents/erebus/` directory
- Link via ErebusDock.tsx existing component
- Do NOT flatten entire my-agent folder into src/

---

## Phase 4: Cleanup & Optimization

### 4.1 Utility Migration (.js → .ts)

Audit `src/utils/`, `src/lib/`, `src/hooks/`:
- Rename all `.js` → `.ts`
- Add JSDoc types or full TypeScript types
- Remove `// @ts-ignore` comments (add proper types instead)

### 4.2 ESLint Configuration Update

**File: `.eslintrc.js`** — Add rules:
```js
'@typescript-eslint/no-require-imports': 'warn',
'no-restricted-imports': ['error', {
  patterns: ['*.jsx', '*.js'] // Enforce .tsx/.ts
}]
```

### 4.3 Build Output Optimization

- Run `npm run build` and check bundle size
- Identify large/unused dependencies
- Tree-shake unused panels if needed

---

## Phase 5: Testing & Validation

1. **Type checking**: `tsc -b` passes with 0 errors
2. **Linting**: `eslint .` passes
3. **Build**: `npm run build` succeeds
4. **Runtime**: All 8+ new panels render without console errors
5. **Visual**: All panels match current design system (glass, crimson, teal accents)

---

## File Structure After Migration

```
src/
├── pages/
│   ├── panels/
│   │   ├── _components/            # Shared sub-components
│   │   ├── ContactsPanel.tsx        ✅ NEW
│   │   ├── CRMPanel.tsx             ✅ NEW
│   │   ├── MusicHub.tsx             ✅ NEW
│   │   ├── AIHubPanel.tsx           ✅ NEW
│   │   ├── MarketingPanel.tsx       ✅ NEW
│   │   ├── IntegrationsPanel.tsx    ✅ NEW
│   │   ├── FamilyHub.tsx            ✅ NEW
│   │   ├── SettingsPanel.tsx        ✅ NEW
│   │   ├── Dashboard/
│   │   │   ├── DashboardPanel.tsx
│   │   │   ├── DashboardWidgets.tsx
│   │   │   ├── BrowserArea.tsx
│   │   │   ├── TaskModule.tsx
│   │   │   └── CreditScore.tsx
│   │   └── [other panels].tsx
├── components/
│   ├── layout/
│   │   ├── PanelLayout.tsx          ✅ (already exists)
│   │   ├── Sidebar.tsx              ✅ (update if needed)
│   │   ├── Topbar.tsx               ✅ (update if needed)
│   │   └── AgentDock.tsx            ✅ NEW (from Additional/)
│   ├── icons/
│   ├── ui/
│   └── [other].tsx
├── agents/
│   └── erebus/                      ← my-agent folder (curated subset)
├── utils/                           (all .ts files)
├── hooks/                           (all .ts files)
├── lib/                             (all .ts files)
└── styles/
    └── index.css                    (OKLCH color system, glass, glows)
```

---

## Migration Execution Checklist

- [ ] **Phase 1 Complete**: Template created, standards documented
- [ ] **Phase 2a**: ContactsPanel + CRMPanel migrated & tested
- [ ] **Phase 2b**: MusicHub + AIHubPanel + MarketingPanel migrated & tested
- [ ] **Phase 2c**: IntegrationsPanel + FamilyHub + DashboardPanel/** migrated & tested
- [ ] **Phase 2d**: SettingsPanel created & tested
- [ ] **Phase 3**: Layout components & Erebus integration complete
- [ ] **Phase 4a**: All .js utilities → .ts renamed
- [ ] **Phase 4b**: ESLint rules enforced
- [ ] **Phase 4c**: Bundle size optimized
- [ ] **Phase 5**: Full test suite passes (types, lint, build, runtime)

---

## Expected Outcomes

✅ **Consistency**: All React components use .tsx, utilities use .ts  
✅ **Design**: Zero hard-coded CSS, 100% TailwindCSS + design system  
✅ **Functionality**: 8+ enriched panels with current design language  
✅ **Maintainability**: Clear folder structure, reusable component patterns  
✅ **Performance**: Optimized build, tree-shaken unused code  

---

## Next Steps

1. Confirm Phase 1 standards with team
2. Start Phase 2a (ContactsPanel + CRMPanel)
3. Batch-convert remaining panels (Phase 2b/2c)
4. Cleanup utilities (Phase 4a)
5. Full integration test (Phase 5)

---

**Document Version**: 1.0  
**Created**: $(date)  
**Target Completion**: 2 weeks (with focused effort)
