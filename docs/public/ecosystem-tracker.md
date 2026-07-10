# qq-ai-bot Ecosystem Tracker

> Public tracker for ecosystem placements, app-store submissions, docs PRs, and follow-up status. This keeps promotion evidence source-linked and prevents status claims from drifting.

## Current status summary

| Surface | Status | Link | Notes | Next follow-up |
|---|---|---|---|---|
| OneBot ecosystem | listed | [onebot.dev/ecosystem](https://onebot.dev/ecosystem) | protocol-native ecosystem placement | monitor for broken link monthly |
| OneBot community discussion | submitted | [botuniverse discussion #264](https://github.com/orgs/botuniverse/discussions/264) | official community showcase | monitor comments monthly |
| OneBot homepage application case | merged | [botuniverse/homepage#93](https://github.com/botuniverse/homepage/pull/93) | OneBot homepage application-cases list includes `qq-ai-bot` | no action |
| ACP clients docs | merged | [agentclientprotocol#1592](https://github.com/agentclientprotocol/agent-client-protocol/pull/1592) | official ACP clients docs now include `qq-ai-bot` | no action |
| NapCat docs | merged | [NapCatDocs#132](https://github.com/NapNeko/NapCatDocs/pull/132) | NapCat community / integration docs include `qq-ai-bot` | no action |
| NapCat Docker template | merged | [NapCat-Docker#132](https://github.com/NapNeko/NapCat-Docker/pull/132) | runnable NapCat + `qq-ai-bot` compose template merged into NapCat Docker templates | no action |
| ACP community awesome list | merged | [awesome-agent-client-protocol#2](https://github.com/nMaroulis/awesome-agent-client-protocol/pull/2) | community ACP list includes `qq-ai-bot` as a local/open-source agent bridge | no action |
| NapCat community discussion | submitted | [NapCatQQ discussion #1942](https://github.com/NapNeko/NapCatQQ/discussions/1942) | NapCat user-facing showcase | monitor comments monthly |
| NapCatQQ README recommendation | closed / no-plan | [NapCatQQ#1941](https://github.com/NapNeko/NapCatQQ/pull/1941) | build succeeded, but maintainer said there is no current plan to add more recommendations | no action |
| LLOneBot docs | open | [LuckyLilliaDoc#20](https://github.com/LLOneBot/LuckyLilliaDoc/pull/20) | Sourcery suggestions addressed; PR body links project page; rechecked 2026-07-09, no maintainer feedback | check review weekly |
| LLOneBot Nix example | open | [llonebot.nix#22](https://github.com/LLOneBot/llonebot.nix/pull/22) | optional LLOneBot + `qq-ai-bot` integration example; Sourcery security comment prompted TLS wording / placeholder cleanup; no maintainer feedback yet | check review weekly |
| LLOneBot community discussion | submitted | [LuckyLilliaBot discussion #796](https://github.com/LLOneBot/LuckyLilliaBot/discussions/796) | LLOneBot user-facing showcase | monitor comments monthly |
| Docker Compose sample | open | [docker/awesome-compose#781](https://github.com/docker/awesome-compose/pull/781) | DCO passed; review required; arm64 smoke evidence posted; PR body links project page; rechecked 2026-07-09 | check review weekly |
| CasaOS app-store path | open | [CasaOS-AppStore-Play#42](https://github.com/Cp0204/CasaOS-AppStore-Play/pull/42) | app-store PR open; arm64 smoke evidence posted; PR body links project page; rechecked 2026-07-09; real CasaOS host report still needed | check review weekly |
| Umbrel app-store path | open | [umbrel-apps#5834](https://github.com/getumbrel/umbrel-apps/pull/5834) | lint passed; v0.1.7 + arm64 smoke evidence posted; rechecked 2026-07-09, no maintainer feedback | check review weekly |
| AwesomeHomelab listing | open | [AwesomeHomelab#98](https://github.com/AwesomeHomelab/awesome-homelab/pull/98) | homelab-facing AI listing PR open / mergeable; project page already linked in PR body; rechecked 2026-07-09, no maintainer feedback | check review weekly |
| Haxxnet Compose example | closed / deferred | [Compose-Examples#137](https://github.com/Haxxnet/Compose-Examples/pull/137) | closed by maintainer as “too young project”; useful signal for maturity threshold, not a listing | reconsider after more releases / age |
| awesome-selfhosted listing | closed / rule-deferred | [awesome-selfhosted-data#2668](https://github.com/awesome-selfhosted/awesome-selfhosted-data/issues/2668) | intentionally opened as an early parking issue; closed as not planned because first release is not older than 4 months | reconsider after 2026-11-02 |
| ARM/CasaOS tester call | open | [discussion #43](https://github.com/happysnaker/qq-ai-bot/discussions/43) / [tester pack](arm64-casaos-tester-pack.md) | asks for physical ARM / CasaOS install reports; tester pack published 2026-07-10; no reports yet | check for reports weekly |
| Sponsorware roadmap | open | [discussion #30](https://github.com/happysnaker/qq-ai-bot/discussions/30) | central sponsorware and promo-kit discussion | update after shipped slices |

## Current proof assets

- Public landing / proof ladder: [landing-page.md](landing-page.md)
- Promo kit: [promo-kit.md](promo-kit.md)
- Sponsorware roadmap: [sponsorware.md](sponsorware.md)
- Deployment validation: [deployment-validation.md](../deployment-validation.md)
- Latest release: [v0.1.7](https://github.com/happysnaker/qq-ai-bot/releases/tag/v0.1.7)
- Promotion-outcome refresh CI: <https://github.com/happysnaker/qq-ai-bot/actions/runs/28997968153>
- Promotion-outcome refresh CodeQL: <https://github.com/happysnaker/qq-ai-bot/actions/runs/28997968111>
- Promotion-outcome refresh Docker publish: <https://github.com/happysnaker/qq-ai-bot/actions/runs/28997968169>
- Promotion-outcome refresh arm64 smoke: <https://github.com/happysnaker/qq-ai-bot/actions/runs/28998479074>
- Tag arm64 QEMU smoke: <https://github.com/happysnaker/qq-ai-bot/actions/runs/28968114761>

## Follow-up checklist

When updating an external surface:

- [ ] Link the stable release when relevant.
- [ ] Link the arm64 smoke run only when the target cares about self-hosted / ARM / app-store packaging.
- [ ] Avoid over-claiming physical host validation; `qq-ai-bot#26` remains open for real CasaOS / physical ARM evidence.
- [ ] Keep comments short and source-linked.
- [ ] Do not paste private QQ details, OneBot tokens, group IDs, user IDs, QR/login screenshots, or private chat content.

## Sponsor CTA

The clearest current funding target remains [#26 arm64 / CasaOS deployment validation](https://github.com/happysnaker/qq-ai-bot/issues/26): QEMU smoke is green and the [tester pack](arm64-casaos-tester-pack.md) is published, but real physical ARM / CasaOS reports are still missing.

Support page: <https://happysnaker.github.io/support/#from-qq-ai-bot>.
