import * as fs from 'fs';
import * as path from 'path';
import { Config } from './types';

// 获取配置文件路径（遵循 XDG 规范）
function getConfigDir(): string {
  const configHome = process.env.XDG_CONFIG_HOME || path.join(process.env.HOME || '~', '.config');
  return path.join(configHome, 'daytrack');
}

function getConfigPath(): string {
  return path.join(getConfigDir(), 'config.json');
}

// 确保配置目录存在
function ensureConfigDir(): void {
  const configDir = getConfigDir();
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

// 加载配置
export function loadConfig(): Config | null {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as Config;
  } catch (error) {
    console.error('Error loading config:', error);
    return null;
  }
}

// 保存配置
export function saveConfig(config: Config): void {
  ensureConfigDir();
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

// 检查配置是否存在
export function configExists(): boolean {
  return fs.existsSync(getConfigPath());
}
