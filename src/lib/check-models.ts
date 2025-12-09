/**
 * Check available Gemini models
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';

config();

async function listModels() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GOOGLE_AI_API_KEY not set');
    process.exit(1);
  }

  console.log('🔍 Checking available models...\n');

  // Use REST API to list models
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );

  if (!response.ok) {
    console.error('❌ Failed to fetch models:', response.statusText);
    const text = await response.text();
    console.error(text);
    process.exit(1);
  }

  const data = await response.json();
  
  console.log('📦 Available Models:\n');
  
  for (const model of data.models) {
    const supportsGenerate = model.supportedGenerationMethods?.includes('generateContent');
    console.log(`  ${supportsGenerate ? '✅' : '⚪'} ${model.name}`);
    console.log(`     Display: ${model.displayName}`);
    console.log(`     Methods: ${model.supportedGenerationMethods?.join(', ') || 'none'}`);
    console.log('');
  }

  // Filter to only generateContent-capable models
  const generativeModels = data.models.filter(
    (m: any) => m.supportedGenerationMethods?.includes('generateContent')
  );

  console.log('\n📝 Recommended models for Code Archaeologist:');
  generativeModels.forEach((m: any) => {
    const name = m.name.replace('models/', '');
    console.log(`  - ${name}`);
  });
}

listModels().catch(console.error);
