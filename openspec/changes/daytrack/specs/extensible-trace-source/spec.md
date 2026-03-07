# Extensible Trace Source 规范

## 概述

可扩展的工作痕迹采集架构，方便后续接入更多工作痕迹来源。

## 功能需求

### 1. 抽象采集器接口
- 定义统一的 `TraceCollector` 接口
- 所有采集器实现相同的接口
- 接口方法包括：
  - `collect(date: Date): Promise<WorkTrace[]>` - 采集指定日期的痕迹
  - `validateConfig(): boolean` - 验证配置
  - `getName(): string` - 获取采集器名称

### 2. 采集器注册表
- 集中管理所有可用的采集器
- 支持动态注册和注销采集器
- 支持启用/禁用特定采集器
- 提供采集器列表查询

### 3. 配置系统
- 每个采集器有独立的配置
- 统一的配置文件格式
- 支持配置的热加载（可选）
- 配置验证

### 4. 第一期内置采集器
- **GitCollector** - git commit 采集
- **ManualCollector** - 手动输入工作项

### 5. 未来可扩展的采集器（预留接口）
- 编辑器/IDE 历史（VS Code、JetBrains 等）
- 浏览器历史（特定网站）
- 终端/命令历史
- 日历/会议记录
- 项目管理工具（Jira、Trello 等）
- 其他自定义来源

## 接口定义示例

```typescript
interface WorkTrace {
  id: string;
  source: string;
  timestamp: Date;
  content: string;
  metadata?: Record<string, any>;
}

interface TraceCollector {
  getName(): string;
  isEnabled(): boolean;
  validateConfig(): boolean;
  collect(date: Date): Promise<WorkTrace[]>;
}

interface CollectorRegistry {
  register(collector: TraceCollector): void;
  unregister(name: string): void;
  getEnabled(): TraceCollector[];
  getAll(): TraceCollector[];
}
```

## 非功能需求

- 可扩展性：添加新采集器应该简单，不需要修改核心代码
- 隔离性：一个采集器失败不应影响其他采集器
- 可测试性：每个采集器应该可以独立测试

## 扩展点

- 插件系统：支持第三方采集器插件
- Webhook 支持：支持从外部系统接收工作痕迹
- 定时调度：每个采集器可以有独立的采集频率
