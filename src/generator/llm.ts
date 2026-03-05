import OpenAI from 'openai';
import { LLMProvider, LLMOptions, Config } from '../shared/types';
import { loadConfig } from '../shared/config';

// OpenAI 提供者实现
export class OpenAIProvider implements LLMProvider {
  name = 'openai';
  private client: OpenAI | null = null;
  private config: Config['llm']['providers']['openai'];

  constructor(config: Config['llm']['providers']['openai']) {
    this.config = config;
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async validateConfig(): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      // 简单验证：调用 list models
      const client = this.getClient();
      await client.models.list();
      return true;
    } catch (error) {
      console.error('OpenAI config validation failed:', error);
      return false;
    }
  }

  private getClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseUrl
      });
    }
    return this.client;
  }

  async generate(prompt: string, options?: LLMOptions): Promise<string> {
    const client = this.getClient();
    const response = await client.chat.completions.create({
      model: options?.model || this.config.model || 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content from LLM');
    }
    return content;
  }

  async getModels(): Promise<string[]> {
    const client = this.getClient();
    const models = await client.models.list();
    return models.data.map(m => m.id);
  }
}

// 火山方舟提供者（预留接口，第一期不实现）
export class VolcengineArkProvider implements LLMProvider {
  name = 'volcengine-ark';
  private config: Config['llm']['providers']['volcengine-ark'];

  constructor(config: Config['llm']['providers']['volcengine-ark']) {
    this.config = config;
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async generate(prompt: string, options?: LLMOptions): Promise<string> {
    // TODO: 实现火山方舟调用
    throw new Error('Volcengine Ark not implemented yet');
  }
}

// 提供者管理器
export class LLMProviderManager {
  private providers: Map<string, LLMProvider> = new Map();
  private defaultProvider: string;

  constructor(config: Config) {
    this.defaultProvider = config.llm.defaultProvider;

    // 注册 OpenAI 提供者
    if (config.llm.providers.openai) {
      this.providers.set('openai', new OpenAIProvider(config.llm.providers.openai));
    }

    // 注册火山方舟提供者
    if (config.llm.providers['volcengine-ark']) {
      this.providers.set('volcengine-ark', new VolcengineArkProvider(config.llm.providers['volcengine-ark']));
    }
  }

  getProvider(name?: string): LLMProvider {
    const providerName = name || this.defaultProvider;
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }
    return provider;
  }

  getDefaultProvider(): LLMProvider {
    return this.getProvider(this.defaultProvider);
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// 从配置创建提供者管理器
export function createLLMProviderManager(): LLMProviderManager | null {
  const config = loadConfig();
  if (!config) return null;
  return new LLMProviderManager(config);
}
