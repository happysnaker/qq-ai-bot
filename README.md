# qq-ai-bot

[![CI](https://github.com/happysnaker/qq-ai-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/happysnaker/qq-ai-bot/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/happysnaker/qq-ai-bot)](https://github.com/happysnaker/qq-ai-bot/releases)
[![Stars](https://img.shields.io/github/stars/happysnaker/qq-ai-bot?style=social)](https://github.com/happysnaker/qq-ai-bot/stargazers)
[![OneBot 11](https://img.shields.io/badge/OneBot-11-black)](https://onebot.dev/ecosystem)
[![Use this template](https://img.shields.io/badge/use%20this-template-62d2a2)](https://github.com/happysnaker/qq-ai-bot/generate)
[![Project Page](https://img.shields.io/badge/project-page-7aa2ff)](https://happysnaker.github.io/qq-ai-bot/)
[![Support](https://img.shields.io/badge/support-WeChat%20%26%20Alipay-9b87f5)](https://happysnaker.github.io/support/#from-qq-ai-bot)
[![Umbrel App Store](https://img.shields.io/badge/Umbrel-App%20Store-7b39ed)](https://github.com/getumbrel/umbrel-apps/pull/5834)



> 💛 **这个项目完全免费开源。如果它帮你省了时间，请考虑 [请我喝杯咖啡](https://happysnaker.github.io/support/#from-qq-ai-bot)（¥9.9 起，微信/支付宝）。不确定该打赏、看 proof、买 deploy-read，还是资助 `qq-ai-bot #26 arm64` 真机验证？先走 [10-second support router](https://happysnaker.github.io/support/#sponsor-router)。**

一个面向实际部署的 **QQ ↔ AI** 机器人项目。

`qq-ai-bot` 基于 **OneBot 11** 接入 QQ，基于 **ACP** 对接本地 agent，并将结果、会话状态和处理中进度返回到 QQ。它不绑定某一个特定 agent：只要你的 agent 能以 ACP 方式启动和通信，就可以挂到这个机器人后面。

常见接法包括：把 **DeepSeek** 或其他本地 / 自托管模型能力，封装在一个 **ACP-compatible agent runtime** 后面，再由 `qq-ai-bot` 负责 QQ / OneBot 接线、会话管理和进度回传。

> **English pitch:** A production-grade, self-hosted **QQ ↔ AI bridge** for **OneBot 11 / NapCat / LLOneBot** and **ACP-compatible agents**, with persistent sessions and progress streaming.

- 项目页：[happysnaker.github.io/qq-ai-bot](https://happysnaker.github.io/qq-ai-bot/)
- Public landing / proof ladder：[docs/public/landing-page.md](docs/public/landing-page.md)
- 架构说明：[ARCHITECTURE.md](./ARCHITECTURE.md)
- 路线图：[ROADMAP.md](./ROADMAP.md)
- 参与贡献：[CONTRIBUTING.md](./CONTRIBUTING.md)
- 安全反馈：[SECURITY.md](./SECURITY.md)
- 生态收录：已进入 [OneBot 生态 / 应用案例](https://onebot.dev/ecosystem)
- 官方社区展示：已发到 [OneBot 官方 Discussions / 应用 / SDK](https://github.com/orgs/botuniverse/discussions/264)
- 镜像分发：`ghcr.io/happysnaker/qq-ai-bot:v0.1.7` 与 `ghcr.io/happysnaker/qq-ai-bot:latest` 已发布 `linux/amd64` 与 `linux/arm64`；见 [Deployment validation](docs/deployment-validation.md) 与 [arm64 / CasaOS tester pack](docs/public/arm64-casaos-tester-pack.md)
- 社区入口：[Show and tell](https://github.com/happysnaker/qq-ai-bot/discussions/10) · [Deployment matrix Q&A](https://github.com/happysnaker/qq-ai-bot/discussions/11) · [Ecosystem tracker](docs/public/ecosystem-tracker.md)
- 想直接拿来改成你自己的 bot 脚手架：点 GitHub 上方的 **Use this template**
- 技术栈：Node.js 22+、TypeScript、Docker、GitHub Actions
- 适用场景：自托管 QQ bot、NapCat / LLOneBot 集成、ACP agent 接线层、DeepSeek / 其他本地 agent 的 QQ 接入层

![qq-ai-bot architecture overview](./assets/architecture-overview.png)


> 💰 **这个项目帮你省了搭建时间？** 别光 star — [请作者喝杯咖啡 ☕](https://happysnaker.github.io/support/#from-qq-ai-bot)（¥9.9 起，微信/支付宝）。或者买一份 [¥29.9 快速评审](https://happysnaker.github.io/support/#quick-read) 帮你自己的项目做同样级别的包装。


---

## 💰 支持作者 / Support

如果这个项目帮你省了 OneBot / ACP 接线时间，欢迎请我喝杯咖啡：

<div align="center">
  <img src="./assets/wechat-pay.jpg" width="200" alt="微信支付" />
  <img src="./assets/alipay-pay.jpg" width="200" alt="支付宝" />
</div>

> 付款时请备注 ，让我知道是哪个项目帮到了你。

也提供付费服务：
- **¥29.9** — 快速评审你的 GitHub profile / README / 项目页面
- **¥99** — 异步深度评审 + 具体改法建议
- **¥199** — 捆绑评审：GitHub profile + 一个 repo README + 一个落地页

支付后发邮件到 **happysnaker@foxmail.com**，附上链接+截图即可。

[→ 更多支持方式](https://happysnaker.github.io/support/#from-qq-ai-bot)

---

## 🎯 赞助众筹 / Sponsorware

以下是计划中的功能。每个功能标了开发成本——**凑够赞助就开工**。

| 功能 | 目标金额 | 进度 | 状态 |
|------|---------|------|------|
| [Postgres session store](https://github.com/happysnaker/qq-ai-bot/issues/24) | ¥50 | 100% | ✅ 已发布 |
| [多实例部署指南](docs/multi-instance-notes.md) | ¥30 | 100% | ✅ 已发布 |
| [端到端延迟 histograms](https://github.com/happysnaker/qq-ai-bot/issues/23) | ¥80 | 100% | ✅ 已发布 |
| [arm64 / CasaOS 真实安装报告](docs/public/arm64-casaos-tester-pack.md) | ¥50 | 80% | 🧪 QEMU smoke 已过，等真机报告 |
| [微信通知集成](https://github.com/happysnaker/qq-ai-bot/issues/new?title=feat:%20WeChat%20notification%20integration) | ¥100 | 0% | 🚧 等待赞助 |
| [Web Dashboard (管理面板)](https://github.com/happysnaker/qq-ai-bot/issues/new?title=feat:%20Web%20admin%20dashboard) | ¥150 | 0% | 🚧 等待赞助 |

**怎么赞助？** 扫码支付后在该功能 Issue 下留言，附上截图即可。

<div align="center">
  <img src="./assets/wechat-pay.jpg" width="180" alt="微信支付" />
  <img src="./assets/alipay-pay.jpg" width="180" alt="支付宝" />
  <br/>
  <sub>扫码请备注功能名，比如 <code>Redis</code> 或 <code>Dashboard</code></sub>
</div>

> 💡 **为什么用 Sponsorware？** 开源不意味着免费劳动。赞助众筹让你用一杯咖啡的钱换来你需要的功能，也让我有动力持续维护。

## 核心能力

![qq-ai-bot progress streaming demo](./assets/progress-demo.png)

- OneBot 11 forward / reverse WebSocket
- 兼容 NapCat / LLOneBot
- 私聊、群聊独立会话
- 群聊支持仅 `@机器人` 触发
- 每个群独立 `systemPrompt`
- `/help` `/status` `/prompt` `/reset` `/ping`
- ACP 会话复用与持久化
- 处理中进度回传到 QQ
- 入站图片下载后转给 agent
- 对暂未自动直传的语音 / 文件 / 视频等 richer media，显式告诉 agent“当前未读到附件”，避免静默丢失
- Prometheus 风格 `/metrics`、runtime counters 与 turn / agent / reply latency histograms
- `/readyz` / `/status` 中暴露 build / version 信息
- 可插拔 session store（默认 file，支持 Redis）
- 轻量入站消息去重，降低 OneBot 重放导致的重复 ACP 调用
- macOS 下提供 NapCat 接入辅助脚本

## 快速开始

### 1. 准备环境

- Node.js 22+
- 一个 OneBot 11 实现（推荐 [NapCatQQ](https://github.com/NapNeko/NapCatQQ) 或 [LLOneBot](https://github.com/LLOneBot/LuckyLilliaBot)）
- 一个 ACP 兼容 agent

如果你还没决定接哪个 agent，先看 [ACP Agent 接入](docs/agent-integration.md)。里面给了三种可直接用的方式：仓库自带 mock agent、`traex` 示例、以及自定义 agent 配置。

### 2. 拉代码并准备配置

```bash
git clone https://github.com/happysnaker/qq-ai-bot.git
cd qq-ai-bot
npm install
cp .env.example .env
cp examples/group-rules.example.json examples/group-rules.local.json
```

项目启动时会自动读取项目根目录下的 `.env`。

你真正要修改的是：

- 项目根目录下的 `.env`
- 项目根目录下的 `examples/group-rules.local.json`

如果你先想跑通仓库默认链路，`.env.example` 已经给了一个可直接工作的 mock agent 配置。先不要急着改 `ACP_AGENT_*`，先把链路跑通。

如果你要接自己的 agent，最重要的 ACP 配置是这三项：

```env
ACP_AGENT_COMMAND=your-acp-agent-command
ACP_AGENT_ARGS_JSON=["arg1","arg2"]
ACP_AGENT_WORKDIR=/path/to/your/workdir
```

### 3. 先测 agent，再接 QQ

先确认 bot 能拉起你配置的 ACP agent：

```bash
npm run smoke:agent
```

看到输出里包含 `ACP_SMOKE_OK` 后，再启动 bot：

```bash
npm run dev
```

如果这时你接的是 `traex`，推荐 `.env` 至少写成：

```env
ACP_AGENT_COMMAND=traex
ACP_AGENT_ARGS_JSON=["acp","serve"]
ACP_AGENT_WORKDIR=/path/to/your/workdir
```

### 4. 再接 QQ / NapCat

如果你在 macOS + 本机 QQ + NapCat 上跑，推荐顺序：

```bash
npm run status:napcat:macos
npm run setup:napcat:macos -- --token change-me --ws-url ws://127.0.0.1:16700/onebot/v11/ws
npm run launch:napcat:macos -- --restart
```

然后：

1. 打开 `http://127.0.0.1:6099/webui`
2. WebUI token 填 `change-me`
3. 在 WebUI 里登录 QQ
4. 再执行：

```bash
curl http://127.0.0.1:8080/status
```

如果你不是用 macOS helper，而是自己配置 OneBot 11，也至少要保证 reverse WebSocket 指到：

```text
ws://127.0.0.1:16700/onebot/v11/ws
```

并且 OneBot 侧 token 与 `.env` 里的 `ONEBOT_ACCESS_TOKEN` 一致。

### 5. 在 QQ 中验证

建议顺序：

1. 私聊机器人发一句普通文本
2. 发送 `/ping`
3. 发送 `/status`
4. 群聊里 `@机器人` 再发一句文本

## 文档

- [快速开始](docs/getting-started.md)
- [Deployment matrix / 部署组合矩阵](docs/deployment-matrix.md)
- [FAQ / 常见问题](docs/faq.md)
- [Deployment patterns / 部署形态](docs/deployment-patterns.md)
- [Public landing / proof ladder](docs/public/landing-page.md)
- [Ecosystem tracker / 生态跟进](docs/public/ecosystem-tracker.md)
- [Deployment validation / 部署验证](docs/deployment-validation.md)（含 `docker-compose.arm64.yml` override）
- [Multi-instance notes / 多实例运维说明](docs/multi-instance-notes.md)
- [ACP Agent 接入](docs/agent-integration.md)
- [配置说明](docs/configuration.md)
- [macOS 接入 NapCat](docs/macos-napcat.md)
- [Docker 快速演示（补充演示，未验证生产路径）](docs/docker-quickstart.md)
- [Windows 接入说明（未验证）](docs/windows-untested.md)
- [架构说明](ARCHITECTURE.md)

## 命令

- `/help`
- `/status`
- `/prompt`
- `/reset`
- `/ping`

## 外部项目 / 协议

- [NapCatQQ](https://github.com/NapNeko/NapCatQQ)
- [LLOneBot](https://github.com/LLOneBot/LuckyLilliaBot)
- [OneBot 11](https://11.onebot.dev)

## 平台说明

- **macOS**：仓库内置了 NapCat 辅助脚本。
- **Windows**：提供接入说明，但当前标记为 **未验证**。
- **Linux**：bot 侧本身没有特殊限制。

## Roadmap / Help wanted

如果你想看这个仓库下一步会往哪走，或者想直接认领一个更偏工程化的贡献方向，先看：

- [ROADMAP.md](./ROADMAP.md)
- [Discussions](https://github.com/happysnaker/qq-ai-bot/discussions)
- [`help wanted` issues](https://github.com/happysnaker/qq-ai-bot/issues?q=is%3Aopen+label%3A%22help+wanted%22)

当前优先方向：

- richer media / 附件处理
- tracing / 更细的 observability 信号
- 多实例部署与更多外部存储路径
- 更多 channel / transport 演进

当前已经挂出的可认领入口：

- [#23 enhancement: add end-to-end turn latency histograms for receive → agent → reply](https://github.com/happysnaker/qq-ai-bot/issues/23) — 已在 v0.1.5 发布
- [#24 enhancement: add Postgres session store as another external persistence option](https://github.com/happysnaker/qq-ai-bot/issues/24) — 已在 v0.1.6 发布
- [#25 documentation: add multi-instance deployment notes and operator caveats](https://github.com/happysnaker/qq-ai-bot/issues/25) — 对应多实例部署经验和运维文档

如果你准备提 PR，建议先看 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## Community

- **先看常见问题**：用 [FAQ / 常见问题](docs/faq.md) 先排一次最常见的 WS / token / agent 配置错误
- **先看部署组合矩阵**：用 [Deployment matrix / 部署组合矩阵](docs/deployment-matrix.md) 先判断你现在走的是“仓库强路径”还是“文档化支持路径”
- **Questions / usage help**：用 [Q&A discussions](https://github.com/happysnaker/qq-ai-bot/discussions/categories/q-a)
- **Deployment matrix / 已验证组合**：看 [Q&A: which NapCat / LLOneBot + WS + ACP combinations have you actually run?](https://github.com/happysnaker/qq-ai-bot/discussions/11)
- **Feature / roadmap ideas**：用 [Ideas discussions](https://github.com/happysnaker/qq-ai-bot/discussions/categories/ideas)
- **Show and tell / 真实部署展示**：看 [share your qq-ai-bot deployment, stack, or screenshots](https://github.com/happysnaker/qq-ai-bot/discussions/10)
- **OneBot 官网应用案例（已合并）**：看 [botuniverse/homepage#93](https://github.com/botuniverse/homepage/pull/93)
- **OneBot 官方社区展示贴**：看 [OneBot / 应用 / SDK：分享一个基于 OneBot 11 / NapCat / LLOneBot 的 QQ ↔ AI 自托管脚手架](https://github.com/orgs/botuniverse/discussions/264)
- **NapCat 社区展示贴**：看 [NapCatQQ Show and tell: 做了个基于 NapCat / OneBot 11 的 QQ ↔ AI 自托管脚手架](https://github.com/NapNeko/NapCatQQ/discussions/1942)
- **NapCatQQ README 推荐尝试（已关闭）**：看 [NapCatQQ#1941](https://github.com/NapNeko/NapCatQQ/pull/1941)；这条不算收录，只作为透明跟踪记录
- **NapCat 社区文档接入说明**：看 [NapCat community resources / integration docs 中的 qq-ai-bot 接入条目](https://github.com/NapNeko/NapCatDocs/pull/132)
- **NapCat Docker 模板（已合并）**：看 [NapCat-Docker#132](https://github.com/NapNeko/NapCat-Docker/pull/132)
- **ACP 社区 awesome list（已合并）**：看 [awesome-agent-client-protocol#2](https://github.com/nMaroulis/awesome-agent-client-protocol/pull/2)
- **Docker Compose 样例 PR**：看 [docker/awesome-compose#781](https://github.com/docker/awesome-compose/pull/781)
- **CasaOS 应用商店 PR**：看 [Cp0204/CasaOS-AppStore-Play#42](https://github.com/Cp0204/CasaOS-AppStore-Play/pull/42)
- **LLOneBot 社区展示贴**：看 [LLOneBot Show and tell: 做了个基于 LLOneBot / OneBot 11 的 QQ ↔ AI 自托管脚手架](https://github.com/LLOneBot/LuckyLilliaBot/discussions/796)
- **LLOneBot 官方文档收录 PR**：看 [LLOneBot/LuckyLilliaDoc#20](https://github.com/LLOneBot/LuckyLilliaDoc/pull/20)
- **LLOneBot Nix 集成示例 PR**：看 [LLOneBot/llonebot.nix#22](https://github.com/LLOneBot/llonebot.nix/pull/22)
- **ACP 协议社区技术讨论**：看 [ACP question from a OneBot/QQ client: recommended richer-media boundary for channel clients?](https://github.com/orgs/agentclientprotocol/discussions/1591)
- **ACP 官方 clients 文档收录（已合并）**：看 [agentclientprotocol/agent-client-protocol#1592](https://github.com/agentclientprotocol/agent-client-protocol/pull/1592)
- **具体可认领任务**：看 [`help wanted` issues](https://github.com/happysnaker/qq-ai-bot/issues?q=is%3Aopen+label%3A%22help+wanted%22)
- **arm64 / CasaOS 测试招募**：先看 [tester pack](docs/public/arm64-casaos-tester-pack.md)，再看 [Call for testers](https://github.com/happysnaker/qq-ai-bot/discussions/43) 与 [#26](https://github.com/happysnaker/qq-ai-bot/issues/26)
- **直接支持仓库**：看 [SUPPORT.md](./SUPPORT.md)

## Public promo / sponsor kit

- [Promo kit / 推广素材](docs/public/promo-kit.md)
- [Sponsorware roadmap / 赞助路线](docs/public/sponsorware.md)
- [arm64 / CasaOS tester pack](docs/public/arm64-casaos-tester-pack.md)
- [Homelab / CasaOS outreach kit](docs/public/homelab-outreach-kit.md)
- [Sponsorware discussion / 赞助讨论](https://github.com/happysnaker/qq-ai-bot/discussions/30)
- [Sponsor / paid-support intake replies](https://github.com/happysnaker/happysnaker/blob/master/docs/share-kit.md#sponsor--paid-support-intake-replies)

## Promo kit / 转发文案

如果你想把这个项目转到群里、论坛、周刊、awesome list 或发给朋友，直接复制下面这些就够了。

**最短一句话：**

```text
OneBot 11 + ACP + persistent sessions + progress streaming
```

**中文一段版：**

```text
qq-ai-bot 是一个面向 OneBot 11 / NapCat / LLOneBot 的 QQ ↔ AI 自托管脚手架。它把 QQ 消息入口、ACP agent bridge、会话持久化和进度回传整理成了一个更像 bot 基础设施的仓库，而不是只会聊天的玩具 demo。
```

**English one-paragraph version:**

```text
qq-ai-bot is a self-hosted QQ ↔ AI bot scaffold for OneBot 11 / NapCat / LLOneBot and ACP-compatible agents, with persistent sessions and progress streaming. It is positioned as bot infrastructure / integration glue rather than another toy chat UI.
```

**最有用的 3 个链接：**

- 仓库首页：<https://github.com/happysnaker/qq-ai-bot>
- 项目页：<https://happysnaker.github.io/qq-ai-bot/>
- 文档入口：快速开始 / ACP Agent 接入 / FAQ

**如果对方是周刊 / awesome list / 维护者：**

- 最好突出：`OneBot 11`、`NapCat / LLOneBot`、`ACP-compatible agents`
- 最好强调：`persistent sessions`、`progress streaming`
- 最好避免只写成“又一个 QQ 聊天机器人”，因为这个项目更偏 **bridge / scaffold / bot infrastructure**

## Operational notes

- 对 OneBot 重连 / 重放导致的重复入站事件，仓库现在会做一层**轻量入站去重**，尽量避免重复命令处理和重复 ACP prompt
- 当前是单实例内存级 replay guard，目标是先减少明显重复触发，而不是承诺严格 exactly-once
- 单轮交互现在会派生一个 **correlation ID**，并贯穿到 receive / dedupe / ACP dispatch / progress / final reply 相关日志里，便于排查“这一次到底发生了什么”
- 建议 grep `correlationId=`（或 JSON 日志里的 `correlationId` 字段）把一次消息相关的接收、去重、进度和回复串起来看
- richer media 当前仍然是**分阶段演进**：文本和图片是稳定主链路；语音 / 文件 / 视频等媒体现在会被显式标记为“未直传媒体”，并通过 prompt 附加说明告知 agent 不要假装已经读取附件
- 相关配置与说明见 [配置说明](docs/configuration.md)

## Support

如果这个仓库帮你省掉了 OneBot 接线、会话管理或 ACP bridge 的搭建时间：

- 给仓库点个 star
- 提 issue / PR 补充更多 channel、session store 或 observability 能力
- 直接支持我的开源维护：[happysnaker.github.io/support](https://happysnaker.github.io/support/#from-qq-ai-bot)
- 如果你愿意顺手帮我传播，最好直接转这句：`OneBot 11 + ACP + persistent sessions + progress streaming`
- 如果你想把它发到群里 / 论坛 / 朋友那，最短链接组合是：仓库首页 + 项目页 + 快速开始
- 如果你是因为这个项目来的，付款备注最有用的是：`qq-ai-bot`
- 如果你卡在部署、README 定位、项目页包装这类问题，最快的付费入口其实是 **¥29.9 quick read**：我会先 blunt 地告诉你最该改的 3 件事，而不是让你继续在仓库里瞎试
- 如果你更像是卡在 **NapCat / LLOneBot / token / reverse WS / Docker / landing page** 这一整条 deploy story 上，可直接用这个标题发邮件：[Deploy read | qq-ai-bot inbound | repo link](mailto:happysnaker@foxmail.com?subject=Deploy%20read%20%7C%20qq-ai-bot%20inbound%20%7C%20repo%20link&body=Repo%20link%3A%0ADeployment%20shape%3A%20NapCat%20/%20LLOneBot%20/%20Docker%20/%20other%0AWhat%20feels%20stuck%3A%20token%20/%20WS%20/%20README%20/%20landing%20page%0APayment%20screenshot%3A%20attached)
- 如果你想先看一下这种 deploy read 到底会长什么样，可先看公开样例：[Deploy read sample](https://happysnaker.github.io/review/deploy-read-sample/)
- 如果你想让我先 blunt 地看一眼你自己的 bot / agent / infra 仓库，可直接发这个模板：[¥29.9 Quick read | repo link](mailto:happysnaker@foxmail.com?subject=Quick%20read%20%7C%20bot%20repo%20link&body=Repo%20link%3A%0AWhat%20feels%20weak%3A%20README%20/%20positioning%20/%20landing%20page%0APayment%20screenshot%3A%20attached)
- 如果你想要更完整的 GitHub / README / landing-page 包装 pass，可直接发这个模板：[¥99 Async review | repo link](mailto:happysnaker@foxmail.com?subject=Async%20review%20%7C%20bot%20repo%20link&body=Repo%20link(s)%3A%0ATarget%20role%20or%20use%20case%3A%0AWhat%20feels%20weak%3A%20README%20/%20positioning%20/%20landing%20page%20/%20GitHub%20profile%0APayment%20screenshot%3A%20attached)
- 如果你就是从 `qq-ai-bot` 进来的，邮件标题直接写：`Quick read | qq-ai-bot inbound | repo link` 或 `Async review | qq-ai-bot inbound | repo link`，我能更快识别上下文
- 不要在 public issue 里贴 private logs、credentials、QR codes、payment screenshots、internal URLs 或 raw live integration output；先用 [sponsor / paid-support intake replies](https://github.com/happysnaker/happysnaker/blob/master/docs/share-kit.md#sponsor--paid-support-intake-replies) 选正确入口。
- 如果你想把自己的 bot / agent / infra 仓库也整理成这种更像成品的状态，可看轻量付费反馈：[happysnaker.github.io/review](https://happysnaker.github.io/review/)
