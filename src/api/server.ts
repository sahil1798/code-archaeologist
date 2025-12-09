/**
 * Code Archaeologist API Server
 */

import express from 'express';
import cors from 'cors';
import { GeminiSynthesisEngine } from '../lib/gemini-client.ts';
import { GitAnalyzer } from '../lib/git-analyzer.ts';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize engines
const gemini = new GeminiSynthesisEngine();
let gitAnalyzer: GitAnalyzer | null = null;

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await gemini.initialize();
    res.json({
      success: true,
      status: 'healthy',
      models: gemini.getModelName(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Excavate repository
app.post('/api/excavate', async (req, res) => {
  try {
    const { repoPath = '.', options = {} } = req.body;
    
    console.log(`\n🔍 Excavating: ${repoPath}`);
    
    // Initialize Gemini
    await gemini.initialize();
    
    // Initialize Git analyzer
    gitAnalyzer = new GitAnalyzer(repoPath);
    await gitAnalyzer.initialize();
    
    // Get repository info
    const repoInfo = await gitAnalyzer.getRepositoryInfo();
    const commits = await gitAnalyzer.getCommitHistory(20);
    const files = await gitAnalyzer.getTrackedFiles();
    
    console.log(`📊 Found ${commits.length} commits, ${files.length} files`);
    
    // Prepare context for analysis
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
    
    // Run AI analysis
    console.log('🧠 Running AI analysis...');
    const analysis = await gemini.analyzeCodeContext(codeContext, commitInfo);
    
    console.log('✅ Analysis complete');
    
    res.json({
      success: true,
      data: {
        repository: repoInfo,
        commitCount: commits.length,
        fileCount: files.length,
        ...analysis,
      },
    });
  } catch (error: any) {
    console.error('❌ Excavation error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Analyze specific file
app.post('/api/analyze/file', async (req, res) => {
  try {
    const { filePath, repoPath = '.' } = req.body;
    
    await gemini.initialize();
    
    if (!gitAnalyzer) {
      gitAnalyzer = new GitAnalyzer(repoPath);
      await gitAnalyzer.initialize();
    }
    
    // Get file history
    const history = await gitAnalyzer.getFileHistory(filePath, 10);
    
    // Read file content
    const fs = await import('fs/promises');
    const path = await import('path');
    const fullPath = path.join(repoPath, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    
    // Analyze
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
      data: {
        filePath,
        historyCount: history.length,
        ...analysis,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    await gemini.initialize();
    
    const response = await gemini.chat(message, context);
    
    res.json({
      success: true,
      data: { response },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
🏛️  Code Archaeologist API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Running on http://localhost:${PORT}
📡 Endpoints:
   GET  /api/health     - Health check
   POST /api/excavate   - Analyze repository
   POST /api/analyze/file - Analyze specific file
   POST /api/chat       - Chat with AI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});
