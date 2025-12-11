import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { repoPath } = req.body;

  if (!repoPath) {
    return res.status(400).json({ success: false, error: 'repoPath required' });
  }

  // For now, return mock success (we'll add real logic after this works)
  return res.json({
    success: true,
    data: {
      jobId: `job_${Date.now()}`,
      status: 'completed',
      report: {
        repository: repoPath,
        stats: {
          totalFiles: 10,
          analyzedFiles: 10
        },
        files: []
      }
    }
  });
}
