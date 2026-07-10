# Deployment validation notes

This document records public deployment evidence without overstating what has actually been tested.

## Current image evidence

`ghcr.io/happysnaker/qq-ai-bot:v0.1.7` is published as an OCI image index with these platforms:

- `linux/amd64`
- `linux/arm64`

Evidence command:

```bash
docker buildx imagetools inspect ghcr.io/happysnaker/qq-ai-bot:v0.1.7
```

Use the command output as the current source of truth for digest and per-platform manifest values. Digest values can change whenever the tag is rebuilt for a new release.

## What this proves

This proves that the public GHCR image tag has both amd64 and arm64 image manifests.

It does **not** prove that every arm64 homelab path has been fully tested.


## Optional arm64 Docker Compose override

For an explicit arm64 image pull in the demo stack, use the override file:

```bash
docker compose -f docker-compose.demo.yml -f docker-compose.arm64.yml config
docker compose -f docker-compose.demo.yml -f docker-compose.arm64.yml up -d
```

The override sets:

```yaml
services:
  qq-ai-bot:
    platform: linux/arm64
```

This helps verify that Docker resolves the arm64 manifest, but it still does not replace a real CasaOS / arm64 host report.

## Optional one-command arm64 smoke script

If Docker is available, you can run the reusable smoke script:

```bash
./scripts/smoke-arm64-image.sh
```

Useful overrides:

```bash
IMAGE=ghcr.io/happysnaker/qq-ai-bot:v0.1.7 PORT=18082 ./scripts/smoke-arm64-image.sh
```

The script pulls the `linux/arm64` image, starts the container, checks `/readyz`, `/status`, and `/metrics`, writes redaction-friendly artifacts under `run-logs/arm64-smoke/`, and removes the container on exit.

Do not paste raw logs into public issues without redacting tokens, account details, private chat content, or local paths.


## GitHub Actions arm64 smoke

For public CI-style evidence, the repository also has an `Arm64 image smoke` workflow.

It runs after `Publish Docker image` succeeds, resolves the matching `sha-xxxxxxx` GHCR tag, sets up QEMU on the GitHub-hosted runner, pulls the `linux/arm64` image, and runs [`scripts/smoke-arm64-image.sh`](../scripts/smoke-arm64-image.sh). It also runs weekly against the moving `latest` tag so the arm64 image path stays monitored between releases.

The workflow uploads the same smoke artifacts as the local script:

- `readyz.json`;
- `status.json`;
- `metrics.txt`;
- `inspect.txt` with image os/arch and container status;
- `container.log`.

This is stronger than a manifest-only check because it boots the arm64 image and hits `/readyz`, `/status`, and `/metrics` under emulation. It still does **not** replace a real CasaOS / arm64 host report.

## CasaOS / homelab status

Issue [#26](https://github.com/happysnaker/qq-ai-bot/issues/26) tracks the remaining validation work:

Use the [arm64 / CasaOS tester pack](public/arm64-casaos-tester-pack.md) and the [install report template](../.github/ISSUE_TEMPLATE/arm64_casaos_report.md) when submitting evidence.

- run the stack on a real arm64 host / NAS / SBC;
- validate the CasaOS app-store flow;
- document browser-first NapCat / QQ login caveats;
- collect at least one public operator report or screenshot.

Until that is done, describe the state as:

> Multi-arch image is published; real arm64 / CasaOS install validation is still open.

## Related links

- Docker image workflow: [.github/workflows/docker-publish.yml](../.github/workflows/docker-publish.yml)
- Docker quickstart: [docs/docker-quickstart.md](docker-quickstart.md)
- Deployment patterns: [docs/deployment-patterns.md](deployment-patterns.md)
- Multi-instance notes: [docs/multi-instance-notes.md](multi-instance-notes.md)
