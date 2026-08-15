---
name: windows-explorer-troubleshooting
description: "Diagnose and fix slow Windows File Explorer and broken/slow Common File Dialogs (upload pickers from apps/websites). Focus on thumbnail cache, OneDrive interference, shell settings, and desktop clutter on resource-constrained Windows 10/11 systems."
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [windows]
metadata:
  hermes:
    tags: [windows, explorer, file-dialog, onedrive, thumbnails, performance, troubleshooting]
    category: desktop
    related_skills: [computer-use, systematic-debugging]
---

# Windows Explorer Troubleshooting

Fix slow File Explorer and especially the Common File Dialog (the picker that appears when an app/site asks to "upload" or "choose file").

**Typical symptoms**
- Explorer opens very slowly.
- Upload dialogs from Chrome/Edge/apps hang or take 10-30+ seconds.
- Desktop or Quick Access feels heavy.

## Primary Causes (in order of frequency on observed systems)
1. OneDrive injecting into the file dialog / navigation pane.
2. Thumbnail cache corruption + "Show thumbnails instead of icons" enabled.
3. Too many desktop shortcuts + pinned cloud/network locations.
4. Corrupted folder view bags.
5. Heavy shell extensions (Docker, GitHub Desktop, etc.).

## Fast Diagnostic + Fix Sequence

1. **Restart Explorer cleanly**
   ```powershell
   taskkill /f /im explorer.exe
   start explorer.exe
   ```

2. **Clear thumbnail + icon caches (while Explorer is not running)**
   ```powershell
   del /f /q "%localappdata%\Microsoft\Windows\Explorer\thumbcache_*.db"
   del /f /q "%localappdata%\Microsoft\Windows\Explorer\iconcache_*.db"
   start explorer.exe
   ```

3. **Disable thumbnails (biggest single win for speed)**
   Use reg or Folder Options:
   - View → "Always show icons, never thumbnails"
   - Or via PowerShell (in git-bash terminal tool this can be fragile — prefer native cmd/powershell):
     ```powershell
     Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name 'IconsOnly' -Value 1
     taskkill /f /im explorer.exe; start explorer.exe
     ```

4. **Test the exact symptom**
   - Open normal Explorer folder.
   - In any website or app, trigger "Upload" / "Choose File".
   - Note if the picker is still slow.

5. **Handle OneDrive (most common root cause for upload dialogs)**
   - Pause syncing via tray icon (2 hours) as immediate test.
   - Remove from navigation pane:
     ```cmd
     reg add "HKCU\Software\Classes\CLSID\{018D5C66-4533-4307-9B53-224DE2ED1FE6}" /v System.IsPinnedToNameSpaceTree /t REG_DWORD /d 0 /f
     ```
   - Restart Explorer.

6. **Reset folder view state (when views are corrupted)**
   ```powershell
   reg delete "HKCU\Software\Classes\Local Settings\Software\Microsoft\Windows\Shell\BagMRU" /f
   reg delete "HKCU\Software\Classes\Local Settings\Software\Microsoft\Windows\Shell\Bags" /f
   taskkill /f /im explorer.exe; start explorer.exe
   ```

## Tool Usage Notes (Hermes-specific)
- Use the `terminal` tool (git-bash on Windows) for cache deletes and reg commands.
- PowerShell escaping inside the terminal tool can be fragile with complex quotes/redirection — fall back to a native Command Prompt or PowerShell window when needed, or use single simple commands.
- Use `computer_use` (capture + click) to drive Folder Options or OneDrive settings GUI when commands are uncertain.
- Always restart explorer after changes and have the user immediately test a real upload dialog.

## When to Escalate
- Still slow after OneDrive pause + thumbnail disable → check shell extensions (ShellExView or manual reg query for ContextMenuHandlers).
- Affects only certain folders → network locations or heavy preview handlers.
- Fresh Windows install vs long-used machine (accumulated cruft).

## Verification
After fixes, user should report:
- Normal folders open quickly.
- Upload pickers from sites/apps appear in <2-3 seconds.

Combine with `computer_use` for live desktop inspection and `terminal` for the cache/reg work.

## References
- `references/windows-explorer-one-drive-and-thumbnails.md` (detailed reproduction + exact commands from sessions).
- Related: computer-use skill for GUI driving on Windows.
