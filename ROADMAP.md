# Roadmap

`qq-ai-bot` 的核心方向不是做一个只会回消息的玩具 bot，而是做成一个可继续扩展的 **QQ ↔ AI / ACP bridge** 基础设施仓库。

当前已经有：

- OneBot 11 forward / reverse WebSocket
- NapCat / LLOneBot 兼容
- ACP session 复用与持久化
- 进度回传
- Docker 演示栈
- 健康检查与基础管理命令

接下来优先做的事情如下。

## v0.2.0

### 1. 可插拔 session store

当前默认是文件持久化。

目标：

- 抽象出统一的 session store 接口
- 保留当前 file store
- 增加 Redis 作为第一种外部存储实现

为什么重要：

- 多实例部署需要共享会话
- 更适合长期运行与容器化部署

当前状态：

- 已完成 `SessionStore` 抽象
- 已保留默认 `file` store
- 已增加 `redis` store 与配置入口
- 下一步可继续补 Postgres / managed store 之类的外部实现

### 2. 基础 observability

当前已有 `/healthz` 和 `/readyz`，下一步希望补齐最基础的运行指标。

目标：

- 增加 `/metrics`
- 暴露 OneBot 连接状态、会话数、消息处理计数、agent 调用计数
- 为排障和部署验证提供更清晰的信号

### 3. build / version 元数据

目标：

- 在 `/readyz` 和 `/status` 中返回版本或 commit 信息
- 让线上排障时更容易确认当前运行实例

当前状态：

- 已完成基础版本 / build 信息透出
- 下一步可继续在 Docker / release 流程里自动注入 `APP_GIT_COMMIT` / `APP_BUILD_REF`

## v0.3.0

### 1. richer media

当前主链路优先支持文本与图片。

下一阶段希望补：

- 更完整的附件 / 文件透传
- 更清晰的媒体能力边界
- 更适合生产环境的错误提示

当前状态：

- 已经把 richer media 的第一阶段边界显式化：当收到语音 / 文件 / 视频等当前还不能自动转给 agent 的媒体时，bot 不再静默忽略
- 现在会把“未直传媒体”的摘要显式传给 agent，要求 agent 不要假装已经看过附件，并引导用户补文字摘要或改走文本 / 图片路径
- 下一步才是逐类增加真正的媒体落地能力，例如：
  - 语音先做转写前置位
  - 文件先做临时落盘 / 大小限制 / 生命周期管理
  - 视频只先支持元数据和外链提示，不急着做完整直传

### 2. 更强的运行控制

目标：

- 限流 / 配额
- 审计日志
- 更清晰的管理员操作入口

### 3. channel 演进

`qq-ai-bot` 当前先把 QQ / OneBot 主链路打稳。

后续会继续评估：

- 保持 transport 层与 ACP bridge 解耦
- 复用会话与进度模型到更多 channel

## Help wanted

如果你想提贡献，当前最有价值的方向是：

1. richer media / 附件处理
2. tracing / deeper observability
3. Postgres 或更多外部 session store
4. 多实例部署经验和运维文档

如果你准备提 PR，建议先开 issue 或直接认领已有的 `help wanted` issue。
