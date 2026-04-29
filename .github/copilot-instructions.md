---
name: No More Groceries Workspace Guidelines
description: Core architectural principles, UI constraints, and build rules for the No More Groceries application.
---

# No More Groceries Development Rules

## 1. Architecture & Data Flow
- **Data Source**: The application uses a local SQLite database (`data/groceries.db`). It does **NOT** connect directly to a live PostgreSQL database or the PC Express live API.
- **Data Refresh**: Data is synchronized daily via a backend cron job located at `jobs/daily-refresh/run.js`.
- **UI State**: Do *not* display "stale data" warnings to the user. The daily refresh model is intentional.

## 2. Design System (VaultWares UX)
- **Theme**: The default app style is a **Light Theme** (White background, Red/Burgundy accent color).
- **CSS Architecture**: We use the `vault-themes` submodule (`vault-themes/Brand/css2.css`). Always build UI components using strict `vault.*` primitives/tokens.
- **Tailwind v4**: Custom stylesheets (`styles.css`) that utilize `@apply` with theme variables *must* include `@reference "./tailwind.css";` at the top of the file.

## 3. Electron & Node execution
- **Console Output**: In the packaged Electron `.exe` (Windows), naive `stdout` or `console.log` writes from child processes can crash the app with an `EPIPE` error. All process logging *must* be gated behind `isDev` checks within `server.mjs` and `main.cjs`.
- **Build Verification**: Run `npm run electron:pack` (which runs Vite build first) to verify output. Do not run the `.exe` while it is currently open (Access Denied).

## 4. Workflows & State
- Always check the `PROJECT_STATUS.md` and `TODO.md` (or `TASKS.md`) before beginning large implementations, such as application settings or authentication flows. 
- Log your agent work to the shared ledger via PowerShell strictly as defined in `CLAUDE.md`.