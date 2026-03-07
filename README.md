# DayTrack

自动化工作日志系统 - 自动采集工作痕迹，AI 生成日报。

## 功能特性

- 📊 **Git Commit 自动采集** - 自动收集本地 git 仓库的 commit 记录
- 🤖 **AI 日报生成** - 基于 OpenAI/火山方舟等大模型自动生成结构化日报
- 🌐 **Web 界面** - 极简现代风格的网页界面，方便查看和编辑日报
- ⚙️ **配置向导** - 交互式 CLI 配置向导，快速完成设置
- 🔌 **可扩展架构** - 设计灵活，方便后续接入更多工作痕迹来源

## 系统要求

- Node.js 16+
- Git (用于采集 commit 记录)
- OpenAI API Key (或火山方舟等其他大模型 API)

## 安装

### 从源码安装

```bash
# 克隆项目
git clone <repository-url>
cd daytrack

# 安装依赖
npm install

# 构建项目
npm run build

# 链接到全局命令
npm link
```

### 在其他电脑上安装

```bash
npm install -g git+https://github.com/你的账号/daytrack.git
```

## 快速开始

### 1. 首次配置

运行配置向导来设置大模型 API：

```bash
daytrack
```

这会启动交互式配置向导，引导你完成：
- 选择大模型提供者（OpenAI / 火山方舟）
- 配置 API Key
- 配置要监控的 Git 仓库

### 2. 采集工作痕迹

```bash
# 采集今日的 git commit
daytrack collect

# 采集指定日期范围
daytrack collect --since 2026-03-01 --until 2026-03-07

# 采集所有历史记录
daytrack collect --all
```

### 3. 生成日报

```bash
# 生成今日日报
daytrack report

# 生成指定日期的日报
daytrack report --date 2026-03-07

# 使用不同的模板
daytrack report --template concise  # 简洁版
daytrack report --template technical  # 技术版

# 强制重新生成（忽略缓存）
daytrack report --force
```

### 4. 启动 Web 界面

```bash
# 启动网页服务器（默认端口 3000）
daytrack web

# 指定端口
daytrack web --port 8080
```

然后在浏览器中打开 `http://localhost:3000` 即可访问网页界面。

## 命令参考

### `daytrack setup`

重新运行配置向导。

```bash
daytrack setup
```

### `daytrack collect`

采集工作痕迹。

**选项：**
- `--git` - 仅从 git 仓库采集
- `--since <date>` - 开始日期 (YYYY-MM-DD)
- `--until <date>` - 结束日期 (YYYY-MM-DD)
- `--all` - 采集所有历史记录（不只是今天）

### `daytrack report`

生成日报。

**选项：**
- `-d, --date <date>` - 日报日期 (YYYY-MM-DD)，默认今天
- `-t, --template <template>` - 使用的模板 (default, concise, technical)
- `-f, --force` - 强制重新生成，即使有缓存

### `daytrack web`

启动 Web UI 和 API 服务器。

**选项：**
- `-p, --port <port>` - 监听端口，默认 3000

## 配置说明

### 配置文件位置

配置文件遵循 XDG 规范：
- 配置文件：`~/.config/daytrack/config.json`
- 数据库文件：`~/.local/share/daytrack/daytrack.db`

### 配置文件内容示例

```json
{
  "llm": {
    "provider": "openai",
    "apiKey": "sk-...",
    "model": "gpt-4"
  },
  "git": {
    "repos": [
      "/path/to/project1",
      "/path/to/project2"
    ]
  }
}
```

## 项目架构

```
daytrack/
├── src/
│   ├── cli/              # CLI 相关
│   │   ├── index.ts      # CLI 入口
│   │   └── setup.ts      # 配置向导
│   ├── collector/        # 工作痕迹采集模块
│   │   ├── git.ts        # git commit 采集器
│   │   └── index.ts      # 采集器注册表
│   ├── generator/        # 日报生成模块
│   │   ├── llm.ts        # 大模型调用
│   │   ├── prompts.ts    # Prompt 模板管理
│   │   └── service.ts    # 日报生成服务
│   ├── storage/          # 数据存储模块
│   │   └── sqlite.ts     # SQLite 实现
│   ├── server/           # 后端 API
│   │   └── index.ts      # Express 服务器
│   └── shared/           # 共享类型和工具
│       ├── config.ts     # 配置管理
│       └── types.ts      # 类型定义
├── openspec/             # OpenSpec 变更提案
├── package.json
└── tsconfig.json
```

## 常见问题

### Q: 如何添加更多的 Git 仓库？

A: 运行 `daytrack setup` 重新配置，或直接编辑 `~/.config/daytrack/config.json` 文件中的 `git.repos` 数组。

### Q: 生成的日报不满意，如何调整？

A: 有几种方式：
1. 使用不同的模板：`daytrack report --template concise` 或 `--template technical`
2. 启动 Web 界面，在界面上手动编辑日报
3. 重新生成：`daytrack report --force`

### Q: 大模型 API 调用费用如何控制？

A: 系统会自动缓存生成的日报 24 小时，避免重复调用。如需重新生成，使用 `--force` 选项。

### Q: 如何更新工具？

A: 如果是从源码安装，在项目目录运行：
```bash
git pull
npm install
npm run build
```

如果是从 GitHub 安装：
```bash
npm install -g git+https://github.com/你的账号/daytrack.git
```

## 开发

```bash
# 开发模式（自动编译）
npm run dev

# 构建
npm run build
```

## 许可证

MIT
