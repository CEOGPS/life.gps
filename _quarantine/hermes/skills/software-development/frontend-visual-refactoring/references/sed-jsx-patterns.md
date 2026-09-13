# Sed / Awk / Git Patterns for JSX Layout Edits

Collected from dashboard module refactoring sessions (grid spans, card reordering, size reductions, comment cleanup).

## Safe Size Reductions (single-line, low risk)
```bash
sed -i "s/padding: '24px',/padding: '16px',/" DashboardPanel.jsx
sed -i "s/minHeight: '260px',/minHeight: '180px',/" DashboardPanel.jsx
sed -i 's/gap: 16,/gap: 12,/' DashboardPanel.jsx
sed -i 's/gridAutoRows: "minmax(260px, auto)",/gridAutoRows: "minmax(170px, auto)",/' DashboardPanel.jsx
sed -i 's/maxWidth: 1392,/maxWidth: 1280,/' DashboardPanel.jsx
```

## Reordering a Small Card to Top of Grid (e.g. Time & Weather first)
```bash
# 1. Remove old instance (unique comment + content range)
sed -i '/ROW 1 (cont.): Time & Weather/,/<\/GridCard>/d' DashboardPanel.jsx

# 2. Insert at very first position inside the grid div
sed -i '/<div style={grid}>/a\
        <GridCard title="Time & Weather" icon={<Calendar size={14} />} gridColumn="span 3">\
          <ClockWidget />\
        </GridCard>' DashboardPanel.jsx
```

## Deduplicating After Insert (awk version — more robust for blocks)
```bash
awk '
/Time & Weather/ && /Calendar size=14/ { count++; if (count > 1) skip=1 }
/ClockWidget/ && skip { skip=0; next }
/^        <GridCard/ && skip { skip=0 }
{ if (!skip) print }
' DashboardPanel.jsx > /tmp/fixed.jsx && mv /tmp/fixed.jsx DashboardPanel.jsx
```

## Cleaning Garbled Comments (common after partial sed)
```bash
# Find the bad line
sed -n '1112p' DashboardPanel.jsx

# Replace entire line (use line number c\ )
sed -i '1112c\
        {/* ── ROW 1 (TOP): Time & Weather + TASKS + LINKS + LEADS ── */}' DashboardPanel.jsx
```

## Span Changes (target by title to avoid over-matching)
```bash
# Change specific card only
sed -i 's|title="Product Revenue"[^>]*gridColumn="span 4"|title="Product Revenue" ... gridColumn="span 3"|' file.jsx

# Or blanket then restore the wide ones manually
sed -i 's|gridColumn="span 4">|gridColumn="span 3">|g' file.jsx
```

## Safety Net (always before batches of risky edits)
```bash
git checkout -- src/components/.../DashboardPanel.jsx
git diff --stat
```

## Verification After Edits
```bash
# Count cards and check positions
grep -n "Time & Weather" file.jsx
grep -o 'gridColumn="span [0-9]*"' file.jsx | head -15

# Visual (in browser tools)
browser_navigate http://localhost:5173/#dashboard
browser_vision "top row modules, exact position of Time & Weather, any overlaps or blue casts"
```

Keep changes small. One conceptual change per sed run when possible. Restore early and often.