## 1. 项目初始化

- [x] 1.1 初始化项目结构和 package.json
- [x] 1.2 配置 TypeScript 和基础开发工具
- [ ] 1.3 设置代码规范和格式化工具
- [x] 1.4 创建 .gitignore 和基础配置文件

## 2. 配置管理与 CLI 基础

- [x] 2.1 设计配置文件结构和类型定义
- [x] 2.2 实现配置加载和保存（XDG 规范）
- [x] 2.3 初始化 CLI 入口（commander）
- [x] 2.4 添加 CLI 依赖（inquirer、chalk）
- [x] 2.5 实现 CLI 配置向导骨架

## 3. 数据存储层

- [x] 3.1 设计并实现 SQLite 数据模型（better-sqlite3）
- [x] 3.2 实现数据库初始化和迁移
- [x] 3.3 实现 WorkTrace 的增删改查
- [x] 3.4 实现 DailyReport 的增删改查
- [x] 3.5 实现 LLM 缓存（get/set/invalidate）

## 4. 可扩展采集器架构

- [ ] 4.1 定义 TraceCollector 接口
- [ ] 4.2 实现 CollectorRegistry 注册表
- [ ] 4.3 实现配置系统
- [ ] 4.4 编写采集器基类和工具函数

## 5. Git Collector

- [x] 5.1 添加 simple-git 依赖
- [ ] 5.2 实现 git 仓库配置管理
- [ ] 5.3 实现 git commit 采集逻辑（simple-git）
- [ ] 5.4 实现增量采集和去重（用 commit hash）
- [ ] 5.5 实现过滤逻辑（merge commit、格式调整等）
- [ ] 5.6 添加错误处理和容错

## 6. 大模型集成

- [x] 6.1 添加 openai SDK 依赖
- [x] 6.2 定义统一的 LLMProvider 接口
- [x] 6.3 实现 OpenAI 提供者
- [x] 6.4 预留火山方舟提供者接口（留好位置）
- [x] 6.5 设计并实现 Prompt 模板管理（默认/简洁/技术）
- [x] 6.6 实现默认 Prompt（用户提供的那个专业版本）
- [x] 6.7 实现动态 Prompt 优化（根据 traces 数量调整）
- [ ] 6.8 实现日报生成逻辑
- [x] 6.9 添加缓存和重试机制（LLM 缓存）
- [ ] 6.10 实现重新生成功能

## 7. 后端 API（Express）

- [x] 7.1 添加 express、cors 依赖
- [ ] 7.2 初始化 Express 服务器
- [ ] 7.3 实现工作痕迹相关 API（list/create/get/delete）
- [ ] 7.4 实现日报相关 API（list/get/generate/update）
- [ ] 7.5 实现配置相关 API（get/update）
- [ ] 7.6 实现采集相关 API（git/all）
- [ ] 7.7 添加 CORS 和错误处理中间件
- [ ] 7.8 添加基础日志

## 8. 网页界面（Preact + Vite + Tailwind + shadcn/ui）

- [ ] 8.1 初始化 Preact + Vite 项目
- [ ] 8.2 配置 Tailwind CSS
- [ ] 8.3 配置 shadcn/ui 组件库
- [ ] 8.4 实现 Layout 组件（侧边栏、头部）
- [ ] 8.5 实现日报列表页（按月份分组）
- [ ] 8.6 实现日报详情页（显示、编辑、重新生成）
- [ ] 8.7 实现工作痕迹列表组件
- [ ] 8.8 实现设置页（大模型、git 仓库、prompt 模板）
- [ ] 8.9 添加深色/浅色模式切换
- [ ] 8.10 实现响应式设计

## 9. 集成和测试

- [ ] 9.1 前后端集成
- [ ] 9.2 编写基础测试
- [ ] 9.3 端到端测试
- [ ] 9.4 修复 bug 和优化

## 10. 文档和打包

- [ ] 10.1 编写使用说明（README）
- [ ] 10.2 配置构建和打包
- [ ] 10.3 准备发布（可选）

## 后期可选（全局悬浮框等）

- [ ] 12.1 全局悬浮输入框（Tauri）
- [ ] 12.2 更多工作痕迹来源
- [ ] 12.3 数据可视化
