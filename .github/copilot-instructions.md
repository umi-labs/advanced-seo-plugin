# Copilot instructions — advanced-seo-plugin

Purpose: provide compact, actionable guidance for future Copilot CLI sessions working in this repo: build/test/lint commands, high-level architecture, and repo-specific conventions.

---

## Quick commands

- Install deps: `pnpm install`
- Dev (next dev for the bundled dev app): `pnpm dev`
- Dev with DB (spins up local docker DB): `pnpm dev:with-db`
- Start/stop dev DB only: `pnpm dev:db:up` / `pnpm dev:db:down`
- Build (types + JS via SWC): `pnpm build` (runs `build:types` then `build:swc`)
- Clean build output: `pnpm clean`
- Lint: `pnpm lint` — auto-fix: `pnpm lint:fix`

Tests
- Unit / integration (Vitest): `pnpm test:int` (runs `vitest`)
  - Run a single unit test file: `pnpm test:int -- path/to/file.spec.ts`
  - Run a single test name: `pnpm test:int -- --testNamePattern "pattern"`
- E2E (Playwright): `pnpm test:e2e` (runs `playwright test`)
  - Run a single E2E file: `pnpm test:e2e -- path/to/e2e.spec.ts`
  - Playwright is configured to use `./dev` as testDir and will run `pnpm dev` as the webServer (see playwright.config.js).

Build details
- `pnpm build:types` => `tsc --outDir dist --rootDir ./src` (emit d.ts into dist)
- `pnpm build:swc` => `swc ./src -d ./dist --config-file .swcrc` (transpile JS)

Notes: Node and pnpm engine constraints are in package.json; prefer the specified Node versions when running CI locally.

---

## High-level architecture

- This repo is a Payload CMS plugin template. The plugin entrypoint is `src/index.ts` which exports the plugin factory (pluginOptions) => (config) => config.
- Exposed package entrypoints (package.json `exports`) map to `src/index.ts`, `src/exports/client.ts`, and `src/exports/rsc.ts` for different consumption scenarios (server, client, RSC).
- `dev/` contains a minimal Payload app used for integration and E2E tests; vitest loads env from `dev` and Playwright runs that app when testing.
- Build output is emitted to `dist/` (JS + type declarations). `publishConfig` in package.json maps published `dist` files to the same exports layout.
- Tests:
  - Vitest runs integration/unit tests in Node environment (see vitest.config.js).
  - Playwright runs E2E tests located under `./dev` and assumes a running dev server at `http://localhost:3000/admin` (configured in playwright.config.js).

---

## Key conventions / repo-specific patterns

- Plugin factory pattern: export a function that returns a function which receives the incoming Payload `config` and returns a modified `config`.
  - Example shape: `const myPlugin = (opts) => (config) => { /* extend config */ return config }`.
- Always extend arrays/objects by preserving existing values using spread to avoid clobbering other plugins or the host app
  - Example: `config.collections = [ ...(config.collections || []), myCollection ]`
- Extending async lifecycle hooks (e.g., `onInit`): await the incoming hook before running plugin-specific logic
  - Example:
    ```ts
    config.onInit = async (payload) => {
      if (incomingConfig.onInit) await incomingConfig.onInit(payload)
      // plugin onInit work
    }
    ```
- Provide and export TypeScript types for plugin options (Types.ts style). Include JSDoc comments so editors show option docs to consumers.
- Dev .env: copy `dev/.env.example` -> `dev/.env` and set `DATABASE_URL` and `PAYLOAD_SECRET` before running `pnpm dev`.
- Keep package.json `exports` and `publishConfig` aligned with `src/` and `dist/` structure so bundlers and consumers resolve the correct entrypoints.
- Tests and CI assume `pnpm` and a Node version matching `engines` in package.json.

---

## Files and locations to check during automation

- Plugin runtime: `src/index.ts`
- Secondary exports: `src/exports/*.ts`
- Dev app (tests & E2E): `dev/`
- Vitest config: `vitest.config.js`
- Playwright config: `playwright.config.js`
- Build config & types: `.swcrc`, `tsconfig.json`, `package.json` scripts

---

## When editing or adding features

- Preserve existing config values via spread when adding collections, globals, hooks, or admin config.
- If adding `onInit` behavior, chain + await existing `onInit` to avoid breaking host apps.
- Ensure `tsc` emits type declarations to `dist/` (`emitDeclarationOnly`) and keep `publishConfig` in sync.

---

## AI assistant / tools config

- No repository-specific AI assistant config files were detected (CLAUDE.md, AGENTS.md, .cursorrules, .windsurfrules, CONVENTIONS.md, AIDER_CONVENTIONS.md, .clinerules).

---

If additional coverage is desired (examples for common plugin tasks, more test running examples, or CI snippets), include a note and it can be added.

(End of file)
