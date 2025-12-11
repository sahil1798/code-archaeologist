// backend/src/lib/redis.ts
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Types
export interface ExcavationJob {
  id: string;
  repoUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  result?: ExcavationResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExcavationResult {
  repoUrl: string;
  analyzedAt: string;
  totalCommits: number;
  totalFiles: number;
  archaeologicalLayers: ArchaeologicalLayer[];
  fossilizedPatterns: FossilizedPattern[];
  knowledgeGaps: KnowledgeGap[];
  recommendations: Recommendation[];
  graphData?: GraphData;
}

export interface ArchaeologicalLayer {
  id: string;
  name: string;
  dateRange: { start: string; end: string };
  commits: number;
  keyChanges: string[];
  contributors: string[];
  sentiment: 'active' | 'stable' | 'declining';
}

export interface FossilizedPattern {
  id: string;
  type: 'dead-code' | 'legacy-pattern' | 'abandoned-feature' | 'cargo-cult';
  location: string;
  description: string;
  lastTouched: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  suggestedAction: string;
}

export interface KnowledgeGap {
  id: string;
  file: string;
  type: 'missing-docs' | 'unclear-purpose' | 'tribal-knowledge' | 'bus-factor';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedAreas: string[];
}

export interface Recommendation {
  id: string;
  priority: number;
  category: 'documentation' | 'refactoring' | 'testing' | 'cleanup';
  title: string;
  description: string;
  estimatedEffort: string;
  impact: 'low' | 'medium' | 'high';
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphNode {
  id: string;
  type: 'file' | 'commit' | 'author' | 'pattern';
  label: string;
  metadata: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'modifies' | 'depends-on' | 'authored-by' | 'related-to';
  weight: number;
}

// Job Store Implementation
export const jobStore = {
  async create(repoUrl: string): Promise<ExcavationJob> {
    const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job: ExcavationJob = {
      id,
      repoUrl,
      status: 'pending',
      progress: 0,
      currentStep: 'Initializing excavation...',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await redis.set(`job:${id}`, JSON.stringify(job), { ex: 86400 }); // 24h TTL
    await redis.lpush('jobs:recent', id);
    await redis.ltrim('jobs:recent', 0, 99); // Keep last 100 jobs
    
    return job;
  },

  async get(id: string): Promise<ExcavationJob | null> {
    const data = await redis.get(`job:${id}`);
    if (!data) return null;
    return typeof data === 'string' ? JSON.parse(data) : data as ExcavationJob;
  },

  async update(id: string, updates: Partial<ExcavationJob>): Promise<ExcavationJob | null> {
    const job = await this.get(id);
    if (!job) return null;
    
    const updated = {
      ...job,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await redis.set(`job:${id}`, JSON.stringify(updated), { ex: 86400 });
    return updated;
  },

  async getRecent(limit: number = 10): Promise<ExcavationJob[]> {
    const ids = await redis.lrange('jobs:recent', 0, limit - 1);
    const jobs: ExcavationJob[] = [];
    
    for (const id of ids) {
      const job = await this.get(id as string);
      if (job) jobs.push(job);
    }
    
    return jobs;
  },

  async setResult(id: string, result: ExcavationResult): Promise<void> {
    await this.update(id, {
      status: 'completed',
      progress: 100,
      currentStep: 'Excavation complete',
      result,
    });
    
    // Store graph data separately for quick access
    if (result.graphData) {
      await redis.set(`graph:${id}`, JSON.stringify(result.graphData), { ex: 86400 });
    }
  },

  async getGraph(id: string): Promise<GraphData | null> {
    const data = await redis.get(`graph:${id}`);
    if (!data) return null;
    return typeof data === 'string' ? JSON.parse(data) : data as GraphData;
  },
};

// Activity Feed
export const activityStore = {
  async add(event: {
    type: 'excavation-started' | 'excavation-completed' | 'pattern-found' | 'webhook-received';
    repoUrl: string;
    message: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const activity = {
      id: `activity_${Date.now()}`,
      ...event,
      timestamp: new Date().toISOString(),
    };
    
    await redis.lpush('activity:feed', JSON.stringify(activity));
    await redis.ltrim('activity:feed', 0, 99); // Keep last 100 activities
  },

  async getRecent(limit: number = 20): Promise<any[]> {
    const items = await redis.lrange('activity:feed', 0, limit - 1);
    return items.map(item => typeof item === 'string' ? JSON.parse(item) : item);
  },
};

// Clarification Store (for human-in-the-loop)
export const clarificationStore = {
  async create(data: {
    jobId: string;
    commitHash: string;
    question: string;
    context: string;
  }): Promise<string> {
    const id = `clarify_${Date.now()}`;
    const clarification = {
      id,
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    await redis.set(`clarification:${id}`, JSON.stringify(clarification), { ex: 604800 }); // 7 days
    await redis.lpush('clarifications:pending', id);
    
    return id;
  },

  async get(id: string): Promise<any | null> {
    const data = await redis.get(`clarification:${id}`);
    if (!data) return null;
    return typeof data === 'string' ? JSON.parse(data) : data;
  },

  async respond(id: string, response: string): Promise<void> {
    const clarification = await this.get(id);
    if (!clarification) throw new Error('Clarification not found');
    
    await redis.set(`clarification:${id}`, JSON.stringify({
      ...clarification,
      response,
      status: 'answered',
      answeredAt: new Date().toISOString(),
    }), { ex: 604800 });
    
    await redis.lrem('clarifications:pending', 1, id);
  },

  async getPending(): Promise<any[]> {
    const ids = await redis.lrange('clarifications:pending', 0, -1);
    const clarifications: any[] = [];
    
    for (const id of ids) {
      const c = await this.get(id as string);
      if (c) clarifications.push(c);
    }
    
    return clarifications;
  },
};

export default redis;
