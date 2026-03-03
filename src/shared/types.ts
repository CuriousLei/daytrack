// 工作痕迹（抽象接口）
export interface WorkTrace {
  id: string;
  source: string; // 'git', 'manual', etc.
  timestamp: Date;
  content: string;
  metadata?: Record<string, any>;
}

// Git commit 痕迹
export interface GitCommitTrace extends WorkTrace {
  source: 'git';
  repo: string;
  hash: string;
  message: string;
  author: string;
  filesChanged: string[];
}

// 手动输入的工作项
export interface ManualTrace extends WorkTrace {
  source: 'manual';
  content: string;
}

// 日报
export interface DailyReport {
  id: string;
  date: string; // YYYY-MM-DD
  traces: WorkTrace[];
  generatedContent: string;
  editedContent?: string; // 用户编辑后的内容
  createdAt: Date;
  updatedAt: Date;
}

// 大模型提供者接口
export interface LLMProvider {
  name: string;
  isConfigured(): boolean;
  generate(prompt: string, options?: LLMOptions): Promise<string>;
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// 配置文件结构
export interface Config {
  llm: {
    defaultProvider: string;
    providers: {
      [key: string]: {
        apiKey: string;
        baseUrl?: string;
        model?: string;
      };
    };
  };
  git?: {
    repositories: string[];
  };
}
