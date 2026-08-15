# Dashboard rail layout — edit pitfalls (LifeOS1)

## RailColumn pattern

```jsx
function RailColumn({ gridColumn, children }) {
  return (
    <div style={{ gridColumn, display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
      {children}
    </div>
  );
}
```

Inner cards: `gridColumn={false}` so span applies to the column wrapper only.

## Duplicate embeds

After moving YouTube to center rail, **grep** `YouTubePlayer` / second `YouTube` GridCard — remove flat-layout duplicate or smoke script fails.

## Daily tips

`getDaily(list, count = 5)` — Chris spec: **5 solid tips/day** for money + life hacks (date-seeded).

## System verification nudge

When environment demands proof after UI edits: run **smoke + build + scoped eslint**; report exit codes. Do not claim pixel-perfect without `npm run dev` + browser vision.