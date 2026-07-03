# 🚀 从零搭建 QQ AI 机器人：OneBot 11 + NapCat + DeepSeek 完整教程

> **只需 30 分钟，让你的 QQ 号变成一个真正的 AI 助手。**
>
> 全程免费开源，支持微信/支付宝捐赠：[支持作者](https://happysnaker.github.io/support/#from-qq-ai-bot)

---

## 为什么你需要这个？

2026 年了，你的 QQ 号还在手动回复消息？别人已经在用 AI 自动聊天、自动管理群、自动处理工单了。

这个教程让你：
- ✅ **30 分钟** 搭建完成
- ✅ **完全免费**，无需付费 API（可接本地模型）
- ✅ **支持 DeepSeek**、OpenAI、Claude、本地 Ollama 等任何模型
- ✅ **群聊 + 私聊** 都支持
- ✅ **Docker 一键部署**，服务器/NAS/树莓派都能跑
- ✅ **会话持久化**，重启不丢上下文

---

## 架构一览

```
QQ 消息 → NapCat (OneBot 11) → qq-ai-bot → ACP Agent → AI 模型
                                          ↓
                                    QQ 回复消息
```

1. **NapCat**：把 QQ 协议转成 OneBot 11 标准协议
2. **qq-ai-bot**：接线层，管理会话、转发消息、处理进度
3. **ACP Agent**：你的 AI 大脑，可以是 DeepSeek、OpenAI、Claude 等

---

## 第一步：准备环境

### 你需要：
- 一台能跑 Docker 的机器（服务器/NAS/树莓派/云服务器都行）
- 一个 QQ 小号（**不要用大号！有封号风险**）
- 一个 DeepSeek API Key（或其他 AI 模型的 API）

### 系统要求：
- Docker 20.10+
- 至少 1GB 空闲内存
- 支持 amd64 或 arm64

---

## 第二步：Docker 一键部署

```bash
# 1. 克隆仓库
git clone https://github.com/happysnaker/qq-ai-bot.git
cd qq-ai-bot

# 2. 配置环境变量
cp .env.docker.example .env.docker

# 3. 编辑 .env.docker，填入你的 DeepSeek API Key
# （默认用的是 mock agent，先跑通再换真的）

# 4. 启动！
docker compose -f docker-compose.demo.yml up -d
```

**就这么简单！** 三行命令，你的 QQ 机器人已经在运行了。

---

## 第三步：扫码登录 QQ

1. 打开浏览器，访问 `http://你的服务器IP:6099/webui`
2. 默认 WebUI token：`napcat`
3. 用手机 QQ 扫描页面上的二维码
4. 登录成功后，你的 QQ 号就变成了 AI 机器人！

---

## 第四步：测试机器人

给自己机器人发消息测试：

| 命令 | 说明 |
|------|------|
| `/ping` | 检查机器人是否在线 |
| `/status` | 查看机器人状态 |
| `/help` | 查看所有命令 |
| `/reset` | 重置当前会话 |
| `/donate` | 💛 支持作者 |

---

## 第五步：接入真正的 AI 模型

默认的 mock agent 只是回显消息，想要真正的 AI 能力，需要接入模型。

### 方案 A：DeepSeek（推荐，便宜好用）

使用社区提供的 ACP-DeepSeek agent：

```bash
# 拉取 DeepSeek ACP agent
git clone https://github.com/your-acp-agent/deepseek-agent.git
cd deepseek-agent

# 配置 API Key
export DEEPSEEK_API_KEY=sk-xxxxxxxx

# 启动 agent
node dist/index.js
```

然后在 `.env.docker` 中配置：
```bash
ACP_AGENT_COMMAND=node
ACP_AGENT_ARGS_JSON='["/path/to/deepseek-agent/dist/index.js"]'
```

### 方案 B：Ollama（完全本地，免费）

```bash
# 安装 Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 下载模型
ollama pull qwen2.5:7b

# 使用 Ollama ACP bridge
```

---

## 进阶：群聊配置

### 群聊触发策略

默认情况下，群里只有 `@机器人` 才会触发回复。你可以修改：

```bash
# .env.docker
ONEBOT_ALLOW_GROUP=true          # 允许群聊
ONEBOT_REQUIRE_MENTION_IN_GROUP=true  # 需要 @ 才触发
```

### 每个群独立 System Prompt

编辑 `examples/group-rules.local.json`：

```json
{
  "123456789": {
    "systemPrompt": "你是一个技术群的管理助手，回答要专业简洁。"
  },
  "987654321": {
    "systemPrompt": "你是一个闲聊群的开心果，回答要有趣幽默。"
  }
}
```

---

## 常见问题

### Q: 会被封号吗？
A: 有风险，**强烈建议用小号**。NapCat 是相对稳定的协议实现，但腾讯随时可能升级检测。

### Q: 能接微信吗？
A: 目前只支持 QQ（OneBot 11 协议）。微信没有开放的机器人协议。

### Q: 支持哪些 AI 模型？
A: 任何支持 ACP 协议的 agent 都可以。包括 DeepSeek、OpenAI、Claude、Ollama 本地模型等。

### Q: 如何更新？
A: `docker compose pull && docker compose up -d`

### Q: 内存占用大吗？
A: 基础运行约 200-300MB，加上 AI 模型另算。

---

## 部署到更多平台

### Umbrel（一键安装到家庭服务器）
> 🆕 已提交到 Umbrel App Store：[PR #5834](https://github.com/getumbrel/umbrel-apps/pull/5834)

### CasaOS
> 已提交到 CasaOS App Store：[PR #42](https://github.com/Cp0204/CasaOS-AppStore-Play/pull/42)

### Docker Compose
> 官方 Docker Compose 示例：[PR #781](https://github.com/docker/awesome-compose/pull/781)

---

## 💛 支持作者

这个教程和项目完全免费开源。如果它帮你省了搭建时间，欢迎请我喝杯咖啡：

<div align="center">

| 微信支付 | 支付宝 |
|:---:|:---:|
| ![微信](https://raw.githubusercontent.com/happysnaker/qq-ai-bot/main/assets/wechat-pay.jpg) | ![支付宝](https://raw.githubusercontent.com/happysnaker/qq-ai-bot/main/assets/alipay-pay.jpg) |
| 扫码请备注 `qq-ai-bot` | 扫码请备注 `qq-ai-bot` |

</div>

**¥9.9 起，多少都是心意。**

也提供付费服务：
- **¥29.9** — 快速评审你的 GitHub / 项目页面
- **¥99** — 异步深度评审 + 具体改法建议
- **¥199** — 捆绑评审：GitHub profile + README + 落地页

支付后发邮件到 **happysnaker@foxmail.com**

[→ 更多支持方式](https://happysnaker.github.io/support/#from-qq-ai-bot)

---

## 相关资源

- [项目主页](https://happysnaker.github.io/qq-ai-bot/)
- [GitHub 仓库](https://github.com/happysnaker/qq-ai-bot)
- [架构文档](./ARCHITECTURE.md)
- [ACP Agent 接入指南](./agent-integration.md)
- [Docker 快速演示](./docker-quickstart.md)

---

*如果这个教程帮到了你，请给个 Star ⭐ 并分享给需要的朋友！*
