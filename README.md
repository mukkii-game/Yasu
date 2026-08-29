# Yasu

A small Canvas game built with Vite + TypeScript, developed by AI agents from
both Claude Code Cloud and OpenAI Codex Cloud.

The game is deliberately minimal: this repository exists mainly as the standard
web-app template and as a live check that the central CI in
[`mukkii-game/ai-dev-infra`](https://github.com/mukkii-game/ai-dev-infra) works
end to end.

## Getting started

```sh
npm ci
npm run dev
```

Move the paddle with the arrow keys or the pointer, and press `R` to restart.

## Commands

| command | what it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | production build into `dist/` |
| `npm run preview` | serve the built bundle |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright browser tests (run `npx playwright install chromium` once) |

## CI

`.github/workflows/ci.yml` runs on pull requests and on pushes to `main`. It
calls the central reusable workflow
`mukkii-game/ai-dev-infra/.github/workflows/verify-web.yml@v1`, which installs
with `npm ci` and runs typecheck, unit tests, build, and Playwright. The CI
steps are not duplicated here.

## For AI agents

See [`AGENTS.md`](AGENTS.md) — plus [`SPEC.md`](SPEC.md) for behaviour and
[`DECISIONS.md`](DECISIONS.md) for design decisions.
