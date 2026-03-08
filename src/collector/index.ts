import { WorkTrace } from '../shared/types';

export interface TraceCollector {
  name: string;
  isConfigured(): boolean;
  collect(since?: Date, until?: Date): Promise<WorkTrace[]>;
  collectAndSave(since?: Date, until?: Date): Promise<number>;
}

class CollectorRegistry {
  private collectors: Map<string, TraceCollector> = new Map();

  register(collector: TraceCollector): void {
    this.collectors.set(collector.name, collector);
  }

  get(name: string): TraceCollector | undefined {
    return this.collectors.get(name);
  }

  getAll(): TraceCollector[] {
    return Array.from(this.collectors.values());
  }

  getConfigured(): TraceCollector[] {
    return this.getAll().filter(c => c.isConfigured());
  }
}

export const collectorRegistry = new CollectorRegistry();

export * from './git';
