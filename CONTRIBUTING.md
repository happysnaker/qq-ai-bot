# Contributing

感谢你愿意改进 `qq-ai-bot`。

这个仓库更偏向 **工程化 bot 基础设施**，所以我们更欢迎下面这些贡献：

- OneBot 11 / NapCat / LLOneBot 兼容性修复
- ACP bridge 稳定性修复
- session store / observability / deployment 方向的增强
- 配置、健康检查、错误处理、可运维性改进

## 开始之前

先确保你本地有：

- Node.js 22+
- npm

如果你准备跑完整链路，再额外准备：

- 一个 OneBot 11 实现（NapCat / LLOneBot）
- 一个 ACP-compatible agent，或直接用仓库里的 mock agent

## 本地开发

```bash
git clone https://github.com/happysnaker/qq-ai-bot.git
cd qq-ai-bot
npm install
cp .env.example .env
cp examples/group-rules.example.json examples/group-rules.local.json
```

常用检查命令：

```bash
npm run lint
npm run typecheck
npm test
npm run smoke:agent
```

如果你只想先验证 bot 主流程，可以再看：

- `docs/getting-started.md`
- `docs/docker-quickstart.md`
- `docs/agent-integration.md`

## 改动建议

### 1. 尽量做单一、聚焦的改动

更容易 review 的 PR 形态：

- 一个 bug fix
- 一个小而完整的 feature
- 一种明确的集成能力

不太理想的 PR 形态：

- 大量无关重构
- 顺手改一堆命名 / 风格 / 目录结构
- 同时混入 bug fix、feature、文档重写

### 2. 新能力尽量顺着现有边界加

仓库当前的边界是刻意保留的：

- `src/channels/onebot/*`：QQ / OneBot transport
- `src/agents/acp/*`：ACP bridge
- `src/core/*`：应用主流程、会话、进度、管理接口

如果你在加能力，尽量不要把 transport 逻辑和 ACP agent 逻辑重新耦合在一起。

### 3. 配置变更要同步文档

如果 PR 改了下面这些内容，请一起更新文档：

- `.env` 中的配置项
- 管理命令
- 健康检查 / readiness 信息
- Docker 或 OneBot 接入方式

## 当前最需要的贡献方向

最欢迎的方向可以直接看 `ROADMAP.md`，目前优先级最高的是：

1. session store 抽象与 Redis 实现
2. `/metrics` 与 runtime counters
3. 版本 / build 信息透出
4. richer media / 附件处理

## 提 PR 时请尽量附上这些信息

- **改了什么**
- **为什么要改**
- **怎么验证**
- **是否涉及配置变化**

如果是 bug fix，最好补：

- 最小复现方式
- 修复前的行为
- 修复后的行为

如果是功能增强，最好补：

- 期望使用方式
- 非目标（这次不做什么）

## Issue / 讨论建议

如果你要做的是中等以上改动，建议先开一个 issue。

尤其是这些场景：

- 新的 session store
- 新的 channel / transport
- 管理接口改动
- 新的部署模型

这样更容易避免方向跑偏。

## 文档与说明

一些高频入口：

- `README.md`
- `ARCHITECTURE.md`
- `docs/getting-started.md`
- `docs/agent-integration.md`
- `docs/configuration.md`

再次感谢。对这个仓库最有价值的贡献，不是把它变成更花哨的聊天玩具，而是把它继续往 **稳定、清晰、可扩展、可部署** 的方向推。
