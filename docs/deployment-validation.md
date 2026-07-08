# Deployment validation notes

This document records public deployment evidence without overstating what has actually been tested.

## Current image evidence

`ghcr.io/happysnaker/qq-ai-bot:v0.1.6` is published as an OCI image index with these platforms:

- `linux/amd64`
- `linux/arm64`

Evidence command:

```bash
docker buildx imagetools inspect ghcr.io/happysnaker/qq-ai-bot:v0.1.6
```

Observed digest:

```text
sha256:bc300affb14469e968c790c0e6da4cbb68b2c6d0e8d78c98ce66c6e350f369db
```

Observed platform manifests:

```text
linux/amd64  sha256:6d28c72ae87bd869ea86343653ddf14e0613b7e0df689f1ba21d0794614303dc
linux/arm64  sha256:9542ea7771998184ece7732d9f610895dc1c882fc5ffec7ff01c9625e2be80bf
```

## What this proves

This proves that the public GHCR image tag has both amd64 and arm64 image manifests.

It does **not** prove that every arm64 homelab path has been fully tested.

## CasaOS / homelab status

Issue [#26](https://github.com/happysnaker/qq-ai-bot/issues/26) tracks the remaining validation work:

Use the [arm64 / CasaOS install report template](../.github/ISSUE_TEMPLATE/arm64_casaos_report.md) when submitting evidence.

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
