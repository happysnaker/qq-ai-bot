# arm64 / CasaOS Tester Pack

> Public-safe checklist for closing the remaining `qq-ai-bot` ARM / CasaOS validation gap. The goal is one real physical-host report, not another QEMU-only proof.

## Current status

Already proven:

- `ghcr.io/happysnaker/qq-ai-bot:v0.1.7` and `:latest` publish `linux/amd64` and `linux/arm64` images.
- Latest CI: <https://github.com/happysnaker/qq-ai-bot/actions/runs/29072149755>
- Latest CodeQL: <https://github.com/happysnaker/qq-ai-bot/actions/runs/29072149862>
- Latest Docker publish: <https://github.com/happysnaker/qq-ai-bot/actions/runs/29072149756>
- Latest arm64 QEMU smoke: <https://github.com/happysnaker/qq-ai-bot/actions/runs/29072241215>
- Deployment docs and `docker-compose.arm64.yml` exist.

Still missing:

- one real CasaOS app-store flow on a physical ARM host;
- one real NAS / SBC / Raspberry Pi / Orange Pi / ARM homelab install report;
- redacted operator notes for NapCat / OneBot WebSocket caveats on that host.

Tracked in [qq-ai-bot#26](https://github.com/happysnaker/qq-ai-bot/issues/26).

## Who should test

Good tester environments:

- Raspberry Pi 4 / 5 or similar ARM SBC;
- ARM NAS / homelab box;
- CasaOS host where app-store style install can be validated;
- any real `linux/arm64` Docker host that can run NapCat / OneBot nearby.

Not enough by itself:

- GitHub-hosted QEMU smoke;
- `docker buildx imagetools inspect` only;
- screenshots with private QQ login / group / token data visible.

## 15-minute validation path

Use a throwaway bot / group if possible.

```bash
# 1. Confirm the host is a real ARM machine.
uname -m

# 2. Pull the released image on the ARM host.
docker pull --platform linux/arm64 ghcr.io/happysnaker/qq-ai-bot:v0.1.7

# 3. Render the ARM compose stack before starting it.
docker compose -f docker-compose.demo.yml -f docker-compose.arm64.yml config

# 4. Start the demo stack.
docker compose -f docker-compose.demo.yml -f docker-compose.arm64.yml up -d

# 5. Check health surfaces.
curl -fsS http://127.0.0.1:3000/readyz
curl -fsS http://127.0.0.1:3000/status
curl -fsS http://127.0.0.1:3000/metrics | grep qq_ai_bot_build_info
```

If you prefer the reusable smoke script:

```bash
IMAGE=ghcr.io/happysnaker/qq-ai-bot:v0.1.7 PORT=18082 ./scripts/smoke-arm64-image.sh
```

The script writes redaction-friendly artifacts under `run-logs/arm64-smoke/` and removes the smoke container on exit.

## CasaOS-specific checks

If testing through CasaOS / app-store style flow, include:

- CasaOS version;
- app-store / custom app install path used;
- whether the container starts after install;
- whether ports and environment variables are editable from the UI;
- whether restart / update behavior works;
- any UI-specific caveats that do not appear in raw Docker Compose.

Related app-store PR: <https://github.com/Cp0204/CasaOS-AppStore-Play/pull/42>.

## What to submit

Use one of these public paths:

- [arm64 / CasaOS install report issue template](../../.github/ISSUE_TEMPLATE/arm64_casaos_report.md)
- [Call for testers discussion](https://github.com/happysnaker/qq-ai-bot/discussions/43)
- [tracking issue #26](https://github.com/happysnaker/qq-ai-bot/issues/26)

Minimum report checklist:

- hardware model;
- CPU architecture (`uname -m` output);
- OS / CasaOS version;
- image tag used;
- install method: Compose, CasaOS app-store path, or another UI;
- `/readyz`, `/status`, and `/metrics` result;
- NapCat / LLOneBot / OneBot WebSocket notes;
- what failed, if anything;
- redacted logs or screenshots only.

## Redaction rules

Do **not** publish:

- QQ credentials or login QR screenshots;
- OneBot access tokens;
- private group IDs / user IDs;
- private chat content;
- local private paths;
- public IPs you do not want indexed;
- payment screenshots or personal account identifiers.

Good public evidence examples:

- `uname -m` showing ARM architecture;
- image tag and container ID with private env vars removed;
- `/readyz` response with no tokens;
- `/status` response with no private chat data;
- `/metrics` line containing `qq_ai_bot_build_info`;
- CasaOS UI screenshot with secrets, QQ data, IPs, and tokens blurred.

## Sponsor / payment note

If you want to fund this validation instead of testing it yourself, use:

```text
qq-ai-bot #26 arm64
```

Support page: <https://happysnaker.github.io/support/#from-qq-ai-bot>.

What sponsorship funds here:

- real-device testing coordination;
- docs cleanup after the first physical-host report;
- app-store / CasaOS PR follow-up;
- public-safe troubleshooting notes for future operators.
