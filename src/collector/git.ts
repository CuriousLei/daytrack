import simpleGit, { SimpleGit, LogResult, DefaultLogFields } from 'simple-git';
import * as path from 'path';
import * as fs from 'fs';
import { GitCommitTrace } from '../shared/types';
import { insertTrace, getTraces } from '../storage/sqlite';
import { loadConfig } from '../shared/config';

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
