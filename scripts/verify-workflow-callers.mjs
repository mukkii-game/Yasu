import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = (name) =>
  readFileSync(new URL(`../.github/workflows/${name}`, import.meta.url), 'utf8')

function topLevelMapping(source, key) {
  const lines = source.split(/\r?\n/)
  const start = lines.findIndex((line) => line === `${key}:`)
  assert.notEqual(start, -1, `missing top-level ${key} block`)

  const entries = {}
  for (const line of lines.slice(start + 1)) {
    if (line !== '' && !line.startsWith(' ') && !line.startsWith('#')) break
    const match = line.match(/^  ([a-z0-9-]+):\s*(.*?)\s*$/i)
    if (match) entries[match[1]] = match[2]
  }
  return entries
}

function assertOnlyUses(source, expected) {
  const uses = [...source.matchAll(/^\s+uses:\s*(\S+)\s*$/gm)].map(
    (match) => match[1],
  )
  assert.deepEqual(uses, [expected])
}

function assertMapping(source, key, expected) {
  assert.deepEqual(topLevelMapping(source, key), expected)
}

const ci = workflow('ci.yml')
assertOnlyUses(
  ci,
  'mukkii-game/ai-dev-infra/.github/workflows/verify-web.yml@v2',
)
assertMapping(ci, 'permissions', { contents: 'read' })

const guard = workflow('merge-guard.yml')
assertOnlyUses(
  guard,
  'mukkii-game/ai-dev-infra/.github/workflows/merge-guard.yml@v2',
)
assertMapping(guard, 'permissions', {
  contents: 'write',
  'pull-requests': 'write',
})
assertMapping(guard, 'concurrency', {
  group: 'merge-guard-${{ github.event.pull_request.number }}',
  'cancel-in-progress': 'true',
})

const pages = workflow('deploy-pages.yml')
assertOnlyUses(
  pages,
  'mukkii-game/ai-dev-infra/.github/workflows/deploy-pages.yml@v2',
)
assertMapping(pages, 'permissions', {
  contents: 'read',
  actions: 'read',
  pages: 'write',
  'id-token': 'write',
})
assertMapping(pages, 'concurrency', {
  group: 'pages',
  'cancel-in-progress': 'false',
})
assert.match(pages, /^  workflow_dispatch:\s*$/m)

console.log('Workflow caller contracts are valid.')
