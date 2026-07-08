# qq-ai-bot Promo Kit

> Copy-ready material for sharing `qq-ai-bot` in communities, weekly newsletters, awesome lists, forum posts, and sponsor conversations.

## Core angle

`qq-ai-bot` is a self-hosted QQ ↔ AI bot scaffold for **OneBot 11 / NapCat / LLOneBot** and **ACP-compatible agents**. It focuses on the integration layer: QQ transport, session persistence, progress streaming, Docker packaging, metrics, and operator-facing deployment notes.

It is positioned as bot infrastructure / integration glue, not a toy chat UI.

## One-line descriptions

- Self-hosted QQ ↔ AI bridge for OneBot 11 / NapCat / LLOneBot and ACP-compatible agents.
- A production-minded QQ bot scaffold with persistent sessions, progress streaming, Docker quickstart, metrics, and deployment notes.
- OneBot transport + ACP agent bridge + session persistence + operator docs in one reusable TypeScript repo.

## Short directory / awesome-list blurb

`qq-ai-bot` — self-hosted QQ ↔ AI bot scaffold for OneBot 11 / NapCat / LLOneBot and ACP-compatible agents, with persistent sessions, progress streaming, Docker quickstart, Prometheus-style metrics, and deployment docs.

## Technical proof points

- OneBot 11 forward / reverse WebSocket paths
- NapCat / LLOneBot integration notes
- ACP-compatible agent bridge
- per-chat session persistence
- Redis-backed session option
- progress streaming back to QQ
- inbound image handling and explicit richer-media boundaries
- Prometheus-style `/metrics`
- `/readyz` and `/status`
- Docker image and demo compose path
- multi-instance / Redis caveats documented honestly

## Best links to share

- Repository: <https://github.com/happysnaker/qq-ai-bot>
- Project page: <https://happysnaker.github.io/qq-ai-bot/>
- Getting started: <https://github.com/happysnaker/qq-ai-bot/blob/main/docs/getting-started.md>
- Deployment patterns: <https://github.com/happysnaker/qq-ai-bot/blob/main/docs/deployment-patterns.md>
- Multi-instance notes: <https://github.com/happysnaker/qq-ai-bot/blob/main/docs/multi-instance-notes.md>
- Support: <https://happysnaker.github.io/support/#from-qq-ai-bot>
- Sponsorware discussion: <https://github.com/happysnaker/qq-ai-bot/discussions/30>

## X post drafts

### Post 1 — infrastructure angle

Built `qq-ai-bot` as a self-hosted QQ ↔ AI bridge.

The point is not another chat UI.

It handles the glue:
- OneBot 11 / NapCat / LLOneBot
- ACP-compatible agents
- persistent sessions
- progress streaming
- Docker quickstart
- `/metrics`, `/readyz`, `/status`

Repo: github.com/happysnaker/qq-ai-bot

### Post 2 — operator honesty angle

I added multi-instance notes to `qq-ai-bot` because “supports Redis” is not the same as “safe horizontal scale”.

The docs now spell out:
- when to stay single-instance
- when Redis helps
- OneBot WebSocket caveats
- what is not exactly-once
- what to monitor

That honesty matters for bot infra.

### Post 3 — sponsorware angle

`qq-ai-bot` is free and open source.

Sponsorware candidates now open:
- Postgres session store
- deployment validation paths
- more public demo assets

If it saved you OneBot / ACP wiring time, support page is here:
happysnaker.github.io/support/#from-qq-ai-bot

## LinkedIn / long-form draft

I’m building `qq-ai-bot` as a self-hosted QQ ↔ AI bridge for OneBot 11, NapCat / LLOneBot, and ACP-compatible agents.

The technical focus is the integration layer around a bot, not the model itself:

- OneBot transport wiring
- ACP agent dispatch
- persistent sessions
- progress messages back to QQ
- Docker packaging
- `/metrics`, `/readyz`, and `/status`
- deployment and multi-instance caveats

The most important doc I added recently is not a hype page. It is a multi-instance operator note that says exactly what Redis does and does not solve. Redis externalizes session state; it does not magically provide distributed locks, exactly-once delivery, or cross-instance replay protection.

That is the kind of honesty I want in this repo: useful defaults, clear boundaries, and enough packaging that another operator can decide whether the project fits their environment.

## Weekly submission template

```text
项目名称：qq-ai-bot
项目地址：https://github.com/happysnaker/qq-ai-bot
一句话：面向 OneBot 11 / NapCat / LLOneBot 的 QQ ↔ AI 自托管脚手架，可对接 ACP-compatible agents，支持会话持久化、进度回传、Docker 快速启动和 Prometheus 风格 metrics。
推荐理由：它不是一个只会聊天的 demo，而是把 QQ transport、ACP agent bridge、session store、部署文档和运维边界整理成了一个更像 bot infrastructure 的仓库。
```

## Sponsor CTA options

- If this saves you OneBot / ACP wiring time, sponsor the maintenance work.
- Support the next operator-facing features: Postgres session store, deployment validation, and public demo assets.
- The project is free; sponsorship funds the boring but useful packaging work that makes it safer to run.

Support page: <https://happysnaker.github.io/support/#from-qq-ai-bot>
