# Windows Explorer + File Dialog Slowness (OneDrive + Thumbnails)

## Reproduction from session
- User on Windows 10, 12 GB RAM, GTX 1650 4 GB.
- Explorer slow to open.
- File upload dialogs from websites/apps extremely slow or non-responsive.
- Desktop cluttered with many shortcuts.

## Immediate Actions That Worked
1. Kill + restart:
   taskkill /f /im explorer.exe
   start explorer.exe

2. Clear caches (do while Explorer is dead):
   rm -f "$LOCALAPPDATA/Microsoft/Windows/Explorer/thumbcache_*.db"
   rm -f "$LOCALAPPDATA/Microsoft/Windows/Explorer/iconcache_*.db"

3. Disable thumbnails (IconsOnly = 1):
   Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name 'IconsOnly' -Value 1

4. OneDrive handling:
   - Pause via tray (immediate test).
   - Remove from navigation:
     reg add "HKCU\Software\Classes\CLSID\{018D5C66-4533-4307-9B53-224DE2ED1FE6}" /v System.IsPinnedToNameSpaceTree /t REG_DWORD /d 0 /f

5. Reset view state (when needed):
   reg delete "HKCU\Software\Classes\Local Settings\Software\Microsoft\Windows\Shell\BagMRU" /f
   reg delete "HKCU\Software\Classes\Local Settings\Software\Microsoft\Windows\Shell\Bags" /f

## Tool Notes (Hermes terminal on Windows)
- git-bash terminal tool has escaping issues with complex PowerShell/redirection.
- Prefer simple commands or run in native cmd/PowerShell when regdelete or long quoted strings are involved.
- Always follow cache/reg changes with explicit explorer restart and ask user to test a real upload dialog immediately.

## Verification
After steps, normal Explorer opens fast and upload pickers from browser/apps appear quickly (< 3s).

See main SKILL.md for full sequence and when to escalate to shell extensions.