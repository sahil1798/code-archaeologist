// scripts/generate-training-data.ts
import * as fs from 'fs';
import * as path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface TrainingExample {
  prompt: string;
  completion: string;
}

// Templates for generating diverse training examples
const scenarios = [
  {
    type: 'commit-analysis',
    template: (commit: string, context: string) => ({
      prompt: `Analyze this git commit for archaeological insights:\n\nCommit: ${commit}`,
      completion: context,
    }),
  },
  {
    type: 'pattern-detection',
    template: (code: string, pattern: string) => ({
      prompt: `Identify fossilized patterns in this code:\n\n${code}`,
      completion: pattern,
    }),
  },
  {
    type: 'knowledge-gap',
    template: (file: string, gap: string) => ({
      prompt: `What knowledge gaps exist in this file?\n\nFile: ${file}`,
      completion: gap,
    }),
  },
  {
    type: 'context-extraction',
    template: (history: string, context: string) => ({
      prompt: `Extract the historical context from these commits:\n\n${history}`,
      completion: context,
    }),
  },
];

const commitExamples = [
  {
    message: 'fix: handle edge case in user auth',
    context: 'This commit addresses a security vulnerability where null user IDs could bypass authentication. The fix adds explicit null checks before processing login requests. This is a critical security patch and should be preserved.',
  },
  {
    message: 'chore: update dependencies',
    context: 'Routine dependency update. No significant changes to business logic. Part of regular maintenance cycle.',
  },
  {
    message: 'refactor: extract payment processing',
    context: 'Major architectural change extracting payment logic into separate service. This was done to support multiple payment providers (Stripe, PayPal). The original monolithic implementation is deprecated.',
  },
  {
    message: 'feat: add dark mode support',
    context: 'User-requested feature for dark mode. Uses CSS variables for theming. The previous color scheme is preserved as "light mode" default.',
  },
  {
    message: 'WIP: experimental caching layer',
    context: 'Work in progress - experimental Redis caching implementation. May be abandoned if performance gains are insufficient. Do not depend on this feature.',
  },
];

const patternExamples = [
  {
    code: 'if (typeof window !== "undefined" && window.localStorage)',
    pattern: 'Browser environment check pattern. Used for SSR compatibility. Standard practice in Next.js applications.',
  },
  {
    code: '// TODO: remove this after Q4 2023\nfunction legacyAuth() { ... }',
    pattern: 'FOSSILIZED: Legacy authentication function marked for removal. Date suggests this is overdue for cleanup. Risk: High - may contain security issues.',
  },
  {
    code: 'try { JSON.parse(data) } catch(e) { return {} }',
    pattern: 'Silent error handling anti-pattern. Errors are swallowed without logging. Should be refactored to proper error handling with logging.',
  },
];

async function generateSyntheticExamples(count: number): Promise<TrainingExample[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const examples: TrainingExample[] = [];

  console.log(`Generating ${count} synthetic training examples...`);

  for (let i = 0; i < count; i++) {
    const prompt = `Generate a realistic git commit message and its archaeological context analysis.
    
    Format:
    COMMIT: <commit message>
    CONTEXT: <detailed analysis of what this commit does, why it was made, any historical context, risk assessment, and recommendations>
    
    Make it diverse - include different types: bug fixes, features, refactoring, documentation, dependencies, etc.
    Make the context detailed and insightful, as if an experienced developer is explaining the code's history.`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      const commitMatch = text.match(/COMMIT:\s*(.+)/);
      const contextMatch = text.match(/CONTEXT:\s*([\s\S]+?)(?=$|\n\n)/);
      
      if (commitMatch && contextMatch) {
        examples.push({
          prompt: `Analyze this git commit for archaeological insights:\n\nCommit: ${commitMatch[1].trim()}`,
          completion: contextMatch[1].trim(),
        });
      }
    } catch (error) {
      console.error(`Error generating example ${i}:`, error);
    }

    // Rate limiting
    if (i % 10 === 0) {
      console.log(`Generated ${i}/${count} examples...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return examples;
}

async function main() {
  const outputDir = path.join(__dirname, '../training/data');
  fs.mkdirSync(outputDir, { recursive: true });

  // Generate from templates
  const templateExamples: TrainingExample[] = [];

  // Add commit examples
  for (const example of commitExamples) {
    templateExamples.push(
      scenarios[0].template(example.message, example.context)
    );
  }

  // Add pattern examples
  for (const example of patternExamples) {
    templateExamples.push(
      scenarios[1].template(example.code, example.pattern)
    );
  }

  // Generate synthetic examples
  const syntheticCount = 500;
  const syntheticExamples = await generateSyntheticExamples(syntheticCount);

  // Combine all examples
  const allExamples = [...templateExamples, ...syntheticExamples];

  // Shuffle
  for (let i = allExamples.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allExamples[i], allExamples[j]] = [allExamples[j], allExamples[i]];
  }

  // Split into train/val
  const splitIndex = Math.floor(allExamples.length * 0.9);
  const trainExamples = allExamples.slice(0, splitIndex);
  const valExamples = allExamples.slice(splitIndex);

  // Save as JSONL
  const trainPath = path.join(outputDir, 'train.jsonl');
  const valPath = path.join(outputDir, 'val.jsonl');

  fs.writeFileSync(
    trainPath,
    trainExamples.map(e => JSON.stringify(e)).join('\n')
  );
  fs.writeFileSync(
    valPath,
    valExamples.map(e => JSON.stringify(e)).join('\n')
  );

  console.log(`\n✅ Training data generated:`);
  console.log(`   Train: ${trainExamples.length} examples -> ${trainPath}`);
  console.log(`   Val: ${valExamples.length} examples -> ${valPath}`);
}

main().catch(console.error);
