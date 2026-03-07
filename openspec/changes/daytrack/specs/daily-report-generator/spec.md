# Daily Report Generator 规范

## 概述

调用大模型，基于采集的工作痕迹生成可读性高的日报。

## 功能需求

### 1. 大模型集成（可扩展）
- **优先支持**：OpenAI
- **扩展支持**：火山方舟（Volcengine Ark）
- **统一接口**：定义统一的 LLMProvider 接口，方便后续添加更多模型
- **配置管理**：支持配置使用的模型、API key、模型参数等

### 2. Prompt 策略

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

#### 动态 Prompt 优化
- 根据工作痕迹数量动态调整：
  - 0 条：提示用户补充
  - 1-2 条：正常生成，提示信息较少
  - 3-10 条：正常生成
  - >10 条：强调合并和重点突出

### 3. 日报生成
- 输入：当天的所有工作痕迹（git commit、手动输入等）
- 输出：结构清晰、可读性高的日报
- 日报内容应包括：
  - 今日总结（1-2段话）
  - 主要工作项（分点列出）
  - 使用的技术/工具
  - 遇到的问题和解决（如有）

### 4. 缓存与优化
- **缓存策略**：
  - 缓存已生成的日报，避免重复调用
  - 用 SQLite 存储缓存
  - 缓存有效期：24 小时
- **重新生成**：支持用户点击"重新生成"，清除缓存重新调用
- **在已有生成内容基础上编辑**：支持用户编辑，保留编辑历史

## 非功能需求

- 生成速度：尽可能快，但优先考虑质量
- 成本控制：提供 token 使用统计，避免意外高额费用
- 容错：大模型调用失败时提供友好的错误提示和重试选项
- 可扩展：添加新的模型提供者应该简单
- 灵活性：用户可以自定义 prompt 模板

## 接口设计

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

// Prompt 模板
interface PromptTemplate {
  name: string;
  template: string;
  variables: string[];
}

// 缓存接口
interface LLMCache {
  get(date: string): string | null;
  set(date: string, content: string): void;
  invalidate(date: string): void;
}
```

## 扩展点

- 未来可以支持本地模型（如 Llama、Mistral 等）
- 未来可以支持多种风格的日报（简洁版、详细版、技术版等）
- 未来可以支持多语言生成
- 未来可以添加更多模型提供者（Claude、文心一言等）
- 未来可以支持参考前几天的日报，保持风格一致
