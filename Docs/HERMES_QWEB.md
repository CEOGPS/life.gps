Hermes + Qweb integration (quick guide)
=====================================

Overview
--------
This project supports connecting to a Hermes + Qweb scraping service. The connector in `src/lib/connectors/hermesQweb.js` exposes `triggerScrapeNow(source)` and `pollJob(jobId)` helpers.

Environment
-----------
Set these environment variables for Vite (prefix `VITE_`) or in your server worker:

- `VITE_HERMES_URL` — base URL for your Hermes instance (e.g. `https://hermes.example.com`)
- `VITE_HERMES_API_KEY` — bearer token used to authenticate requests to Hermes (optional if your Hermes is public/internal)

Examples
--------
Trigger a scrape (client-side):

1. Click the `Fetch Now` button on a source in Community Hub — it calls `triggerScrapeNow(source)`.
2. Hermes should return a job object like `{ jobId: 'abc123' }`.
3. Use `pollJob(jobId)` to wait for results or let Hermes push results to your sentinel ingestion endpoint.

Recommended architecture
------------------------
- Best: run a small server/worker that holds `HERMES_API_KEY` (not exposed to browsers). The UI should POST to your worker which forwards to Hermes. Worker forwards results to `/api/sentinel/capture` or your sentinel endpoint.
- Quick: if your Hermes instance is internal and secured, you can call it directly from the client using `VITE_HERMES_*` env vars, but avoid embedding secrets in public builds.

Next steps
----------
- Implement a server proxy at `/api/hermes/scrape` to hide the API key and handle CORS.
- Add scheduling (cron or Hermes scheduler) to poll active sources and push captured items into the sentinel pipeline.
