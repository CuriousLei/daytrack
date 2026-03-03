#!/usr/bin/env node

import { Command } from 'commander';
import { configExists, loadConfig } from '../shared/config';
import { runSetupWizard } from './setup';

const program = new Command();

program
  .name('daytrack')
  .description('Daily work tracker with AI-generated reports')
  .version('0.1.0');

// setup 命令
program
  .command('setup')
  .description('Run configuration wizard')
  .action(async () => {
    await runSetupWizard();
  });

// web 命令
program
  .command('web')
  .description('Start web UI')
  .option('-p, --port <port>', 'Port to listen on', '3000')
  .action(async (options) => {
    console.log(`Starting web UI on port ${options.port}...`);
    // TODO: 实现 web 服务器
  });

// 默认命令
program.action(async () => {
  if (!configExists()) {
    console.log('Welcome to daytrack! Let\'s set it up first.');
    await runSetupWizard();
  } else {
    console.log('daytrack is already configured.');
    console.log('Run `daytrack web` to start the web UI.');
    console.log('Run `daytrack setup` to reconfigure.');
  }
});

program.parse();
