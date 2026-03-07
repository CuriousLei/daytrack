#!/usr/bin/env node

import { Command } from 'commander';
import { configExists, loadConfig } from '../shared/config';
import { runSetupWizard } from './setup';
import { startServer } from '../server';
import { collectAllGitRepos, getTodayDateRange } from '../collector/git';
import { dailyReportService } from '../generator/service';
import chalk from 'chalk';

const program = new Command();

program
  .name('daytrack')
  .description('Daily work tracker with AI-generated reports')
  .version('0.1.0');

program
  .command('setup')
  .description('Run configuration wizard')
  .action(async () => {
    await runSetupWizard();
  });

program
  .command('web')
  .description('Start web UI and API server')
  .option('-p, --port <port>', 'Port to listen on', '3000')
  .action(async (options) => {
    const port = parseInt(options.port, 10);
    console.log(chalk.blue(`Starting daytrack server on port ${port}...`));
    startServer(port);
  });

program
  .command('collect')
  .description('Collect work traces from configured sources')
  .option('--git', 'Only collect from git repositories')
  .option('-s, --since <date>', 'Start date (YYYY-MM-DD)')
  .option('-u, --until <date>', 'End date (YYYY-MM-DD)')
  .option('-a, --all', 'Collect all history (not just today)')
  .action(async (options) => {
    console.log(chalk.blue('Collecting work traces...'));
    
    let since: Date | undefined;
    let until: Date | undefined;
    
    if (!options.all) {
      const todayRange = getTodayDateRange();
      since = todayRange.since;
      until = todayRange.until;
      console.log(chalk.gray(`Collecting traces for today (${since.toISOString().split('T')[0]})`));
    }
    
    if (options.since) {
      since = new Date(options.since);
      since.setHours(0, 0, 0, 0);
    }
    
    if (options.until) {
      until = new Date(options.until);
      until.setHours(23, 59, 59, 999);
    }
    
    if (options.git || !options.git) {
      const result = await collectAllGitRepos(since, until);
      console.log(chalk.green(`Collected ${result.total} traces from ${result.repos} repositories`));
    }
  });

program
  .command('report')
  .description('Generate daily report')
  .option('-d, --date <date>', 'Date for the report (YYYY-MM-DD)', new Date().toISOString().split('T')[0])
  .option('-t, --template <template>', 'Template to use (default, concise, technical)', 'default')
  .option('-f, --force', 'Force regenerate even if cached')
  .action(async (options) => {
    try {
      console.log(chalk.blue(`Generating report for ${options.date}...`));
      const report = await dailyReportService.generateReport(options.date, options.template, options.force);
      console.log(chalk.green('\nReport generated successfully!\n'));
      console.log(report.generatedContent);
    } catch (error) {
      console.error(chalk.red('Error generating report:'), (error as Error).message);
    }
  });

program.action(async () => {
  if (!configExists()) {
    console.log('Welcome to daytrack! Let\'s set it up first.');
    await runSetupWizard();
  } else {
    console.log('daytrack is already configured.');
    console.log('Run `daytrack web` to start the web UI.');
    console.log('Run `daytrack collect` to collect work traces.');
    console.log('Run `daytrack report` to generate a daily report.');
    console.log('Run `daytrack setup` to reconfigure.');
  }
});

program.parse();
