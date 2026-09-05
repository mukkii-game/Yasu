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

- CI lives in `mukkii-game/ai-dev-infra`; the workflows here are thin callers
  and track its `main`. Change the central repository rather than copying its
  steps into this one.

## Documentation

- The end-to-end suite in `e2e/` is the behavioural spec. `SPEC.md` is the
  player-facing summary: update it when a rule or a line of dialogue changes,
  not for every tuning pass.
- `DECISIONS.md` holds the handful of decisions that still shape the code.
  Append only a decision that would surprise the next agent; git history has
  the rest.

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
