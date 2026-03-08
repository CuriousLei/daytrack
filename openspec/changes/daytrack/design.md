## Context

这是一个全新的项目，从零开始构建。主要约束是：
- 优先考虑本地运行，保护用户隐私
- 需要跨平台支持（至少 Linux/macOS）
- 极简现代风格的 UI
- 可扩展架构，方便后续添加更多工作痕迹来源

## Goals / Non-Goals

**Goals:**
- 每日自动采集 git commit 记录
- 调用大模型生成可读性高的日报
- 提供简单的网页界面，支持查看和生成日报（第一期简化版）
- 提供类似 OpenClaw 的 CLI 配置向导
- 设计可扩展的架构，方便后续接入更多来源

**Non-Goals:**
- 第一期不做云端同步
- 第一期不做多用户支持
- 第一期不做全局悬浮输入框（后期再加）
- 第一期不做复杂的数据分析和可视化
- 第一期不做 commit 过滤逻辑（merge commit、格式调整等，后期再加）

## Decisions

### 1. 技术栈选择（已确定）
- **CLI**：Node.js，使用 `inquirer` 做交互式向导
- **后端**：Node.js + Express
- **前端**：纯 HTML + 原生 JavaScript（第一期简化版）
- **存储**：better-sqlite3
- **Git 采集**：simple-git
- **大模型**：优先 OpenAI，支持扩展（火山方舟等）
- **全局悬浮框**：第一期不做，后期再考虑 Tauri 或其他方案

**理由**：Node.js 生态成熟，better-sqlite3 简单直接性能好，simple-git 轻量易用。第一期网页界面简化为纯 HTML + JS，快速上线，后期再迭代增强。

### 2. 项目架构
```
daytrack/
├── cli/               # CLI 相关
│   ├── index.ts       # CLI 入口
│   ├── setup.ts       # 配置向导
│   └── commands/      # CLI 子命令
├── collector/         # 工作痕迹采集模块
│   ├── git.ts         # git commit 采集器（simple-git）
│   └── index.ts       # 采集器注册表（可扩展）
├── generator/         # 日报生成模块
│   ├── llm.ts        # 大模型调用
│   ├── prompts.ts    # Prompt 模板管理
│   └── cache.ts      # LLM 缓存
├── storage/           # 数据存储模块
│   └── sqlite.ts     # better-sqlite3 实现
├── public/            # 网页界面（纯 HTML + JS）
│   └── index.html     # 单页应用
├── server/            # 后端 API
│   └── index.ts       # Express 服务器（同时托管静态文件）
├── shared/            # 共享类型和工具
│   ├── config.ts      # 配置管理
│   └── types.ts       # 类型定义
└── config.ts          # 配置文件
```

**理由**：模块化设计，每个功能独立，方便后续扩展新的采集器。第一期网页界面简化为单 HTML 文件，由 Express 直接托管。

