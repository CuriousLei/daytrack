## Why

需要一个自动化的工作日志系统，能够自动采集工作痕迹并生成日报，同时提供方便的界面查看和编辑，以及快捷输入临时工作项的方式。

## What Changes

- **新增**：每日自动采集 git commit 记录的功能
- **新增**：调用大模型生成日报的功能（优先 OpenAI，支持扩展火山方舟等）
- **新增**：极简现代风格的网页界面，用于查看和编辑日报
- **新增**：CLI 配置向导，引导用户选择模型、配置 API key
- **新增**：可扩展的架构，方便以后接入更多工作痕迹来源
- **新增**：GitHub + git 安装方式，方便在其他电脑上运行
- **移除**：第一期不做全局悬浮输入框（后期再加）

## Capabilities

### New Capabilities

- `git-collector`: 采集本地 git 仓库的 commit 记录
- `daily-report-generator`: 调用大模型，基于采集的工作痕迹生成日报（支持 OpenAI、火山方舟等扩展）
- `web-ui`: 极简现代风格的网页界面，提供日报查看和编辑功能
- `cli-setup-wizard`: 命令行配置向导，引导用户选择模型、配置 API key
- `extensible-trace-source`: 可扩展的工作痕迹采集架构，支持后续接入更多来源

### Modified Capabilities

（无）

## Impact

- **新增依赖**：Node.js + Express（后端）、Preact + Vite（前端）
- **新增依赖**：SQLite（本地存储）
- **新增依赖**：OpenAI SDK（支持扩展火山方舟等）
- **新增依赖**：交互式 CLI 库（如 inquirer 或 prompts）
- **系统集成**：需要与本地 git 仓库交互
- **分发方式**：GitHub + git 安装，其他电脑可直接 `npm install -g git+https://github.com/你的账号/daytrack.git`

## 分发方式

### 其他电脑上的安装

```bash
# 确保已安装 Node.js 和 git
npm install -g git+https://github.com/你的账号/daytrack.git

# 运行配置向导
daytrack

# 启动网页界面
daytrack web
```

### 更新工具

```bash
# 在开发电脑上修改代码 → push 到 GitHub

# 在其他电脑上更新
npm install -g git+https://github.com/你的账号/daytrack.git
```
