import { WorkTrace, GitCommitTrace } from '../shared/types';

// Prompt 模板
export interface PromptTemplate {
  name: string;
  template: string;
  variables: string[];
}

// 默认 Prompt 模板
const DEFAULT_PROMPT = `# 角色
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
`;

// 简洁版 Prompt 模板
const CONCISE_PROMPT = `# 角色
你是一位简洁的研发日报撰写助手。

# 任务
根据我提供的工作痕迹，生成一份简洁的日报。

# 输出格式
## 📅 工作日报 - {date}

### 今日完成
- 简短的工作项列表

### 明日计划
- 简短的下一步计划

# 以下是我的碎片工作痕迹：
{traces}
`;

// 技术版 Prompt 模板
const TECHNICAL_PROMPT = `# 角色
你是一位技术详细的研发日报撰写助手。

# 任务
根据我提供的工作痕迹，生成一份包含技术细节的日报。

# 输出格式
## 📅 工作日报 - {date}

### 今日完成
- [项目/模块名] 具体做了什么事（包括技术细节）

### 💻 技术细节
- 具体的技术实现、代码变更、架构决策等

### 明日计划
- 下一步技术工作计划

# 以下是我的碎片工作痕迹：
{traces}
`;

// Prompt 模板集合
export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  default: {
    name: '默认',
    template: DEFAULT_PROMPT,
    variables: ['date', 'traces']
  },
  concise: {
    name: '简洁版',
    template: CONCISE_PROMPT,
    variables: ['date', 'traces']
  },
  technical: {
    name: '技术版',
    template: TECHNICAL_PROMPT,
    variables: ['date', 'traces']
  }
};

// 格式化工作痕迹
export function formatTraces(traces: WorkTrace[]): string {
  return traces.map(trace => {
    if (trace.source === 'git') {
      const gitTrace = trace as GitCommitTrace;
      return `[git] ${gitTrace.repoName}: ${gitTrace.message}`;
    }
    return `[${trace.source}] ${trace.content}`;
  }).join('\n');
}

// 渲染 Prompt
export function renderPrompt(
  templateName: string,
  variables: Record<string, string>
): string {
  const template = PROMPT_TEMPLATES[templateName] || PROMPT_TEMPLATES.default;
  let result = template.template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

// 根据 traces 数量优化 Prompt
export function optimizePrompt(
  traces: WorkTrace[],
  templateName: string = 'default'
): {
  template: string;
  traces: string;
} {
  const traceCount = traces.length;
  const formattedTraces = formatTraces(traces);
  const date = new Date().toISOString().split('T')[0];

  // 基础 Prompt
  let prompt = renderPrompt(templateName, {
    date,
    traces: formattedTraces
  });

  // 根据痕迹数量调整
  if (traceCount === 0) {
    return {
      template: '当前没有可用的工作痕迹，请手动输入或采集 git 记录。',
      traces: ''
    };
  } else if (traceCount <= 2) {
    // 痕迹较少，可以在 Prompt 里加一句提示
    prompt = prompt.replace(
      '# 以下是我的碎片工作痕迹：',
      '# 以下是我的碎片工作痕迹（信息较少，建议补充更多）：'
    );
  }

  return {
    template: prompt,
    traces: formattedTraces
  };
}
