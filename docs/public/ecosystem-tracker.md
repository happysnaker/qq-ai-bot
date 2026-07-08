# qq-ai-bot Ecosystem Tracker

> Public tracker for ecosystem placements, app-store submissions, docs PRs, and follow-up status. This keeps promotion evidence source-linked and prevents status claims from drifting.

## Current status summary

| Surface | Status | Link | Notes | Next follow-up |
|---|---|---|---|---|
| OneBot ecosystem | listed | [onebot.dev/ecosystem](https://onebot.dev/ecosystem) | protocol-native ecosystem placement | monitor for broken link monthly |
| OneBot community discussion | submitted | [botuniverse discussion #264](https://github.com/orgs/botuniverse/discussions/264) | official community showcase | monitor comments monthly |
| ACP clients docs | merged | [agentclientprotocol#1592](https://github.com/agentclientprotocol/agent-client-protocol/pull/1592) | official ACP clients docs now include `qq-ai-bot` | no action |
| NapCat docs | merged | [NapCatDocs#132](https://github.com/NapNeko/NapCatDocs/pull/132) | NapCat community / integration docs include `qq-ai-bot` | no action |
| NapCat community discussion | submitted | [NapCatQQ discussion #1942](https://github.com/NapNeko/NapCatQQ/discussions/1942) | NapCat user-facing showcase | monitor comments monthly |
| LLOneBot docs | open | [LuckyLilliaDoc#20](https://github.com/LLOneBot/LuckyLilliaDoc/pull/20) | Sourcery suggestions addressed; waiting maintainer review | check review weekly |
| LLOneBot community discussion | submitted | [LuckyLilliaBot discussion #796](https://github.com/LLOneBot/LuckyLilliaBot/discussions/796) | LLOneBot user-facing showcase | monitor comments monthly |
| Docker Compose sample | open | [docker/awesome-compose#781](https://github.com/docker/awesome-compose/pull/781) | DCO passed; review required; arm64 smoke evidence posted | check review weekly |
| CasaOS app-store path | open | [CasaOS-AppStore-Play#42](https://github.com/Cp0204/CasaOS-AppStore-Play/pull/42) | app-store PR open; arm64 smoke evidence posted; real CasaOS host report still needed | check review weekly |
| Umbrel app-store path | open | [umbrel-apps#5834](https://github.com/getumbrel/umbrel-apps/pull/5834) | lint passed; v0.1.7 + arm64 smoke evidence posted | check review weekly |
| ARM/CasaOS tester call | open | [discussion #43](https://github.com/happysnaker/qq-ai-bot/discussions/43) | asks for physical ARM / CasaOS install reports | check for reports weekly |
| Sponsorware roadmap | open | [discussion #30](https://github.com/happysnaker/qq-ai-bot/discussions/30) | central sponsorware and promo-kit discussion | update after shipped slices |

## Current proof assets

- Public landing / proof ladder: [landing-page.md](landing-page.md)
- Promo kit: [promo-kit.md](promo-kit.md)
- Sponsorware roadmap: [sponsorware.md](sponsorware.md)
- Deployment validation: [deployment-validation.md](../deployment-validation.md)
- Latest release: [v0.1.7](https://github.com/happysnaker/qq-ai-bot/releases/tag/v0.1.7)
- Tag arm64 QEMU smoke: <https://github.com/happysnaker/qq-ai-bot/actions/runs/28968114761>

## Follow-up checklist

When updating an external surface:

- [ ] Link the stable release when relevant.
- [ ] Link the arm64 smoke run only when the target cares about self-hosted / ARM / app-store packaging.
- [ ] Avoid over-claiming physical host validation; `qq-ai-bot#26` remains open for real CasaOS / physical ARM evidence.
- [ ] Keep comments short and source-linked.
- [ ] Do not paste private QQ details, OneBot tokens, group IDs, user IDs, QR/login screenshots, or private chat content.

## Sponsor CTA

The clearest current funding target remains [#26 arm64 / CasaOS deployment validation](https://github.com/happysnaker/qq-ai-bot/issues/26): QEMU smoke is green, but real physical ARM / CasaOS reports are still missing.

Support page: <https://happysnaker.github.io/support/#from-qq-ai-bot>.
