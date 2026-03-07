import { getTraces, insertReport, getReport, updateReport, getLLMCache, setLLMCache } from '../storage/sqlite';
import { createLLMProviderManager } from '../generator/llm';
import { optimizePrompt, renderPrompt } from '../generator/prompts';
import { DailyReport, WorkTrace } from '../shared/types';
import * as crypto from 'crypto';

export class DailyReportService {
  async generateReport(date: string, templateName: string = 'default', forceRegenerate: boolean = false): Promise<DailyReport> {
    const cacheKey = `report-${date}-${templateName}`;

    if (!forceRegenerate) {
      const cached = getLLMCache(cacheKey);
      if (cached) {
        const existingReport = getReport(date);
        if (existingReport) {
          return existingReport;
        }
      }

      const existingReport = getReport(date);
      if (existingReport && existingReport.generatedContent) {
        return existingReport;
      }
    }

    const traces = getTraces(date);
    const { template } = optimizePrompt(traces, templateName);

    if (traces.length === 0) {
      const report: DailyReport = {
        id: crypto.randomUUID(),
        date,
        traceIds: [],
        generatedContent: '当前没有可用的工作痕迹，请手动输入或采集 git 记录。',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      insertReport(report);
      return report;
    }

    const manager = createLLMProviderManager();
    if (!manager) {
      throw new Error('LLM provider not configured. Please run `daytrack setup` first.');
    }

    const provider = manager.getDefaultProvider();
    const generatedContent = await provider.generate(template);

    setLLMCache(cacheKey, generatedContent, 1);

    const existingReport = getReport(date);
    const traceIds = traces.map(t => t.id);

    if (existingReport) {
      updateReport(date, {
        traceIds,
        generatedContent
      });
      const updatedReport = getReport(date);
      if (!updatedReport) {
        throw new Error('Failed to update report');
      }
      return updatedReport;
    } else {
      const report: DailyReport = {
        id: crypto.randomUUID(),
        date,
        traceIds,
        generatedContent,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      insertReport(report);
      return report;
    }
  }

  async getReport(date: string): Promise<DailyReport | null> {
    return getReport(date);
  }

  async editReport(date: string, editedContent: string): Promise<DailyReport> {
    const existingReport = getReport(date);
    if (!existingReport) {
      throw new Error(`Report for ${date} not found`);
    }

    updateReport(date, { editedContent });
    const updatedReport = getReport(date);
    if (!updatedReport) {
      throw new Error('Failed to update report');
    }
    return updatedReport;
  }

  async getRecentReports(limit: number = 30, offset: number = 0): Promise<DailyReport[]> {
    const { getReports } = require('../storage/sqlite');
    return getReports(limit, offset);
  }
}

export const dailyReportService = new DailyReportService();
