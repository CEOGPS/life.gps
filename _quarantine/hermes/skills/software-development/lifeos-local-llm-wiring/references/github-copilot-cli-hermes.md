# GitHub Copilot CLI ↔ Hermes Desktop

## Symptom
User installed **GitHub Copilot CLI** in the Hermes terminal; setup says **couldn't connect**. Hermes shows **`copilot: logged out`**. **`copilot`** / **`gh`** not found in agent git-bash `PATH`.

## Two Hermes integrations

| Provider | What it uses |
|----------|----------------|
| **`copilot`** | GitHub Copilot **API** (`api.githubcopilot.com`) — needs **`COPILOT_GITHUB_TOKEN`**, **`GH_TOKEN`**, **`GITHUB_TOKEN`**, or **`gh auth token`** (not classic `ghp_*`) |
| **`copilot-acp`** | Spawns **`copilot --acp --stdio`** — needs **`copilot`** on PATH or **`COPILOT_CLI_PATH`** |

Copilot CLI login in a terminal **does not** auto-register Hermes API auth.

## Fix: CLI on PATH (Windows)

When `copilot` is not global-installed, wrap **`npx @github/copilot`**:

- `%LOCALAPPDATA%\hermes\bin\copilot.cmd` — prepends Node + runs `npx -y @github/copilot@latest %*`
- Append to `~/.hermes/.env`: `COPILOT_CLI_PATH=C:/Users/<user>/AppData/Local/hermes/bin/copilot.cmd`
- `hermes config set terminal.path_prefix 'C:/Users/<user>/AppData/Local/hermes/bin;C:/Program Files/nodejs'`

Verify ACP status (from `hermes-agent` with `HERMES_HOME` set):

```python
from hermes_cli.auth import get_external_process_provider_status
get_external_process_provider_status("copilot-acp")  # configured + resolved_command
```

Ad-hoc: `%TEMP%\hermes-verify-copilot-wrapper.cmd` — files exist, `copilot.cmd --version`, ACP configured (not CI).

## Fix: Hermes API auth (user action)

In **PowerShell** (same environment as Copilot CLI):

```powershell
$env:HERMES_HOME = "$env:LOCALAPPDATA\hermes"
$env:PATH = "$env:LOCALAPPDATA\hermes\bin;C:\Program Files\nodejs;$env:PATH"
hermes model
```

Choose **GitHub Copilot** → **OAuth device code** (option 1), or **`gh auth login`** then **`hermes auth add copilot`**.

Optional launcher: `%LOCALAPPDATA%\hermes\bin\connect-copilot-hermes.bat` → `hermes model`.

## User steps after wiring

1. Finish **`copilot`** GitHub sign-in in terminal (not `ghp_` classic PAT).
2. Complete Hermes **device code** or **`hermes auth add copilot`**.
3. **New chat** → **GitHub Copilot** or **GitHub Copilot ACP** → pick model.

## Agent constraint

Do not `patch` `AppData/Local/hermes/config.yaml`; use **`hermes config set`** and `.env` for `COPILOT_CLI_PATH`. Do not read `~/.hermes/.env` in chat (secrets).