### 3. 数据模型
```typescript
// 工作痕迹（抽象接口）
interface WorkTrace {
  id: string;
  source: string; // 'git', 'manual', etc.
  timestamp: Date;
  content: string;
  metadata?: Record<string, any>;
}

// Git commit 痕迹（详细）
interface GitCommitTrace extends WorkTrace {
  source: 'git';
  repo: string;
  repoName: string;
  hash: string;
  shortHash: string;
  message: string;
  body?: string;
  author: string;
  authorEmail: string;
  timestamp: Date;
  filesChanged: string[];
  additions?: number;
  deletions?: number;
}

// 手动输入的工作项（后期可能需要）
interface ManualTrace extends WorkTrace {
  source: 'manual';
  content: string;
}

// 日报
interface DailyReport {
  id: string;
  date: string; // YYYY-MM-DD
  traceIds: string[];
  generatedContent: string;
  editedContent?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**理由**：抽象 WorkTrace 接口，GitCommitTrace 包含详细信息便于生成日报。

### 4. 数据库 Schema（SQLite）

```sql
-- 工作痕迹表
CREATE TABLE IF NOT EXISTS work_traces (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 日报表
CREATE TABLE IF NOT EXISTS daily_reports (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  trace_ids TEXT NOT NULL,
  generated_content TEXT,
  edited_content TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- LLM 缓存表
CREATE TABLE IF NOT EXISTS llm_cache (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  expires_at INTEGER NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_work_traces_source ON work_traces(source);
CREATE INDEX IF NOT EXISTS idx_work_traces_timestamp ON work_traces(timestamp);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(date);
CREATE INDEX IF NOT EXISTS idx_llm_cache_expires_at ON llm_cache(expires_at);
```

### 5. 大模型扩展设计

```typescript
// 大模型提供者接口
interface LLMProvider {
  name: string;
  isConfigured(): boolean;
  validateConfig(): Promise<boolean>;
  generate(prompt: string, options?: LLMOptions): Promise<string>;
  getModels?(): Promise<string[]>;
}

interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

// OpenAI 提供者
class OpenAIProvider implements LLMProvider {
  name = 'openai';
  // 实现...
}

// 火山方舟提供者
class VolcengineArkProvider implements LLMProvider {
  name = 'volcengine-ark';
  // 实现...
}
```

### 6. Prompt 策略

#### 默认 Prompt 模板
```
# 角色
你是一位专业的研发日报撰写助手。

# 任务
根据我提供的碎片信息（可能包括 git commit 记录、代码 diff 摘要、会议笔记、聊天记录等），帮我生成一份结构清晰的工作日报。

# 输出格式
## 📅 工作日报 - {date}

### 今日完成
- [项目/模块名] 具体做了什么事（用业务语言描述，而非 commit message 原文）

### 进行中
- [项目/模块名] 当前进展与状态

### 明日计划
- 根据今日工作合理推断下一步计划

### 备注/风险
- 如有阻塞、依赖或风险点请列出

# 规则
1. 将技术性的 commit message 转化为**非技术人员也能理解**的业务语言
2. 合并同一功能的多个 commit 为一条工作项
3. 过滤掉纯 merge、格式调整等无实质内容的提交
4. 每条工作项控制在 1-2 句话
5. 如果信息不足以推断明日计划，该部分标注"待补充"

# 以下是我的碎片工作痕迹：
{traces}
```

#### 多模板支持
- **default** - 默认模板（如上）
- **concise** - 简洁版（更短、更凝练）
- **technical** - 技术版（包含技术细节）

#### 动态优化
- 根据工作痕迹数量动态调整 prompt
- 0 条：提示补充
- 1-2 条：正常生成 + 提示信息少
- 3-10 条：正常生成
- >10 条：强调合并

### 7. 后端 API 端点设计

```
GET    /api/traces              # 获取工作痕迹列表
POST   /api/traces              # 创建工作痕迹（手动输入）
GET    /api/traces/:id          # 获取单个工作痕迹
DELETE /api/traces/:id          # 删除工作痕迹

GET    /api/reports             # 获取日报列表
GET    /api/reports/:date       # 获取某一天的日报
POST   /api/reports/:date/generate  # 生成日报
PUT    /api/reports/:date       # 编辑日报

GET    /api/config              # 获取配置
PUT    /api/config              # 更新配置

POST   /api/collect/git         # 手动触发 git 采集
POST   /api/collect/all         # 手动触发所有采集
```

### 8. CLI 配置向导设计

**触发方式：**
- `daytrack` - 首次运行自动启动向导
- `daytrack setup` - 手动启动向导
- `daytrack config` - 配置管理

**向导流程：**
1. 欢迎与介绍
2. 选择大模型提供者（OpenAI / 火山方舟）
3. 配置选中的模型（API Key、默认模型等）
4. 可选：配置 git 仓库
5. 确认与保存

**配置文件位置：**
- 遵循 XDG 规范：`~/.config/daytrack/config.json`
- 数据库位置：`~/.local/share/daytrack/daytrack.db`

**技术选择：**
- `inquirer` - 交互式 CLI
- `chalk` - 彩色输出

### 9. `daytrack add` 命令设计

**命令签名：**
```bash
daytrack add [path]
```

**示例：**
```bash
# 扫描当前目录和下一级
daytrack add

# 扫描指定目录和下一级
daytrack add ~/projects
```

**执行流程：**
1. 解析参数，获取扫描路径（默认为当前目录）
2. 扫描路径（深度=1，当前目录 + 下一级）
3. 过滤出包含 `.git/` 目录的仓库
4. 规范化路径（转绝对路径、解析 ~、去除末尾斜杠）
5. 加载现有配置，去重（跳过已存在的仓库）
6. 合并新仓库到配置的 `git.repositories` 数组
7. 保存配置
8. 显示结果摘要（添加了哪些，跳过了哪些）

**核心函数：**
```typescript
// 扫描指定路径，找出所有 Git 仓库（深度=1）
function findGitRepos(basePath: string): string[]

// 规范化路径
function normalizePath(path: string): string

// 将新仓库添加到配置
function addReposToConfig(newRepos: string[]): { 
  added: string[], 
  skipped: string[] 
}
```

**配置字段统一：**
- 代码中使用 `git.repositories`
- 修复 README.md 中的错误（`git.repos` → `git.repositories`）

### 10. 简化网页界面设计（第一期）

**技术方案：**
- 单文件 HTML + 原生 JavaScript
- 由 Express 托管静态文件（`app.use(express.static('public'))`）
- 使用 Fetch API 调用后端 API

**界面布局：**
```
┌─────────────────────────────────────────────────────────┐
│  DayTrack - 日报                                        │
├──────────────────┬──────────────────────────────────────┤
│  日报列表        │                                      │
│                  │                                      │
│  2026-03-07 ◀   │  📅 工作日报 - 2026-03-07          │
│  2026-03-06     │                                      │
│  2026-03-05     │  ### 今日完成                        │
│  ...             │  - [daytrack] 实现了 add 命令        │
│                  │  - [daytrack] 简化了网页界面         │
│  [重新生成]      │                                      │
│                  │  ### 进行中                          │
│                  │  - ...                               │
│                  │                                      │
└──────────────────┴──────────────────────────────────────┘
```

**功能范围（第一期）：**
- ✅ 显示最近 30 天的日报列表
- ✅ 点击日期查看日报内容
- ✅ "重新生成"按钮 - 重新生成选中日期的日报
- ❌ 编辑日报（后期再加）
- ❌ 手动输入工作痕迹（后期再加）
- ❌ 设置页面（后期再加）
- ❌ 深色/浅色模式（后期再加）
- ❌ 响应式设计（后期再加）

**实现细节：**
- 所有代码在一个 `public/index.html` 文件中
- 使用 `<style>` 标签写简单的 CSS
- 使用 `<script>` 标签写 JS 逻辑
- 左侧列表使用 `<div>` 或 `<ul>`
- 右侧内容使用 `<pre>` 或 `<div>` 显示 Markdown 格式的日报

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 大模型 API 调用成本 | SQLite 缓存 24 小时，用户可重新生成 |
| Git 仓库位置发现困难 | 让用户配置要监控的仓库路径 |
| 第一期没有全局悬浮框 | 可以通过网页界面手动输入，后期再加 |
| CLI 向导体验不佳 | 参考 OpenClaw 的向导设计，保持简洁清晰 |

## Open Questions

1. ~~大模型的 prompt 策略？~~ → 已确定，见上文
2. ~~第一期是否需要手动输入功能？~~ → 可以通过网页界面实现
3. ~~技术选型确认？~~ → 已确认，见上文

## Git 采集功能范围决定

### 5.4 增量采集和去重（做）
- **理由**：实现简单（用 commit hash 去重），避免重复采集浪费时间和 LLM 成本，体验提升明显
- **实现方式**：记录上次采集的最后一个 commit hash，只采集新的 commit

### 5.5 commit 过滤逻辑（先不做）
- **内容**：过滤 merge commit、格式调整等无意义提交
- **理由**：第一期可以先不过滤，让 LLM 自己处理，后期再加也不迟，减少初始复杂度
- **后期规划**：可以在配置里加过滤规则，支持自定义关键词过滤

## 测试验证清单（端到端）

### 核心流程测试（采集 → 生成 → 存储）

- [ ] 测试项目能正常初始化（.git 目录存在）
- [ ] 测试 commit 能正常创建
- [ ] `daytrack add` 能成功添加测试项目
- [ ] `daytrack collect` 能采集到所有 commit
- [ ] 数据库 `work_traces` 表中能看到采集的痕迹
- [ ] `daytrack report` 能成功生成日报
- [ ] 数据库 `daily_reports` 表中能看到生成的日报

### 测试项目准备

创建测试用的 Git 项目，包含以下 commit：
- "feat: 初始化项目结构"
- "feat: 添加用户认证模块"
- "fix: 修复登录页面的 bug"
- "docs: 更新 README 文档"
- "refactor: 重构数据访问层"

### 测试步骤

1. 准备测试环境（创建带 Git 仓库的测试项目）
2. 往测试项目中 commit 一些文字
3. 配置 daytrack，添加测试项目
4. 运行 `daytrack collect` 采集
5. 验证数据库中有采集的痕迹
6. 运行 `daytrack report` 生成日报
7. 验证数据库中有生成的日报
