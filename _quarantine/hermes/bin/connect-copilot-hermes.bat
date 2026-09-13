@echo off
REM Launch Hermes Copilot API login (device code) — links GitHub Copilot to Spencer
set HERMES_HOME=C:/Users/chris/AppData/Local/hermes
set PATH=C:\Users\chris\AppData\Local\hermes\bin;C:\Program Files\nodejs;%PATH%
set COPILOT_CLI_PATH=C:\Users\chris\AppData\Local\hermes\bin\copilot.cmd
hermes model
@echo.
@echo In the menu: pick GitHub Copilot (or Copilot ACP), complete login if prompted.
pause