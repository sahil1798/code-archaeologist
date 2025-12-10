import { getGeminiEngine } from './src/lib/gemini-client.js';

async function test() {
  try {
    const engine = getGeminiEngine();
    await engine.initialize();
    console.log('✅ Model:', engine.getModelName());
    
    const response = await engine.chat('Say hello');
    console.log('✅ Response:', response.slice(0, 100));
  } catch (err: any) {
    console.error('❌ Error:', err.message);
  }
}

test();
