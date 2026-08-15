@echo off
REM Hermes: Copilot CLI on PATH for copilot-acp (Hermes spawns copilot --acp --stdio)
setlocal
set "PATH=C:\Program Files\nodejs;%APPDATA%\npm;%PATH%"
npx -y @github/copilot@latest %*