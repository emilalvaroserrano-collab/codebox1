# Eburon Codebox AGENTS.md — Desktop renderer (/packages/desktop/src)

## Runtime / commands

- **Runtime: Bun** in `electron-codebox/` (the Next.js app). Same dev/prod pattern. Production deploy goes to `.next/standalone/server.js`.

## Architecture notes

- This package is the Eburon Codebox Electron desktop renderer at `/packages/desktop/public/ui.html`.
- It consumes API routes from the upstream app on `http://localhost:5174` (the Next.js server in a sibling worktree — not this directory's dev server). Voice orb connects to that backend via WebSocket.

## Gotchas

- The Electron main process (`main.cjs`) and UI live under `dist-electron/`. Never edit `dist-*` from source directly—treat it as build output.
- The desktop view relies on the parent app's API (threads, files, voice) running at port 5174 — changes outside of `/packages/desktop/src/*` won't take effect without restarting that upstream process.
