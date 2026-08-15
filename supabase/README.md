# LifeOS1 — SocialPanel: Storage + Brand Icons (merged)

This drop replaces the SocialPanel that the storage-fix zip overwrote.
Your local SocialPanel was still the old emoji version — this fixes both
the storage and the brand icons in one file.

## Files

```
src/components/lifeos/panels/SocialPanel.jsx   (full rewrite — storage + brand icons)
src/components/lifeos/icons/BrandIcon.jsx       (already in place, included for safety)
```

## What this version contains

- KV-backed persistence (replaces all localStorage; survives sessions)
- `<BrandIcon slug=... />` everywhere a platform logo appears (15+ spots)
- R2 image uploads (replaces base64 in localStorage)
- Save status badge in the header
- MAKE_WEBHOOK relocated to Worker secret

## Drop in + deploy

```powershell
cd C:\Users\caged\LifeOS1
# overlay the zip — preserves your folder structure 1:1
Remove-Item -Recurse -Force dist, node_modules\.vite -ErrorAction SilentlyContinue
npm run build
# then deploy
```

## Verify before deploying

After the drop:

```powershell
Select-String -Path src\components\lifeos\panels\SocialPanel.jsx -Pattern "BrandIcon|p\.icon" | Select-Object -First 5
```

Expected output: 5 lines all containing `BrandIcon`. Zero `p.icon` lines.
