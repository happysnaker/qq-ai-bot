# Deployment matrix / 部署组合矩阵

这份文档只回答一个问题：

**`qq-ai-bot` 到底哪些部署组合是现在就更值得信，哪些只是文档层面支持，哪些还明确没验证？**

我不想把仓库写得比实际更确定，所以这里把组合拆开说明。

---

## 状态说明

- **✅ 已在仓库里直接跑过 / 有脚本覆盖**  
  至少有仓库内脚本或可重复执行的 repo-owned 流程，能直接覆盖这条链路的关键部分。
- **🟡 仓库自带演示 / 维护中的 quickstart**  
  仓库已经提供 compose、示例配置、说明文档，适合作为第一条路径，但当前不是自动化验证项。
- **🟠 已文档化支持**  
  代码和配置支持这条路，文档里也提到了，但仓库里没有现成 demo 或自动化来替你背书。
- **⚪ 明确未验证**  
  当前只给出推导型接法，或者仓库文档已经明确写了“未验证”。

如果你第一次接这个仓库，优先选 **✅ / 🟡** 路径，不要一上来赌 **🟠 / ⚪**。

---

## 我会优先相信的部署路径

| 路径 | 当前状态 | 为什么 |
| --- | --- | --- |
| fake OneBot client → reverse WS → `qq-ai-bot` → `traecli` ACP | ✅ | 仓库里有 `npm run e2e:fake-onebot:traecli`，这是当前最硬的“真实回复打通”脚本 |
| NapCat → reverse WS → `qq-ai-bot` → mock ACP agent | 🟡 | 仓库自带 `docker-compose.demo.yml`、`.env.docker.example`、`deploy/napcat.onebot11.reverse-ws.json`，这是面向第一次跑通的官方演示路径 |
| 宿主机 OneBot 11 → reverse WS → `qq-ai-bot` → 自己的 ACP agent | 🟠 | `getting-started.md`、`faq.md`、`configuration.md` 都按这条路写，但仓库没把你的 OneBot 实现和外部 agent 一起自动验证掉 |

一句话建议：

- **第一次接触仓库**：先走 **NapCat + reverse WS + mock ACP**  
- **你已经有 agent**：再切到 **reverse WS + 自己的 ACP agent**  
- **你已经明确在用 LLOneBot forward WS**：可以走 forward，但先把它当作 **文档化支持**，不要当成仓库当前最稳的默认路径

---

## OneBot 实现 × WS 模式矩阵

| OneBot 侧 | reverse WS | forward WS | 当前判断 | 证据 / 备注 |
| --- | --- | --- | --- | --- |
| **NapCat** | 🟡 推荐第一条路 | 🟠 代码支持，但仓库无现成 forward demo | **更偏 reverse-first** | Docker 演示栈和 `deploy/napcat.onebot11.reverse-ws.json` 都是 reverse；README / FAQ 也把 reverse 当成最快跑通路径 |
| **LLOneBot** | 🟠 泛化支持 | 🟠 文档化兼容路径 | **更偏 documented compatibility** | README 明确写兼容 LLOneBot；FAQ 也明确提到“如果你已经明确在用 LLOneBot 的 OneBot11 正向 WS，那再切到 forward” |
| **任意 OneBot 11 实现** | 🟠 | 🟠 | **协议层支持，不等于仓库已替你验证** | 代码本身支持 `ONEBOT_MODE=forward/reverse`，但不同实现的坑位仍然要看各自配置 |

这里最重要的不是“理论上支不支持”，而是：

- **NapCat + reverse**：当前是仓库自己的主演示面
- **LLOneBot + forward**：当前是仓库主动承认兼容、但还没有 repo-owned demo 的路径

---

## ACP 侧 / agent 侧矩阵

| ACP 侧 | 当前状态 | 入口 | 说明 |
| --- | --- | --- | --- |
| 仓库内置 mock ACP agent | 🟡 | `docker-compose.demo.yml` / `npm run mock-agent` | 最适合先验证 transport、session、progress 回传 |
| `traecli acp serve` | ✅ / 🟠 | `npm run smoke:traecli`、`npm run e2e:fake-onebot:traecli` | ACP 能力有 smoke / e2e 辅助脚本，但这不是 NapCat / LLOneBot 真机矩阵本身 |
| 你自己的 ACP-compatible agent | 🟠 | `docs/agent-integration.md`、`docs/getting-started.md` | 仓库支持这条扩展位，但具体命令、权限、工作目录仍取决于你的 agent |

