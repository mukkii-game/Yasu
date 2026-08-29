# AGENTS.md

Working agreement for AI agents (Claude Code Cloud, OpenAI Codex Cloud) on this
repository.

## Source of truth

- GitHub `main` is the single source of truth.
- Always start work from the latest `main`.
- When a remote is available, `fetch`/`rebase` before finalizing, to confirm
  whether `main` moved while you were working.

## Concurrency

- Do not run Claude and Codex on this repository at the same time.

## Scope

- Normal game development tasks must not change `.github/**`. CI is owned by the
  central repository `mukkii-game/ai-dev-infra`; this repository only calls it.

## Documentation

- Read `SPEC.md` before changing behaviour, and update it when behaviour changes.
- Append design decisions worth keeping long-term to `DECISIONS.md`, briefly.

## Autonomy

- Implementation decisions are made autonomously by the AI. Ask a human only
  when a change is irreversible, outward-facing, or contradicts this file.

## Local commands

```
npm ci
npm run typecheck    # tsc --noEmit
npm test             # vitest run
npm run build        # vite build
npm run test:e2e     # playwright test (requires: playwright install chromium)
```
