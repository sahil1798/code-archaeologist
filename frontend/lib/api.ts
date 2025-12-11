// frontend/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

export interface Activity {
  id: string;
  type: 'excavation-started' | 'excavation-completed' | 'pattern-found' | 'webhook-received';
  repoUrl: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Clarification {
  id: string;
  jobId: string;
  commitHash: string;
  question: string;
  context: string;
  status: 'pending' | 'answered';
  response?: string;
  createdAt: string;
  answeredAt?: string;
}

class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Health check
  async health(): Promise<{ status: string; timestamp: string }> {
    return this.fetch('/health');
  }

  // Excavation endpoints
  async startExcavation(repoUrl: string): Promise<{ jobId: string; status: string; pollUrl: string }> {
    return this.fetch('/api/excavate', {
      method: 'POST',
      body: JSON.stringify({ repoUrl }),
    });
  }

  async getExcavation(jobId: string): Promise<ExcavationJob> {
    return this.fetch(`/api/excavate/${jobId}`);
  }

  async getRecentExcavations(limit: number = 10): Promise<ExcavationJob[]> {
    return this.fetch(`/api/excavations/recent?limit=${limit}`);
  }

  // Poll excavation until complete
  async pollExcavation(
    jobId: string, 
    onProgress?: (job: ExcavationJob) => void,
    interval: number = 2000
  ): Promise<ExcavationJob> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const job = await this.getExcavation(jobId);
          onProgress?.(job);

          if (job.status === 'completed') {
            resolve(job);
          } else if (job.status === 'failed') {
            reject(new Error(job.error || 'Excavation failed'));
          } else {
            setTimeout(poll, interval);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  // Activity feed
  async getRecentActivity(limit: number = 20): Promise<Activity[]> {
    return this.fetch(`/api/activity/recent?limit=${limit}`);
  }

  // Graph endpoints
  async getGraph(jobId: string): Promise<GraphData> {
    return this.fetch(`/api/graph/${jobId}`);
  }

  // Clarification endpoints
  async getClarification(clarificationId: string): Promise<Clarification> {
    return this.fetch(`/api/clarify/${clarificationId}`);
  }

  async submitClarification(clarificationId: string, response: string): Promise<{ success: boolean }> {
    return this.fetch(`/api/clarify/${clarificationId}`, {
      method: 'POST',
      body: JSON.stringify({ response }),
    });
  }

  async getPendingClarifications(): Promise<Clarification[]> {
    return this.fetch('/api/clarifications/pending');
  }
}

export const api = new APIClient();
export default api;
