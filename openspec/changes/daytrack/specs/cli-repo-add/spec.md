# CLI Repo Add 规范

## 概述

提供 `daytrack add` 命令，方便用户快速扫描并添加 Git 仓库到配置中。

## 功能需求

### 1. 命令签名

```bash
daytrack add [path]
```

- `path`（可选）：要扫描的路径，默认为当前工作目录
- 扫描深度固定为 1（当前目录 + 下一级子目录）

### 2. 扫描逻辑

- 检查指定路径本身是否为 Git 仓库（是否包含 `.git` 目录）
- 列出指定路径下的所有直接子目录
- 检查每个子目录是否为 Git 仓库
- 返回所有找到的 Git 仓库路径

### 3. 路径规范化

- 将相对路径转换为绝对路径
- 解析 `~` 为用户主目录
- 去除末尾的路径分隔符（`/` 或 `\`）
- 解析符号链接（可选，建议解析）

### 4. 去重逻辑

- 加载现有配置中的 `git.repositories` 数组
- 将新找到的仓库路径与现有路径进行比较（使用规范化后的路径）
- 跳过已存在的仓库，只添加新的

### 5. 配置更新

- 将新找到的仓库合并到 `git.repositories` 数组
- 保持现有仓库顺序不变
- 新仓库添加到数组末尾
- 保存配置文件

### 6. 输出反馈

- 显示扫描的路径
- 显示找到的仓库总数
- 列出新添加的仓库
- 列出跳过的仓库（已存在的）
- 使用彩色输出提高可读性

## 非功能需求

- 性能：扫描应该快速完成（即使有很多子目录）
- 容错：某个目录访问失败不应影响其他目录
- 跨平台：支持 Linux、macOS、Windows

## 示例

### 示例 1：扫描当前目录

```bash
$ daytrack add
Scanning current directory and subdirectories...

Found 3 Git repositories:
  ✓ Added: /home/user/projects/daytrack
  ✓ Added: /home/user/projects/project-a
  ↓ Skipped: /home/user/projects/project-b (already in config)

Summary: Added 2 new repositories, skipped 1
```

### 示例 2：扫描指定路径

```bash
$ daytrack add ~/work
Scanning /home/user/work and subdirectories...

Found 2 Git repositories:
  ✓ Added: /home/user/work/api
  ✓ Added: /home/user/work/web

Summary: Added 2 new repositories
```

## 技术实现

### 核心函数

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

### 判断 Git 仓库

一个目录是 Git 仓库当且仅当：
- 目录存在且可访问
- 目录下存在 `.git` 子目录
- `.git` 子目录是一个目录（不是文件）
