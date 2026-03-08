## 1. 项目初始化

- [x] 1.1 初始化项目结构和 package.json
- [x] 1.2 配置 TypeScript 和基础开发工具
- [x] 1.3 设置代码规范和格式化工具
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

- [x] 4.1 定义 TraceCollector 接口
- [x] 4.2 实现 CollectorRegistry 注册表
- [x] 4.3 实现配置系统
- [x] 4.4 编写采集器基类和工具函数

## 5. Git 相关功能（Collector + add 命令）

- [x] 5.1 添加 simple-git 依赖
- [x] 5.2 实现 git 仓库配置管理
- [x] 5.3 实现 git commit 采集逻辑（simple-git）
- [x] 5.4 实现增量采集和去重（用 commit hash）
- [x] 5.5 添加错误处理和容错
- [x] 5.6 实现 `findGitRepos()` 函数 - 扫描指定路径，找出 Git 仓库（深度=1）
- [x] 5.7 实现 `normalizePath()` 函数 - 规范化路径（绝对路径、解析 ~、去末尾斜杠）
- [x] 5.8 实现 `addReposToConfig()` 函数 - 添加仓库到配置，处理去重
- [x] 5.9 在 CLI 中添加 `add` 命令（commander）
- [x] 5.10 实现 `add` 命令逻辑和输出（显示添加/跳过的仓库）

## 6. 大模型集成

- [x] 6.1 添加 openai SDK 依赖
- [x] 6.2 定义统一的 LLMProvider 接口
- [x] 6.3 实现 OpenAI 提供者
- [x] 6.4 预留火山方舟提供者接口（留好位置）
- [x] 6.5 设计并实现 Prompt 模板管理（默认/简洁/技术）
- [x] 6.6 实现默认 Prompt（用户提供的那个专业版本）
- [x] 6.7 实现动态 Prompt 优化（根据 traces 数量调整）
- [x] 6.8 实现日报生成逻辑
- [x] 6.9 添加缓存和重试机制（LLM 缓存）
- [x] 6.10 实现重新生成功能

## 7. 后端 API（Express）

- [x] 7.1 添加 express、cors 依赖
- [x] 7.2 初始化 Express 服务器
- [x] 7.3 实现工作痕迹相关 API（list/create/get/delete）
- [x] 7.4 实现日报相关 API（list/get/generate/update）
- [x] 7.5 实现配置相关 API（get/update）
- [x] 7.6 实现采集相关 API（git/all）
- [x] 7.7 添加 CORS 和错误处理中间件
- [x] 7.8 添加基础日志

## 8. 网页界面（简化版 - 纯 HTML + JS）

- [x] 8.1 创建 public 目录和 index.html 文件
- [x] 8.2 在 Express 中添加静态文件托管（app.use(express.static('public'))）
- [x] 8.3 实现左侧日报列表（显示最近 30 天）
- [x] 8.4 实现右侧日报内容显示
- [x] 8.5 实现点击日期切换日报
- [x] 8.6 实现"重新生成"按钮功能
- [x] 8.7 添加简单的 CSS 样式

## 9. 集成和测试

- [x] 9.1 前后端集成
- [ ] 9.2 编写基础测试
- [ ] 9.3 端到端测试
- [ ] 9.4 修复 bug 和优化

## 10. 文档和打包

- [x] 10.1 编写使用说明（README）
- [x] 10.2 修复 README 中的配置字段名（git.repos → git.repositories）
- [x] 10.3 更新 README 中的项目 URL 和账户名称（https://github.com/CuriousLei/daytrack.git, CuriousLei）
- [x] 10.4 添加 `daytrack add` 命令的使用说明
- [x] 10.5 配置构建和打包
- [ ] 10.6 准备发布（可选）
