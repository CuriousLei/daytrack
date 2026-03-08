import simpleGit, { SimpleGit, LogResult, DefaultLogFields } from 'simple-git';
import * as path from 'path';
import * as fs from 'fs';
import { GitCommitTrace, WorkTrace } from '../shared/types';
import { insertTrace, getTraces } from '../storage/sqlite';
import { loadConfig, saveConfig } from '../shared/config';
import { TraceCollector, collectorRegistry } from './index';

export class GitCollector {
  private git: SimpleGit;

  constructor(private repoPath: string) {
    this.git = simpleGit(repoPath);
  }

  private getRepoName(): string {
    return path.basename(this.repoPath);
  }

  private async getLastCollectedCommitHash(): Promise<string | null> {
    const traces = getTraces();
    const gitTraces = traces.filter(t => t.source === 'git' && (t as any).repo === this.repoPath);
    if (gitTraces.length > 0) {
      return (gitTraces[0] as any).hash;
    }
    return null;
  }

  private shouldFilterCommit(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const filterKeywords = ['merge', 'format', 'lint', 'style', 'chore: format', 'chore: lint'];
    return filterKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  async collect(since?: Date, until?: Date): Promise<GitCommitTrace[]> {
    const options: any = {
      '--stat': null,
      '--no-merges': null
    };

    if (since) {
      options['--since'] = since.toISOString();
    }

    if (until) {
      options['--until'] = until.toISOString();
    }

    const lastHash = await this.getLastCollectedCommitHash();
    if (lastHash) {
      options['--reverse'] = null;
    }

    try {
      const log: LogResult<DefaultLogFields> = await this.git.log(options);
      const traces: GitCommitTrace[] = [];

      for (const commit of log.all) {
        if (this.shouldFilterCommit(commit.message)) {
          continue;
        }

        if (lastHash && commit.hash === lastHash) {
          continue;
        }

        const trace: GitCommitTrace = {
          id: `git-${this.getRepoName()}-${commit.hash}`,
          source: 'git',
          content: commit.message,
          repo: this.repoPath,
          repoName: this.getRepoName(),
          hash: commit.hash,
          shortHash: commit.hash.substring(0, 7),
          message: commit.message,
          body: commit.body || undefined,
          author: commit.author_name,
          authorEmail: commit.author_email,
          timestamp: new Date(commit.date),
          filesChanged: [],
          additions: 0,
          deletions: 0
        };

        traces.push(trace);
      }

      return traces.reverse();
    } catch (error) {
      console.error(`Error collecting from ${this.repoPath}:`, error);
      return [];
    }
  }

  async collectAndSave(since?: Date, until?: Date): Promise<number> {
    const traces = await this.collect(since, until);
    for (const trace of traces) {
      insertTrace(trace);
    }
    return traces.length;
  }
}

export async function collectAllGitRepos(since?: Date, until?: Date): Promise<{ total: number; repos: number }> {
  const config = loadConfig();
  if (!config || !config.git?.repositories) {
    return { total: 0, repos: 0 };
  }

  let totalTraces = 0;
  let processedRepos = 0;

  for (const repoPath of config.git.repositories) {
    if (!fs.existsSync(repoPath)) {
      console.warn(`Repository not found: ${repoPath}`);
      continue;
    }

    try {
      const collector = new GitCollector(repoPath);
      const count = await collector.collectAndSave(since, until);
      totalTraces += count;
      processedRepos++;
      if (count > 0) {
        console.log(`Collected ${count} traces from ${repoPath}`);
      }
    } catch (error) {
      console.error(`Failed to collect from ${repoPath}:`, error);
    }
  }

  return { total: totalTraces, repos: processedRepos };
}

export function getTodayDateRange(): { since: Date; until: Date } {
  const now = new Date();
  const since = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const until = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { since, until };
}

export function normalizePath(p: string): string {
  let normalized = p;
  if (normalized.startsWith('~')) {
    const home = process.env.HOME || '';
    normalized = path.join(home, normalized.slice(1));
  }
  normalized = path.resolve(normalized);
  normalized = normalized.replace(/[\/\\]$/, '');
  return normalized;
}

function isGitRepo(dirPath: string): boolean {
  try {
    const gitDir = path.join(dirPath, '.git');
    return fs.existsSync(gitDir) && fs.statSync(gitDir).isDirectory();
  } catch {
    return false;
  }
}

export function findGitRepos(basePath: string): string[] {
  const repos: string[] = [];
  const normalizedBase = normalizePath(basePath);

  if (!fs.existsSync(normalizedBase) || !fs.statSync(normalizedBase).isDirectory()) {
    return repos;
  }

  if (isGitRepo(normalizedBase)) {
    repos.push(normalizedBase);
  }

  try {
    const entries = fs.readdirSync(normalizedBase, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = path.join(normalizedBase, entry.name);
        if (isGitRepo(fullPath)) {
          repos.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${normalizedBase}:`, error);
  }

  return repos;
}

export function addReposToConfig(newRepos: string[]): { added: string[]; skipped: string[] } {
  const config = loadConfig() || {
    llm: { defaultProvider: 'openai', providers: {} },
    git: { repositories: [] }
  };

  if (!config.git) {
    config.git = { repositories: [] };
  }

  const existingRepos = new Set(config.git.repositories.map(normalizePath));
  const added: string[] = [];
  const skipped: string[] = [];

  for (const repo of newRepos) {
    const normalizedRepo = normalizePath(repo);
    if (existingRepos.has(normalizedRepo)) {
      skipped.push(normalizedRepo);
    } else {
      added.push(normalizedRepo);
      config.git.repositories.push(normalizedRepo);
      existingRepos.add(normalizedRepo);
    }
  }

  if (added.length > 0) {
    saveConfig(config);
  }

  return { added, skipped };
}
