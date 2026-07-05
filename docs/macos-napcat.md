# macOS 接入 NapCat

这份文档只讲 **macOS + 本机 QQ + NapCat** 这条路。

先说定位：这是一条**可选辅助流程**，不是标准 quickstart 主入口，也暂时不把它当作已验证主运维方式。

标准启动主线仍然是 [`getting-started.md`](getting-started.md) 里的：

```bash
npm run dev
```

## 相关项目

- [NapCatQQ](https://github.com/NapNeko/NapCatQQ)
- [OneBot 11](https://11.onebot.dev)

## 这组脚本会做什么

- 下载最新 NapCat Shell
- patch QQ，注入 NapCat loader
- 写 OneBot 11 reverse WebSocket 配置
- 拉起 QQ / NapCat
- 辅助显示登录二维码

## 当前默认值

这些默认值优先读取项目根目录 `.env` / `.env.local`，没有时才会退回到默认值。

默认 quickstart 值：

```text
reverse ws: ws://127.0.0.1:16700/onebot/v11/ws
onebot token: change-me
webui token: change-me
qq app: /Applications/QQ.app
```

其中 WebUI token 会按下面顺序读取：

1. `NAPCAT_WEBUI_TOKEN`
2. `WEBUI_TOKEN`
3. 默认值 `change-me`

## 推荐使用顺序

### 1. 先看当前状态

```bash
npm run status:napcat:macos
```

这一步会告诉你：

- QQ 是否正在运行
- NapCat shell 是否存在
- QQ 是否已 patch
- 当前 reverse WS 配置
- 当前 WebUI 配置

### 2. 安装 / patch NapCat

```bash
npm run setup:napcat:macos -- --token change-me --ws-url ws://127.0.0.1:16700/onebot/v11/ws
```

如果你已经在 `.env` 里写好了 token / port / path，这一步也可以直接执行：

```bash
npm run setup:napcat:macos
```

## 3. 启动 NapCat 模式 QQ

```bash
npm run launch:napcat:macos -- --restart
```

## 4. 打开 WebUI 并登录 QQ

NapCat WebUI：

```text
http://127.0.0.1:6099/webui
```

如果还没登录 QQ，可以使用：

```bash
npm run bot:macos -- login
```

它会：

- 先尝试让 NapCat WebUI 就绪
- 如果没登录，刷新二维码
- 终端输出二维码
- 同时写出二维码 PNG 到 `run-logs/qq-login-qr.png`

## `bot:macos` 的定位

常用命令：

```bash
npm run bot:macos -- status
npm run bot:macos -- repair
npm run bot:macos -- login
npm run bot:macos -- up
```

含义：

- `status`：检查 bot / NapCat / QQ 当前状态
- `repair`：刷新 NapCat 配置并重启本机 bot
- `login`：查看登录状态或刷新二维码
- `up`：一键拉起本机 bot + QQ / NapCat

### 很重要：`bot:macos` 依赖构建产物

`bot:macos` 启动的是：

```text
dist/index.js
```

所以在第一次使用 `repair` / `up` 之前，先执行：

```bash
npm run build
```

如果你只是想按源码模式跑 bot，请不要先走 `bot:macos`，而是：

```bash
npm run dev
```

## 常见流程示例

### 流程 A：标准源码模式 + NapCat

```bash
npm run dev
npm run status:napcat:macos
npm run setup:napcat:macos -- --token change-me --ws-url ws://127.0.0.1:16700/onebot/v11/ws
npm run launch:napcat:macos -- --restart
curl http://127.0.0.1:8080/status
```

### 流程 B：本机辅助模式

```bash
npm install
npm run build
npm run bot:macos -- up
npm run bot:macos -- login
```

## 自定义参数

如果你需要改 WS 地址、token 或 QQ 路径，可以透传参数：

```bash
npm run setup:napcat:macos -- \
  --ws-url ws://127.0.0.1:16700/onebot/v11/ws \
  --token change-me \
  --webui-token change-me \
  --qq-app /Applications/QQ.app
```

如果 QQ 已经开着，想强制重启：

```bash
npm run launch:napcat:macos -- --restart
```

## EPERM / patch 失败怎么办

如果你看到类似：

```text
EPERM: operation not permitted, open '/Applications/QQ.app/.../package.json'
```

一般是 macOS 阻止写入 app bundle。

优先检查：

1. QQ 是否真的完全退出
2. 终端是否有 Full Disk Access
3. 是否先执行过 `npm run setup:napcat:macos`

`setup:napcat:macos` 当前会在 patch 前尽量停掉 QQ 主进程和 helper 进程，但系统权限仍然可能拦截写入。

## 恢复原始 QQ

```bash
npm run restore:qq:macos
```

## 建议

- 第一步永远先跑 `npm run status:napcat:macos`
- `.env` 里把 token 改成你自己的值
- 源码模式优先 `npm run dev`
- `bot:macos` 只当本机运维辅助，不要当标准 quickstart