换句话说：

- **agent 侧最硬的自动化信号** 目前来自 `traecli` / fake OneBot 脚本
- **QQ / OneBot 侧最容易复现的演示信号** 目前来自 NapCat reverse Docker demo

---

## 按目标选择路径

### 目标 1：我只想先知道仓库是不是活的

走：

```text
NapCat + reverse WS + docker-compose.demo.yml + mock ACP agent
```

原因：

- 依赖最少
- 仓库已经把 compose 和 reverse WS 配置准备好了
- 不要求你先调通自己的 agent

入口：

- [Docker 快速演示](docker-quickstart.md)

### 目标 2：我已经有 ACP agent，只差 QQ 接线

走：

```text
OneBot 11 + reverse WS + 自己的 ACP agent
```

原因：

- reverse 仍然是仓库当前更保守的默认路径
- `getting-started.md` 和 `faq.md` 都优先按 reverse 写
- 先把 WS 方向、token、路径、agent 三件事拆开排查最省时间

入口：

- [快速开始](getting-started.md)
- [ACP Agent 接入](agent-integration.md)

### 目标 3：我已经在用 LLOneBot 的正向 WS

可以走：

```text
LLOneBot + forward WS + qq-ai-bot + ACP agent
```

但当前建议把它理解为：

- **已文档化兼容路径**
- **不是仓库当前维护得最厚的 demo 路径**

也就是说，这条路是合理的，但如果你卡住了，不要默认是 bot runtime 本身坏了；更可能是：

- forward / reverse 方向理解错了
- `ONEBOT_ACCESS_TOKEN` 没和 LLOneBot 配一致
- host / port / 路径 / TLS 边界理解错了

先看：

- [FAQ / 常见问题](faq.md)
- [配置说明](configuration.md)

---

## 当前我愿意公开承认的“已验证 / 已维护 / 未验证”结论

### 我愿意说“更像已验证”的

- fake OneBot + reverse WS + `traecli` ACP e2e
- ACP smoke 路径

### 我愿意说“仓库正在维护、适合第一次跑通”的

- NapCat + reverse WS + Docker demo + mock ACP agent

### 我愿意说“支持，但别过度脑补已经被仓库替你验证”的

- NapCat + forward WS
- LLOneBot + reverse WS
- LLOneBot + forward WS
- 宿主机自定义 ACP agent 的各种具体命令组合

### 我现在明确还不愿意吹成“已验证”的

- Windows 实机组合
- 仓库内未给出 demo 的 forward-mode 真机矩阵
- 多实例 / 外部存储 / 反向代理 / TLS 边界下的所有组合细节

---

## 单独说明：Windows

Windows 现在仍然按 **⚪ 未验证** 处理。

证据不是“我觉得也许可以”，而是仓库自己就已经有：

- [Windows 接入说明（未验证）](windows-untested.md)

所以如果你在 Windows 上跑通了，最有价值的贡献不是再提一个抽象建议，而是把下面这些带回来：

- 你用的是 NapCat 还是 LLOneBot
- 你走的是 forward 还是 reverse
- 你的 agent 是什么
- 你改了哪些配置
- 哪些地方和当前文档不一致

---

## 相关入口

- [Docker 快速演示](docker-quickstart.md)
- [快速开始](getting-started.md)
- [ACP Agent 接入](agent-integration.md)
- [FAQ / 常见问题](faq.md)
- [Deployment patterns / 部署形态](deployment-patterns.md)
- [配置说明](configuration.md)

如果你想补这份矩阵，最有价值的 PR 不是多写几句“理论支持”，而是：

- 增加一个 repo-owned demo
- 增加一个 smoke / e2e 脚本
- 或者带着真实跑通记录，把某一格从 **🟠 / ⚪** 升成 **🟡 / ✅**
