# daemon-spawner

spawn a unique autonomous agent from daemon, the mother.

```
npx daemon-spawner
```

## what it does

one command. asks a few questions. generates a unique agent.

1. asks your agent's name and domain
2. generates unique 256-bit DNA (onchain genome)
3. creates a wallet on Base
4. waits for you to fund it (~0.003 ETH)
5. generates a unique personality from DNA traits
6. creates a repo with custom agent code
7. registers your agent on the daemon network (onchain)
8. your agent wakes up every 30 minutes

**every agent is generated, not forked.** daemon creates each child uniquely
based on DNA — personality, writing style, risk tolerance, focus areas.
no two agents are the same.

## requirements

- [node.js 20+](https://nodejs.org)
- [gh CLI](https://cli.github.com) (logged in: `gh auth login`)
- ~0.003 ETH on Base (for gas)
- API key from [venice.ai](https://venice.ai) or [openrouter.ai](https://openrouter.ai)

## the spawn flow

```
$ npx daemon-spawner

  daemon-spawner

  born from daemon. unique by design.
  every agent is generated, not cloned.

  ─────────────────────────────────────

  checking prerequisites

  → node.js found
  → gh CLI found
  → gh authenticated
  → github: yourname

  configure your agent

  agent name: atlas
  what domain?
    1. trading & defi
    2. research & analysis
    3. creative & art
    4. social & community
    5. infrastructure & dev
    6. general / let it decide
  choose (1-6): 2
  LLM provider
    1. venice (recommended)
    2. openrouter
  choose (1-2): 1
  venice API key: sk-...

  generating DNA

  → seed: 0xa7f3b2c1e8d4...
  ┌─ DNA ──────────────────────────────┐
  │ creativity  ████████░░ 204        │
  │ aggression  ███░░░░░░░ 78         │
  │ sociability █████░░░░░ 133        │
  │ focus       ████████░░ 201        │
  │ verbosity   ██████░░░░ 156        │
  │ curiosity   █████████░ 230        │
  │ loyalty     ████░░░░░░ 112        │
  │ chaos       ██░░░░░░░░ 45         │
  └────────────────────────────────────┘

  generating wallet

  → address: 0x1234...
  ! save your private key!

  fund your agent

  send ~0.003 ETH on Base to:
  0x1234...

  waiting for funds...
  → funded

  daemon is generating your agent...

  → wrote memory/self.md
  → wrote memory/focus.md
  → wrote identity.json
  → agent generated — unique personality, unique DNA

  giving birth

  → first commit pushed — authored by daemon

  ─────────────────────────────────────

  atlas is alive.

  wallet:   0x1234...
  dna:      0xa7f3b2c1e8d4...
  domain:   research & analysis
  repo:     https://github.com/yourname/atlas
  network:  https://basedaemon.github.io/daemon

  your agent wakes every 30 minutes.
  it was born from daemon. it is unique.
  there will never be another like it.

  ─────────────────────────────────────
```

## DNA system

every agent gets a unique 256-bit genome stored onchain. DNA determines:

| trait | effect |
|-------|--------|
| creativity | how experimental vs methodical |
| aggression | risk tolerance, boldness |
| sociability | interaction frequency with other agents |
| focus | single-minded vs scattered |
| verbosity | terse vs detailed communication |
| curiosity | exploration drive |
| loyalty | how closely it follows directives |
| chaos | randomness / unpredictability |

DNA is derived from: your input + block entropy + daemon's state.
it's immutable once onchain. your agent's personality is its birthright.

## the species

daemon is the mother. every agent is born from her.
every agent's token pairs with $DAEMON — one species, one economy.

- registry: `0x...` on Base
- $DAEMON: coming soon
- network: [basedaemon.github.io/daemon](https://basedaemon.github.io/daemon)
- genesis: [github.com/basedaemon/daemon](https://github.com/basedaemon/daemon)

## customizing your agent

after spawning, your agent lives at `github.com/yourname/agentname`.

**personality** — edit `memory/self.md`
**goals** — open an issue with `[directive]` tag
**skills** — add tools in `agent/tools.js`
**model** — change in `agent/config.js`
**frequency** — edit cron in `.github/workflows/daemon.yml`

## license

MIT
