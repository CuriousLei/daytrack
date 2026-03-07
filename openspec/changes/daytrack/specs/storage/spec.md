# Storage 规范

## 概述

数据存储层，负责存储工作痕迹和日报数据。

## 功能需求

### 1. 数据库选型
- **技术选型**：better-sqlite3
- **理由**：同步 API，性能好，简单直接
- **数据库文件位置**：遵循 XDG 规范，`~/.local/share/daytrack/daytrack.db`

### 2. 数据库 Schema

```sql
-- 工作痕迹表
CREATE TABLE IF NOT EXISTS work_traces (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL, -- 'git', 'manual', etc.
  timestamp INTEGER NOT NULL, -- Unix timestamp
  content TEXT NOT NULL,
  metadata TEXT, -- JSON
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 日报表
CREATE TABLE IF NOT EXISTS daily_reports (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE, -- YYYY-MM-DD
  trace_ids TEXT NOT NULL, -- JSON array of trace IDs
  generated_content TEXT,
  edited_content TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 大模型缓存表
CREATE TABLE IF NOT EXISTS llm_cache (
  id TEXT PRIMARY KEY, -- date or cache key
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

### 3. 数据操作接口

```typescript
interface Storage {
  // 工作痕迹操作
  insertTrace(trace: WorkTrace): Promise<void>;
  getTraces(date?: string): Promise<WorkTrace[]>;
  getTraceById(id: string): Promise<WorkTrace | null>;
  deleteTrace(id: string): Promise<void>;

  // 日报操作
  insertReport(report: DailyReport): Promise<void>;
  getReport(date: string): Promise<DailyReport | null>;
  getReports(limit?: number, offset?: number): Promise<DailyReport[]>;
  updateReport(date: string, updates: Partial<DailyReport>): Promise<void>;

  // LLM 缓存操作
  getLLMCache(key: string): Promise<string | null>;
  setLLMCache(key: string, content: string, ttlDays?: number): Promise<void>;
  invalidateLLMCache(key: string): Promise<void>;
  cleanupExpiredCache(): Promise<void>;
}
```

### 4. 数据库迁移
- 支持简单的迁移机制
- 版本化 schema
- 首次运行自动创建表

## 非功能需求

- 性能：查询快速，支持大量数据
- 可靠性：数据安全，支持备份
- 简单性：API 简单易用

## 技术选型

| 方案 | 优点 | 缺点 | 推荐 |
|------|------|------|------|
| **better-sqlite3** | 同步 API，性能好，简单直接 | 只有同步 | ✅ 推荐 |
| **sqlite3** | 异步 API | 回调风格 | ❌ 不推荐 |
| **kysely** | 类型安全的查询构建器 | 学习曲线 | ⚠️ 后期可选 |
| **prisma** | 全功能 ORM，迁移管理 | 有点重 | ⚠️ 后期可选 |

## 扩展点

- 未来可以支持加密存储
- 未来可以支持云端同步（可选）
- 未来可以支持数据导出（JSON、CSV 等）
