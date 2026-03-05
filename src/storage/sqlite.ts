import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { WorkTrace, DailyReport } from '../shared/types';

// 获取数据库文件路径（遵循 XDG 规范）
function getDbPath(): string {
  const dataHome = process.env.XDG_DATA_HOME || path.join(process.env.HOME || '~', '.local', 'share');
  const daytrackDir = path.join(dataHome, 'daytrack');
  if (!fs.existsSync(daytrackDir)) {
    fs.mkdirSync(daytrackDir, { recursive: true });
  }
  return path.join(daytrackDir, 'daytrack.db');
}

// 初始化数据库
function initDb(): Database.Database {
  const db = new Database(getDbPath());

  // 创建表
  db.exec(`
    CREATE TABLE IF NOT EXISTS work_traces (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS daily_reports (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      trace_ids TEXT NOT NULL,
      generated_content TEXT,
      edited_content TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS llm_cache (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      expires_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_work_traces_source ON work_traces(source);
    CREATE INDEX IF NOT EXISTS idx_work_traces_timestamp ON work_traces(timestamp);
    CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(date);
    CREATE INDEX IF NOT EXISTS idx_llm_cache_expires_at ON llm_cache(expires_at);
  `);

  return db;
}

const db = initDb();

// 工作痕迹操作
export function insertTrace(trace: WorkTrace): void {
  const stmt = db.prepare(`
    INSERT INTO work_traces (id, source, timestamp, content, metadata)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(
    trace.id,
    trace.source,
    Math.floor(trace.timestamp.getTime() / 1000),
    trace.content,
    trace.metadata ? JSON.stringify(trace.metadata) : null
  );
}

export function getTraces(date?: string): WorkTrace[] {
  let stmt;
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    stmt = db.prepare(`
      SELECT * FROM work_traces
      WHERE timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp DESC
    `);
    const rows = stmt.all(
      Math.floor(startOfDay.getTime() / 1000),
      Math.floor(endOfDay.getTime() / 1000)
    );
    return rows.map(rowToTrace);
  } else {
    stmt = db.prepare('SELECT * FROM work_traces ORDER BY timestamp DESC');
    const rows = stmt.all();
    return rows.map(rowToTrace);
  }
}

export function getTraceById(id: string): WorkTrace | null {
  const stmt = db.prepare('SELECT * FROM work_traces WHERE id = ?');
  const row = stmt.get(id);
  return row ? rowToTrace(row) : null;
}

export function deleteTrace(id: string): void {
  const stmt = db.prepare('DELETE FROM work_traces WHERE id = ?');
  stmt.run(id);
}

// 日报操作
export function insertReport(report: DailyReport): void {
  const stmt = db.prepare(`
    INSERT INTO daily_reports (id, date, trace_ids, generated_content, edited_content, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    report.id,
    report.date,
    JSON.stringify(report.traceIds),
    report.generatedContent,
    report.editedContent || null,
    Math.floor(report.createdAt.getTime() / 1000),
    Math.floor(report.updatedAt.getTime() / 1000)
  );
}

export function getReport(date: string): DailyReport | null {
  const stmt = db.prepare('SELECT * FROM daily_reports WHERE date = ?');
  const row = stmt.get(date);
  return row ? rowToReport(row) : null;
}

export function getReports(limit?: number, offset?: number): DailyReport[] {
  let stmt;
  if (limit) {
    stmt = db.prepare(`
      SELECT * FROM daily_reports
      ORDER BY date DESC
      LIMIT ? OFFSET ?
    `);
    const rows = stmt.all(limit, offset || 0);
    return rows.map(rowToReport);
  } else {
    stmt = db.prepare('SELECT * FROM daily_reports ORDER BY date DESC');
    const rows = stmt.all();
    return rows.map(rowToReport);
  }
}

export function updateReport(date: string, updates: Partial<DailyReport>): void {
  const setClauses: string[] = [];
  const values: any[] = [];

  if (updates.traceIds !== undefined) {
    setClauses.push('trace_ids = ?');
    values.push(JSON.stringify(updates.traceIds));
  }
  if (updates.generatedContent !== undefined) {
    setClauses.push('generated_content = ?');
    values.push(updates.generatedContent);
  }
  if (updates.editedContent !== undefined) {
    setClauses.push('edited_content = ?');
    values.push(updates.editedContent);
  }

  if (setClauses.length > 0) {
    setClauses.push('updated_at = ?');
    values.push(Math.floor(Date.now() / 1000));
    values.push(date);

    const stmt = db.prepare(`
      UPDATE daily_reports
      SET ${setClauses.join(', ')}
      WHERE date = ?
    `);
    stmt.run(...values);
  }
}

// LLM 缓存操作
export function getLLMCache(key: string): string | null {
  const now = Math.floor(Date.now() / 1000);
  const stmt = db.prepare('SELECT content FROM llm_cache WHERE id = ? AND expires_at > ?');
  const row = stmt.get(key, now) as { content: string } | undefined;
  return row ? row.content : null;
}

export function setLLMCache(key: string, content: string, ttlDays: number = 1): void {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + (ttlDays * 24 * 60 * 60);

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO llm_cache (id, content, created_at, expires_at)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(key, content, now, expiresAt);
}

export function invalidateLLMCache(key: string): void {
  const stmt = db.prepare('DELETE FROM llm_cache WHERE id = ?');
  stmt.run(key);
}

export function cleanupExpiredCache(): void {
  const now = Math.floor(Date.now() / 1000);
  const stmt = db.prepare('DELETE FROM llm_cache WHERE expires_at <= ?');
  stmt.run(now);
}

// 辅助函数：行转对象
function rowToTrace(row: any): WorkTrace {
  return {
    id: row.id,
    source: row.source,
    timestamp: new Date(row.timestamp * 1000),
    content: row.content,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined
  };
}

function rowToReport(row: any): DailyReport {
  return {
    id: row.id,
    date: row.date,
    traceIds: JSON.parse(row.trace_ids),
    generatedContent: row.generated_content,
    editedContent: row.edited_content,
    createdAt: new Date(row.created_at * 1000),
    updatedAt: new Date(row.updated_at * 1000)
  };
}
