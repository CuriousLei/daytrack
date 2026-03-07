import express, { Request, Response } from 'express';
import cors from 'cors';
import { getTraces, insertTrace, deleteTrace, getTraceById } from '../storage/sqlite';
import { collectAllGitRepos, getTodayDateRange } from '../collector/git';
import { dailyReportService } from '../generator/service';
import { loadConfig, saveConfig, configExists } from '../shared/config';
import { WorkTrace, Config } from '../shared/types';
import * as crypto from 'crypto';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(cors());
app.use(express.json());

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', version: '0.1.0' });
});

app.get('/api/traces', (req: any, res: Response) => {
  const date = req.query.date;
  const traces = getTraces(date);
  res.json(traces);
});

app.get('/api/traces/:id', (req: any, res: Response) => {
  const trace = getTraceById(req.params.id);
  if (!trace) {
    return res.status(404).json({ error: 'Trace not found' });
  }
  res.json(trace);
});

app.post('/api/traces', (req: Request, res: Response) => {
  const { source, content, timestamp } = req.body;
  
  if (!source || !content) {
    return res.status(400).json({ error: 'Source and content are required' });
  }

  const trace: WorkTrace = {
    id: `manual-${crypto.randomUUID()}`,
    source,
    content,
    timestamp: timestamp ? new Date(timestamp) : new Date()
  };

  insertTrace(trace);
  res.status(201).json(trace);
});

app.delete('/api/traces/:id', (req: any, res: Response) => {
  deleteTrace(req.params.id);
  res.status(204).send();
});

app.get('/api/reports', (req: any, res: Response) => {
  const limit = parseInt(req.query.limit || '30', 10);
  const offset = parseInt(req.query.offset || '0', 10);
  const reports = dailyReportService.getRecentReports(limit, offset);
  res.json(reports);
});

app.get('/api/reports/:date', async (req: any, res: Response) => {
  const report = await dailyReportService.getReport(req.params.date);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json(report);
});

app.post('/api/reports/:date/generate', async (req: any, res: Response) => {
  try {
    const template = req.query.template || 'default';
    const force = req.query.force === 'true';
    const report = await dailyReportService.generateReport(req.params.date, template, force);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.put('/api/reports/:date', async (req: any, res: Response) => {
  try {
    const { editedContent } = req.body;
    if (editedContent === undefined) {
      return res.status(400).json({ error: 'editedContent is required' });
    }
    const report = await dailyReportService.editReport(req.params.date, editedContent);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/collect/git', async (req: any, res: Response) => {
  try {
    let since: Date | undefined;
    let until: Date | undefined;
    
    if (req.query.all !== 'true') {
      const todayRange = getTodayDateRange();
      since = todayRange.since;
      until = todayRange.until;
    }
    
    if (req.query.since) {
      since = new Date(req.query.since as string);
      since.setHours(0, 0, 0, 0);
    }
    
    if (req.query.until) {
      until = new Date(req.query.until as string);
      until.setHours(23, 59, 59, 999);
    }
    
    const result = await collectAllGitRepos(since, until);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/collect/all', async (req: any, res: Response) => {
  try {
    let since: Date | undefined;
    let until: Date | undefined;
    
    if (req.query.all !== 'true') {
      const todayRange = getTodayDateRange();
      since = todayRange.since;
      until = todayRange.until;
    }
    
    if (req.query.since) {
      since = new Date(req.query.since as string);
      since.setHours(0, 0, 0, 0);
    }
    
    if (req.query.until) {
      until = new Date(req.query.until as string);
      until.setHours(23, 59, 59, 999);
    }
    
    const gitResult = await collectAllGitRepos(since, until);
    res.json({
      git: gitResult
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/config', (req: Request, res: Response) => {
  if (!configExists()) {
    return res.status(404).json({ error: 'Config not found' });
  }
  const config = loadConfig();
  res.json(config);
});

app.put('/api/config', (req: Request, res: Response) => {
  const config = req.body as Config;
  saveConfig(config);
  res.json(config);
});

export function startServer(port: number = PORT): void {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

export { app };
