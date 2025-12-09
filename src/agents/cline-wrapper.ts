import { Cline } from '@cline/sdk';

export async function runClineAnalysis(filePath: string): Promise<string> {
  const cline = new Cline();
  const result = await cline.analyzeFile(filePath);
  return result;
}
