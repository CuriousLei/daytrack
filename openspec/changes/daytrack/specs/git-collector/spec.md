# Git Collector 规范

## 概述

采集本地 git 仓库的 commit 记录，作为工作痕迹的来源之一。

## 功能需求

### 1. 仓库配置
- 用户可以配置要监控的 git 仓库路径列表
- 支持单个仓库或多个仓库
- 支持递归扫描某个目录下的所有 git 仓库（可选）
- 仓库配置保存在配置文件中

### 2. Commit 采集
- **技术选型**：使用 `simple-git` 库
- 按日期采集 commit 记录
- 采集的信息包括：
  - repo: 仓库路径
  - repoName: 仓库名（从路径提取）
  - hash: commit hash
  - shortHash: 短 hash（前7位）
  - message: commit message
  - body?: commit body（可选）
  - author: 作者名
  - authorEmail: 作者邮箱
  - timestamp: commit 时间
  - filesChanged: 变更的文件列表
  - additions?: 新增行数（可选）
  - deletions?: 删除行数（可选）

### 3. 去重与增量
- **采集策略**：定时轮询（第一期）
- 支持增量采集，避免重复采集已有的 commit
- 使用 commit hash 作为唯一标识
- 记录上次采集时间，只采集新的 commit

### 4. 定时采集
- 支持每天定时采集（可配置时间）
- 也支持手动触发采集
- 提供 API 端点手动触发

### 5. 过滤与清洗
- 自动过滤纯 merge commit
- 自动过滤纯格式调整的 commit（如 "format", "lint", "style" 等关键词）
- 用户可以自定义过滤规则（可选）

## 非功能需求

- 采集性能：即使有大量仓库和 commit，也应该快速完成
- 容错：某个仓库采集失败不应影响其他仓库
- 隐私：所有采集都在本地完成，不上传任何数据

## 数据模型

```typescript
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
```

## 技术选型

| 方案 | 优点 | 缺点 | 推荐 |
|------|------|------|------|
| **simple-git** | 轻量，API 友好 | 功能相对简单 | ✅ 推荐 |
| **nodegit** | 功能强大，原生绑定 | 编译复杂，体积大 | ❌ 不推荐 |
| **直接调用 git CLI** | 最灵活，功能最全 | 需要解析输出，跨平台问题 | ⚠️ 备选 |

## 扩展点

- 未来可以支持 git hooks 方式实现实时采集
- 未来可以支持采集 git diff 信息
- 未来可以支持采集分支、PR 等信息
- 未来可以支持更多 git 平台的集成
