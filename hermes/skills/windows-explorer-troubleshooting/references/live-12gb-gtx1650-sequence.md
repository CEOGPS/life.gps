# Live Windows Explorer + File Dialog Fix Sequence (12GB RAM + GTX 1650 4GB)

From session on resource-constrained Windows 10 machine where main Explorer was slow and upload pickers from sites/apps would not load.

## Exact commands that worked (git-bash terminal tool)
```bash
# Kill explorer
taskkill /f /im explorer.exe

# Clear caches
rm -f "$LOCALAPPDATA/Microsoft/Windows/Explorer/thumbcache_*.db"
rm -f "$LOCALAPPDATA/Microsoft/Windows/Explorer/iconcache_*.db"

# Restart to apply
start explorer.exe

# Disable thumbnails (IconsOnly=1)
# (PowerShell or reg)

# OneDrive kill + hide (critical for upload dialogs)
taskkill /f /im OneDrive.exe
reg add "HKCU\Software\Classes\CLSID\{018D5C66-4533-4307-9B53-224DE2ED1FE6}" /v System.IsPinnedToNameSpaceTree /t REG_DWORD /d 0 /f

# Restart
taskkill /f /im explorer.exe
start explorer.exe
```

## Verification
User must report:
- Normal folders open reasonably.
- Upload/Choose File from Chrome/Edge appears quickly (<3s).

## Notes
- OneDrive process kill + namespace reg was more effective than tray pause for dialogs.
- Thumbnail disable + cache clear gave the visible speed improvement for main Explorer.
- Always pair with computer_use capture to see current state before/after.
- On low RAM systems, desktop clutter + cloud providers compound the problem.

## Related
See main SKILL.md for full sequence and escalation.