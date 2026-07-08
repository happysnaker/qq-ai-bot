# qq-ai-bot Sponsorware Roadmap

> `qq-ai-bot` is free and open source. Sponsorship accelerates operator-facing features, deployment validation, and documentation that are useful but time-consuming to maintain.

## Current sponsorware issues

| Issue | Outcome | Why it matters | Suggested funding |
|---|---|---|---:|
| [#23 End-to-end latency histograms](https://github.com/happysnaker/qq-ai-bot/issues/23) | **completed**: measure receive → agent → reply latency | helps operators debug slow QQ / OneBot / ACP turns | shipped |
| [#24 Postgres session store](https://github.com/happysnaker/qq-ai-bot/issues/24) | **completed**: add another external session persistence option | useful for operators already standardizing on Postgres | shipped |
| [#26 arm64 / CasaOS deployment validation](https://github.com/happysnaker/qq-ai-bot/issues/26) | multi-arch image confirmed; CasaOS/arm64 install report still open | helps homelab / CasaOS users know what is actually tested | ¥50 |

Support page: <https://happysnaker.github.io/support/#from-qq-ai-bot>

Discussion: <https://github.com/happysnaker/qq-ai-bot/discussions/30>

## What sponsorship gets prioritized

Sponsorship does not buy closed-source features by default. It prioritizes public work:

- implementation
- tests or smoke checks where practical
- operator documentation
- README / project-page updates
- clear caveats and non-goals
- issue closure with evidence

## Funding notes

When sponsoring a specific feature, include the issue number in the payment note or follow-up email, for example:

- `qq-ai-bot #23 latency`
- `qq-ai-bot #24 postgres`
- `qq-ai-bot #26 arm64`

If the funding is general support, use:

- `qq-ai-bot maintenance`

## Non-goals

Sponsorship does not mean:

- publishing private QQ credentials or screenshots
- bypassing OneBot / platform safety boundaries
- promising exactly-once delivery without the required architecture
- supporting every OneBot implementation equally without validation
- merging features without reviewable code and docs

## Completed sponsorware-style work

- Postgres session store is implemented for [#24](https://github.com/happysnaker/qq-ai-bot/issues/24).
- End-to-end turn / agent / reply latency histograms are implemented for [#23](https://github.com/happysnaker/qq-ai-bot/issues/23).
- Multi-instance / Redis operator notes are now published in [docs/multi-instance-notes.md](../multi-instance-notes.md).
- README links the published multi-instance guide from the sponsorware table.
- Open sponsorware issues are labeled with `sponsorship`.

## Suggested next public package

A small public demo bundle would help more than another vague feature:

- one fake-data deployment diagram
- one short screen recording or GIF
- one copy-paste config profile
- one troubleshooting checklist for OneBot WebSocket modes

Suggested target: **¥99**.
