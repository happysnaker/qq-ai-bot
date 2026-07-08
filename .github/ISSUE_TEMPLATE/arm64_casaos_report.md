---
name: arm64 / CasaOS install report
about: Report a real arm64, NAS, SBC, or CasaOS install attempt for qq-ai-bot
labels: deployment,help wanted
---

## Environment

- Device / host model:
- CPU architecture: arm64 / amd64 / other
- OS / CasaOS version:
- Docker version:
- qq-ai-bot image tag:
- OneBot implementation: NapCat / LLOneBot / other

## Install path

- [ ] CasaOS app-store flow
- [ ] Docker Compose
- [ ] Manual Docker run
- [ ] Other:

## What worked?

Describe the successful steps.

## What failed or felt unclear?

Paste only redacted logs. Do not include QQ credentials, access tokens, cookies, QR codes, or private group/user IDs.

## Validation checks

- [ ] image pulled successfully
- [ ] container started
- [ ] `/readyz` responded
- [ ] `/status` responded
- [ ] `/metrics` responded
- [ ] OneBot WebSocket connected
- [ ] at least one private or group message round trip worked

## Screenshots / evidence

Public screenshots are welcome, but redact:

- QQ account details
- QR codes
- access tokens
- private chat / group IDs
- personal messages

## Notes

Anything specific to CasaOS, NapCat browser login, LLOneBot, or arm64 performance?
