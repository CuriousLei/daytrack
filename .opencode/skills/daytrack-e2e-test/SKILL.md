---
name: daytrack-e2e-test
description: End-to-end test for daytrack - creates test git repo, commits messages, runs collect/report, and opens web UI
license: MIT
compatibility: Requires daytrack CLI and git.
metadata:
  author: CuriousLei
  version: "1.0"
  generatedBy: "1.2.0"
---

# DayTrack 端到端测试 Skill

按照完整流程测试 daytrack 系统：创建测试 Git 仓库、添加 commit、运行采集、生成日报、验证数据库、打开网页。

## 工作流程

```
┌─────────────────────────────────────────────────────────────┐
│  1. 询问用户要提交的 Git commit 信息                          │
│  2. 创建测试项目目录和 Git 仓库                               │
│  3. 创建测试文件并依次 commit                                  │
│  4. 运行 daytrack add 添加测试项目                            │
│  5. 运行 daytrack collect 采集数据                            │
│  6. 验证数据库 work_traces 表                                  │
│  7. 运行 daytrack report 生成日报                             │
│  8. 验证数据库 daily_reports 表                                │
│  9. 启动 daytrack web 服务器                                  │
│ 10. 提示用户打开浏览器访问                                     │
└─────────────────────────────────────────────────────────────┘
```

## 使用方法

调用此 skill 后，会提示你输入想要的 commit 信息（每行一个 commit message），然后自动执行完整测试流程。

## 注意事项

- 测试项目会创建在 `test-fixtures/test-project` 目录
- 会自动清理之前的测试数据（如果存在）
- 需要确保 daytrack 已正确配置（LLM API Key 等）
