/**
 * Training Data Generator for Oumi
 *
 * Generates synthetic training data from git commits
 */

import { geminiEngine } from "./gemini-client.js";
import { simpleGit } from "simple-git";
import * as fs from "fs";
import * as path from "path";

interface TrainingExample {
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
}

export async function generateTrainingData(
  repoPath: string,
  numExamples: number = 100
): Promise<void> {
  console.log("📚 Generating training data from repository...\n");

  const git = simpleGit(repoPath);
  const log = await git.log({ maxCount: numExamples * 2 });

  const trainingExamples: TrainingExample[] = [];

  for (let i = 0; i < Math.min(numExamples, log.all.length); i++) {
    const commit = log.all[i];

    console.log(
      `Processing ${i + 1}/${numExamples}: ${commit.hash.slice(0, 7)}`
    );

    // Get diff
    let diff = "";
    try {
      diff = await git.diff([`${commit.hash}^`, commit.hash]);
      diff = diff.slice(0, 1000); // Limit size
    } catch {
      continue;
    }

    // Generate explanation using Gemini
    const prompt = `Analyze this git commit and explain the business context:

Commit Message: ${commit.message}
Author: ${commit.author_name}
Date: ${commit.date}

Diff:
${diff}

Provide a 2-3 sentence explanation of why this change was made from a business perspective.`;

    try {
      const response = await geminiEngine.chat(prompt, "");

      trainingExamples.push({
        messages: [
          {
            role: "system",
            content:
              "You are a code archaeologist. Explain why code changes were made.",
          },
          {
            role: "user",
            content: `Commit: ${commit.message}\n\nDiff:\n${diff}`,
          },
          {
            role: "assistant",
            content: response,
          },
        ],
      });

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.log(`  ⚠️  Skipped due to error`);
    }
  }

  // Save as JSONL
  const jsonl = trainingExamples.map((ex) => JSON.stringify(ex)).join("\n");
  const outputPath = path.join(
    process.cwd(),
    "oumi-training",
    "training-data.jsonl"
  );

  fs.writeFileSync(outputPath, jsonl);

  console.log(`\n✅ Generated ${trainingExamples.length} training examples`);
  console.log(`📁 Saved to: ${outputPath}`);
}

// ============================
// CLI
// ============================

async function main() {
  const repoPath = process.argv[2] || process.cwd();
  const numExamples = parseInt(process.argv[3] || "50");

  await geminiEngine.initialize();
  await generateTrainingData(repoPath, numExamples);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

