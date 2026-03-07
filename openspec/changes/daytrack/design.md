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
- 提供极简现代风格的网页界面，支持查看和编辑
- 提供类似 OpenClaw 的 CLI 配置向导
- 设计可扩展的架构，方便后续接入更多来源

**Non-Goals:**
- 第一期不做云端同步
- 第一期不做多用户支持
- 第一期不做全局悬浮输入框（后期再加）
- 第一期不做复杂的数据分析和可视化

## Decisions

### 1. 技术栈选择（已确定）
- **CLI**：Node.js，使用 `inquirer` 做交互式向导
- **后端**：Node.js + Express
- **前端**：Preact + Vite + Tailwind CSS + shadcn/ui
- **存储**：better-sqlite3
- **Git 采集**：simple-git
- **大模型**：优先 OpenAI，支持扩展（火山方舟等）
- **全局悬浮框**：第一期不做，后期再考虑 Tauri 或其他方案

**理由**：Node.js 生态成熟，Preact 与 React API 兼容但更轻量，better-sqlite3 简单直接性能好，simple-git 轻量易用。

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
├── web-ui/            # 网页界面
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   └── ...
├── server/            # 后端 API
│   ├── index.ts       # Express 服务器
│   ├── routes/        # API 路由
│   └── middleware/    # 中间件
├── shared/            # 共享类型和工具
│   ├── config.ts      # 配置管理
│   └── types.ts       # 类型定义
└── config.ts          # 配置文件
```

**理由**：模块化设计，每个功能独立，方便后续扩展新的采集器。

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
