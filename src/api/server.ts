import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { GeminiSynthesisEngine } from '../lib/gemini-client.ts';
import { GitAnalyzer } from '../lib/git-analyzer.ts';

// ─── Types ───────────────────────────────────────────────────────────
interface ExcavateRequest {
  repoPath?: string;
  options?: Record<string, unknown>;
}

interface AnalyzeFileRequest {
  filePath: string;
  repoPath?: string;
}

interface ChatRequest {
  message: string;
  context?: string;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Configuration ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const ALLOWED_REPO_PATHS = process.env.ALLOWED_PATHS?.split(',') || ['.'];
const MAX_COMMITS = 50;
const MAX_FILES = 100;

// ─── Application Setup ───────────────────────────────────────────────
const app = express();
const gemini = new GeminiSynthesisEngine();
const analyzerCache = new Map<string, GitAnalyzer>();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));

// ─── Utilities ───────────────────────────────────────────────────────
function validateRepoPath(repoPath: string): string {
  const resolved = path.resolve(repoPath);
  
  const isAllowed = ALLOWED_REPO_PATHS.some(allowed => 
    resolved.startsWith(path.resolve(allowed))
  );
  
  if (!isAllowed) {
    throw new ApiError(403, 'Repository path not allowed');
  }
  
  return resolved;
}

function sanitizeFilePath(basePath: string, filePath: string): string {
  if (!filePath || typeof filePath !== 'string') {
    throw new ApiError(400, 'Invalid file path');
  }
  
  const resolved = path.resolve(basePath, filePath);
  
  if (!resolved.startsWith(basePath + path.sep)) {
    throw new ApiError(403, 'Path traversal not allowed');
  }
  
  return resolved;
}

async function getAnalyzer(repoPath: string): Promise<GitAnalyzer> {
  const validated = validateRepoPath(repoPath);
  
  if (!analyzerCache.has(validated)) {
    const analyzer = new GitAnalyzer(validated);
    await analyzer.initialize();
    analyzerCache.set(validated, analyzer);
  }
  
  return analyzerCache.get(validated)!;
}

// ─── Custom Error Class ──────────────────────────────────────────────
class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Middleware ──────────────────────────────────────────────────────
function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}

function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`❌ ${req.method} ${req.path}:`, err.message);
  
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
}

// ─── Routes ──────────────────────────────────────────────────────────
app.get('/api/health', asyncHandler(async (_req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    model: gemini.getModelName(),
    timestamp: new Date().toISOString(),
  });
}));

app.post('/api/excavate', asyncHandler(async (req, res) => {
  const { repoPath = '.', options = {} } = req.body as ExcavateRequest;
  
  console.log(`\n🔍 Excavating: ${repoPath}`);
  
  const analyzer = await getAnalyzer(repoPath);
  
  const [repoInfo, commits, files] = await Promise.all([
    analyzer.getRepositoryInfo(),
    analyzer.getCommitHistory(Math.min(options.maxCommits ?? 20, MAX_COMMITS)),
    analyzer.getTrackedFiles(),
  ]);
  
  console.log(`📊 Found ${commits.length} commits, ${files.length} files`);
  
  const codeContext = {
    filePath: repoPath,
    code: `Repository: ${repoInfo.name}\nFiles: ${files.slice(0, 10).join(', ')}`,
    language: 'mixed',
  };
  
  const commitInfo = commits.map(c => ({
    hash: c.hash,
    message: c.message,
    author: c.author,
    date: c.date,
  }));
  
  console.log('🧠 Running AI analysis...');
  const analysis = await gemini.analyzeCodeContext(codeContext, commitInfo);
  console.log('✅ Analysis complete');
  
  res.json({
    success: true,
    data: {
      repository: repoInfo,
      commitCount: commits.length,
      fileCount: Math.min(files.length, MAX_FILES),
      ...analysis,
    },
  });
}));

app.post('/api/analyze/file', asyncHandler(async (req, res) => {
  const { filePath, repoPath = '.' } = req.body as AnalyzeFileRequest;
  
  if (!filePath) {
    throw new ApiError(400, 'filePath is required');
  }
  
  const analyzer = await getAnalyzer(repoPath);
  const validatedRepo = validateRepoPath(repoPath);
  const fullPath = sanitizeFilePath(validatedRepo, filePath);
  
  const [history, content] = await Promise.all([
    analyzer.getFileHistory(filePath, 10),
    fs.readFile(fullPath, 'utf-8'),
  ]);
  
  const analysis = await gemini.analyzeCodeContext(
    {
      filePath,
      code: content,
      language: path.extname(filePath).slice(1) || 'text',
    },
    history.map(c => ({
      hash: c.hash,
      message: c.message,
      author: c.author,
      date: c.date,
    }))
  );
  
  res.json({
    success: true,
    data: { filePath, historyCount: history.length, ...analysis },
  });
}));

app.post('/api/chat', asyncHandler(async (req, res) => {
  const { message, context } = req.body as ChatRequest;
  
  if (!message || typeof message !== 'string') {
    throw new ApiError(400, 'message is required');
  }
  
  const response = await gemini.chat(message.slice(0, 10000), context);
  
  res.json({
    success: true,
    data: { response },
  });
}));

// ─── Error Handler (must be last) ────────────────────────────────────
app.use(errorHandler);

// ─── Server Lifecycle ────────────────────────────────────────────────
async function start(): Promise<void> {
  await gemini.initialize();  // Initialize ONCE at startup
  
  const server = app.listen(PORT, () => {
    console.log(`
🏛️  Code Archaeologist API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Running on http://localhost:${PORT}
📡 Endpoints:
   GET  /api/health        - Health check
   POST /api/excavate      - Analyze repository
   POST /api/analyze/file  - Analyze specific file
   POST /api/chat          - Chat with AI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  });
  
  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n📴 ${signal} received, shutting down...`);
    server.close(() => {
      analyzerCache.clear();
      process.exit(0);
    });
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
