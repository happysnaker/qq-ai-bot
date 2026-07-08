# qq-ai-bot Public Landing Page Section

> Copy-ready landing section for reviewers, operators, homelab users, and sponsor conversations. It is source-linked to public repo evidence instead of relying on broad claims.

## One-sentence positioning

`qq-ai-bot` is a self-hosted QQ ↔ AI bridge for OneBot 11 / NapCat / LLOneBot and ACP-compatible agents, with persistent sessions, progress streaming, Docker packaging, metrics, and operator-facing deployment evidence.

## Short landing section

`qq-ai-bot` is not another chat demo. It is the integration layer around a QQ bot:

- OneBot 11 transport wiring for NapCat / LLOneBot;
- ACP-compatible agent dispatch;
- per-chat session reuse and persistence;
- progress messages back to QQ;
- Prometheus-style `/metrics` plus `/readyz` and `/status`;
- Docker image publishing for `linux/amd64` and `linux/arm64`;
- deployment caveats for multi-instance, Redis, and OneBot WebSocket modes.

The current stable release is [`v0.1.7`](https://github.com/happysnaker/qq-ai-bot/releases/tag/v0.1.7). It adds public arm64 smoke evidence around the Docker image path.

## Proof ladder

Open these in order if you only have a few minutes:

| Step | Proof surface | What it proves |
|---|---|---|
| 1 | [Getting started](../getting-started.md) | the basic OneBot → bot → ACP agent path is documented |
| 2 | [Architecture](../../ARCHITECTURE.md) | transport, session state, command handling, and ACP bridge are separated |
| 3 | [Deployment validation](../deployment-validation.md) | multi-arch image, arm64 compose override, smoke script, and QEMU smoke workflow are documented |
| 4 | [v0.1.7 release](https://github.com/happysnaker/qq-ai-bot/releases/tag/v0.1.7) | latest stable release carries CI, Docker publish, and arm64 smoke evidence |
| 5 | [Multi-instance notes](../multi-instance-notes.md) | Redis and horizontal deployment limits are documented honestly |
| 6 | [Sponsorware roadmap](sponsorware.md) | current operator-facing funding target is explicit |
| 7 | [Ecosystem tracker](ecosystem-tracker.md) | public OneBot / NapCat / LLOneBot / Docker / CasaOS / Umbrel surfaces are tracked |

## Current public evidence

- Latest release: <https://github.com/happysnaker/qq-ai-bot/releases/tag/v0.1.7>
- Tag CI: <https://github.com/happysnaker/qq-ai-bot/actions/runs/28968030296>
- Tag Docker publish: <https://github.com/happysnaker/qq-ai-bot/actions/runs/28968030324>
- Tag arm64 QEMU smoke: <https://github.com/happysnaker/qq-ai-bot/actions/runs/28968114761>
- OneBot ecosystem listing: <https://onebot.dev/ecosystem>
- OneBot community discussion: <https://github.com/orgs/botuniverse/discussions/264>
- ACP clients docs PR merged: <https://github.com/agentclientprotocol/agent-client-protocol/pull/1592>
- NapCat docs integration merged: <https://github.com/NapNeko/NapCatDocs/pull/132>
- LLOneBot docs PR active: <https://github.com/LLOneBot/LuckyLilliaDoc/pull/20>
- Docker Compose sample PR active: <https://github.com/docker/awesome-compose/pull/781>
- CasaOS app-store PR active: <https://github.com/Cp0204/CasaOS-AppStore-Play/pull/42>

## Arm64 / CasaOS honesty

What is proven now:

- GHCR publishes multi-arch image tags.
- `v0.1.7` has a passing GitHub Actions arm64 QEMU smoke run.
- The smoke artifact confirms `linux/arm64`, container `running`, `/readyz ok`, `/status ok`, and `qq_ai_bot_build_info` metrics for the tag.

What is still open:

- real CasaOS app-store flow on a physical ARM host;
- real NAS / SBC / homelab install report;
- operator-submitted logs through the [arm64 / CasaOS report template](../../.github/ISSUE_TEMPLATE/arm64_casaos_report.md).

Tracked in [qq-ai-bot#26](https://github.com/happysnaker/qq-ai-bot/issues/26).

## Reviewer quick path

```bash
npm install
npm run check
npm run smoke:agent
```

Docker / arm64 evidence path:

```bash
docker buildx imagetools inspect ghcr.io/happysnaker/qq-ai-bot:v0.1.7
IMAGE=ghcr.io/happysnaker/qq-ai-bot:v0.1.7 ./scripts/smoke-arm64-image.sh
```

## Sponsor CTA

The project is free and open source. Sponsorship accelerates boring but useful operator work:

- real CasaOS / physical ARM validation;
- deployment docs and troubleshooting;
- demo bundles and screenshots;
- WebSocket mode compatibility checks;
- richer media / attachment boundaries;
- public ecosystem follow-up.

Support page: <https://happysnaker.github.io/support/#from-qq-ai-bot>.

Best payment note format: `qq-ai-bot #26` for arm64 / CasaOS validation, or `qq-ai-bot maintenance` for general support.

## Copy snippets

### GitHub / forum copy

```markdown
`qq-ai-bot` is a self-hosted QQ ↔ AI bridge for OneBot 11 / NapCat / LLOneBot and ACP-compatible agents.

It focuses on bot infrastructure: transport wiring, session persistence, progress streaming, Docker packaging, `/metrics`, `/readyz`, `/status`, and deployment caveats.

Current release: v0.1.7
Arm64 evidence: GitHub Actions QEMU smoke boots the linux/arm64 image and verifies health/metrics endpoints.
```

### X / short-post copy

```text
qq-ai-bot is my self-hosted QQ ↔ AI bridge for OneBot 11 / NapCat / LLOneBot + ACP agents.

Not another chat demo.

The current proof ladder:
- v0.1.7 release
- Docker multi-arch image
- arm64 QEMU smoke
- /readyz /status /metrics
- OneBot + ACP docs
- CasaOS/ARM caveat tracked openly
```

### Sponsor copy

```text
If qq-ai-bot saved you OneBot / ACP wiring time, sponsor the boring operator work: real ARM/CasaOS validation, deployment docs, demo assets, and compatibility checks.
```

## Public-safety checklist

Do not publish a deployment screenshot, log, or support request unless it avoids:

- QQ credentials;
- OneBot access tokens;
- private group IDs or user IDs;
- private chat content;
- QR/login screenshots;
- local private paths;
- payment screenshots or personal account identifiers.
