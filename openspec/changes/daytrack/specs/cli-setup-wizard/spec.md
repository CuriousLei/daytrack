# CLI Setup Wizard 规范

## 概述

类似 OpenClaw 的命令行配置向导，在首次运行时引导用户完成配置。

## 功能需求

### 1. 触发方式
- 首次运行 `daytrack` 命令时自动启动
- 也可以通过 `daytrack setup` 或 `daytrack config` 手动启动
- 如果配置已存在，询问是否重新配置

### 2. 配置向导流程

#### 步骤 1：欢迎与介绍
- 显示欢迎信息
- 简单介绍这个工具的功能
- 询问是否继续配置

#### 步骤 2：选择大模型提供者
- 显示可用的模型列表：
  - [ ] OpenAI（推荐）
  - [ ] 火山方舟（Volcengine Ark）
  - [ ] 两者都配置（后期可能需要）
- 让用户选择一个或多个

#### 步骤 3：配置选中的模型提供者（OpenAI）
- 询问 OpenAI API Key
- 询问默认模型（gpt-4o、gpt-4、gpt-3.5-turbo 等）
- 可选：测试 API Key 是否有效

#### 步骤 3（备选）：配置选中的模型提供者（火山方舟）
- 询问火山方舟 API Key
- 询问 API Base URL（默认：https://ark.cn-beijing.volces.com/api/v3）
- 询问默认模型
- 可选：测试 API Key 是否有效

#### 步骤 4：配置 git 仓库（可选）
- 询问是否要配置 git 仓库监控
- 如果是：
  - 让用户输入仓库路径（支持多个）
  - 或者询问是否扫描某个目录下的所有 git 仓库

#### 步骤 5：确认与保存
- 显示配置摘要
- 询问是否确认保存
- 保存到配置文件（~/.config/daytrack/config.json 或类似位置）
- 显示完成信息和下一步提示

### 3. 配置文件结构
```json
{
  "llm": {
    "defaultProvider": "openai",
    "providers": {
      "openai": {
        "apiKey": "sk-...",
        "baseUrl": "https://api.openai.com/v1",
        "model": "gpt-4o"
      },
      "volcengine-ark": {
        "apiKey": "...",
        "baseUrl": "https://ark.cn-beijing.volces.com/api/v3",
        "model": "..."
      }
    }
  },
  "git": {
    "repositories": [
      "/path/to/repo1",
      "/path/to/repo2"
    ]
  }
}
```

### 4. 非交互式配置（可选）
- 支持通过环境变量配置
- 支持通过命令行参数配置
- 支持直接编辑配置文件

## 非功能需求

- 用户体验：流程清晰，问题简单易懂
- 容错：输入验证，友好的错误提示
- 可中断：用户可以随时 Ctrl+C 退出
- 可重试：如果配置失败，提供重试选项

## 技术建议

- 使用 `inquirer` 或 `prompts` 库做交互式 CLI
- 使用 `chalk` 或 `kleur` 做彩色输出
- 配置文件位置：遵循 XDG 规范（~/.config/daytrack/）

## 扩展点

- 未来可以添加更多模型提供者的配置向导
- 未来可以添加更多配置项（网页端口、主题等）
- 未来可以添加配置导入/导出功能
