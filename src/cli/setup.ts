import * as inquirer from 'inquirer';
import * as chalk from 'chalk';
import { saveConfig } from '../shared/config';
import { Config } from '../shared/types';

export async function runSetupWizard(): Promise<void> {
  console.log(chalk.bold.blue('\n🚀 Welcome to daytrack!\n'));

  // 步骤 1: 欢迎介绍
  console.log('This tool will help you track your daily work and generate AI-powered reports.\n');

  // 步骤 2: 选择模型提供者
  const { provider } = await inquirer.prompt([
    {
      type: 'list',
      name: 'provider',
      message: 'Which LLM provider would you like to use?',
      choices: [
        { name: 'OpenAI (recommended)', value: 'openai' },
        { name: '火山方舟 (Volcengine Ark)', value: 'volcengine-ark' }
      ]
    }
  ]);

  // 步骤 3: 配置选中的提供者
  let providerConfig: any;

  if (provider === 'openai') {
    providerConfig = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiKey',
        message: 'Enter your OpenAI API key:'
      },
      {
        type: 'input',
        name: 'model',
        message: 'Enter default model (e.g., gpt-4o):',
        default: 'gpt-4o'
      }
    ]);
  } else if (provider === 'volcengine-ark') {
    providerConfig = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiKey',
        message: 'Enter your Volcengine Ark API key:'
      },
      {
        type: 'input',
        name: 'baseUrl',
        message: 'Enter API base URL:',
        default: 'https://ark.cn-beijing.volces.com/api/v3'
      },
      {
        type: 'input',
        name: 'model',
        message: 'Enter default model:'
      }
    ]);
  }

  // 步骤 4: 可选配置 git 仓库
  const { configureGit } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'configureGit',
      message: 'Would you like to configure git repositories to track?',
      default: true
    }
  ]);

  let gitConfig: any = {};
  if (configureGit) {
    const { repos } = await inquirer.prompt([
      {
        type: 'input',
        name: 'repos',
        message: 'Enter git repository paths (comma-separated):'
      }
    ]);
    gitConfig = {
      repositories: repos.split(',').map((r: string) => r.trim())
    };
  }

  // 步骤 5: 确认并保存
  const config: Config = {
    llm: {
      defaultProvider: provider,
      providers: {
        [provider]: providerConfig
      }
    },
    git: configureGit ? gitConfig : undefined
  };

  console.log(chalk.bold('\n📋 Configuration Summary:'));
  console.log(JSON.stringify(config, null, 2));

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Does this look correct?',
      default: true
    }
  ]);

  if (confirm) {
    saveConfig(config);
    console.log(chalk.green('\n✅ Configuration saved!'));
    console.log('\nNext steps:');
    console.log('  1. Run `daytrack web` to start the web UI');
    console.log('  2. Start tracking your work!');
  } else {
    console.log(chalk.yellow('\nConfiguration cancelled. Run `daytrack setup` to try again.'));
  }
}
