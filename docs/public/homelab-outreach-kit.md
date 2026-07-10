# Homelab / CasaOS Outreach Kit

> Copy-ready, public-safe outreach material for finding real ARM / CasaOS testers for `qq-ai-bot`. Use this kit to ask for validation without over-claiming physical-host support.

## Current ask

`qq-ai-bot` already has:

- a stable `v0.1.7` image and moving `latest` image;
- `linux/amd64` and `linux/arm64` GHCR manifests;
- GitHub Actions CI, CodeQL, Docker publish, and arm64 QEMU smoke;
- a [15-minute ARM / CasaOS tester pack](arm64-casaos-tester-pack.md).

The remaining gap is one real physical ARM / CasaOS / NAS / SBC report with redacted evidence.

Tracking issue: [qq-ai-bot#26](https://github.com/happysnaker/qq-ai-bot/issues/26).

## Best links

- Project page: <https://happysnaker.github.io/qq-ai-bot/>
- Tester pack: <https://github.com/happysnaker/qq-ai-bot/blob/main/docs/public/arm64-casaos-tester-pack.md>
- Issue #26: <https://github.com/happysnaker/qq-ai-bot/issues/26>
- Latest arm64 smoke: <https://github.com/happysnaker/qq-ai-bot/actions/runs/29100777408>
- CasaOS app-store PR: <https://github.com/Cp0204/CasaOS-AppStore-Play/pull/42>
- Support route: <https://happysnaker.github.io/support/#from-qq-ai-bot>

## Short post — CasaOS / homelab communities

```markdown
Looking for one real ARM / CasaOS tester for `qq-ai-bot`.

It is a self-hosted QQ ↔ AI bridge for OneBot 11 / NapCat / LLOneBot + ACP-compatible agents.

Already proven:
- GHCR image publishes linux/amd64 + linux/arm64
- CI / CodeQL / Docker publish pass
- arm64 image boots under GitHub Actions QEMU smoke
- /readyz, /status, and /metrics are checked

Still missing:
- one real physical ARM / NAS / SBC / CasaOS install report

Tester pack:
https://github.com/happysnaker/qq-ai-bot/blob/main/docs/public/arm64-casaos-tester-pack.md

Tracking issue:
https://github.com/happysnaker/qq-ai-bot/issues/26

Please redact QQ account details, OneBot tokens, group/user IDs, QR/login screenshots, private chat content, and public IPs before posting logs/screenshots.
```

## Very short post

```text
Need one real ARM/CasaOS tester for qq-ai-bot.

CI/QEMU arm64 smoke is green, but I still need a physical ARM/NAS/SBC/CasaOS report.

Tester pack:
https://github.com/happysnaker/qq-ai-bot/blob/main/docs/public/arm64-casaos-tester-pack.md
```

## Maintainer / PR follow-up snippet

Use this only when a maintainer asks for maturity / install evidence, or on a scheduled weekly recheck. Do not paste it repeatedly into the same PR.

```markdown
Small status update for the homelab / app-store path:

- stable image: `ghcr.io/happysnaker/qq-ai-bot:v0.1.7`
- moving image: `ghcr.io/happysnaker/qq-ai-bot:latest`
- arm64 QEMU smoke: https://github.com/happysnaker/qq-ai-bot/actions/runs/29100777408
- physical-host tester pack: https://github.com/happysnaker/qq-ai-bot/blob/main/docs/public/arm64-casaos-tester-pack.md

Remaining caveat is still honest: I do not have a real CasaOS / physical ARM report yet; that is tracked in https://github.com/happysnaker/qq-ai-bot/issues/26.
```

## Sponsor / supporter snippet

```markdown
The cleanest current funding target for `qq-ai-bot` is physical ARM / CasaOS validation.

QEMU smoke already proves the linux/arm64 image boots and serves health / metrics. What is still missing is a real ARM / NAS / SBC / CasaOS report from an operator host.

Use payment note: `qq-ai-bot #26 arm64`.

Support page:
https://happysnaker.github.io/support/#from-qq-ai-bot
```

## What not to say

- Do not claim physical CasaOS validation is complete until a real report lands.
- Do not describe QEMU smoke as equivalent to a physical host.
- Do not publish QQ credentials, login QR screenshots, OneBot tokens, group IDs, user IDs, private chat content, or unredacted IPs.
- Do not promise support for every NAS / SBC / CasaOS variant.
- Do not repeatedly bump open PRs without new maintainer feedback or new evidence.

## Follow-up policy

- Use this kit for a new community post or a scheduled weekly recheck.
- Prefer one concise source-linked update over repeated “any update?” comments.
- If a tester reports a failure, record hardware / OS / image tag / health endpoint results first, then turn it into a concrete issue.
