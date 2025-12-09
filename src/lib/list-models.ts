import { config } from 'dotenv';
config();

async function listModels() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No API key found');
    return;
  }

  console.log('🔍 Fetching available models...\n');
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    
    const data = await response.json();
    
    console.log('Available Gemini Models for generateContent:');
    console.log('='.repeat(60));
    
    data.models
      .filter((m: any) => 
        m.name.includes('gemini') && 
        m.supportedGenerationMethods?.includes('generateContent')
      )
      .forEach((model: any) => {
        const name = model.name.replace('models/', '');
        console.log(`\n📦 ${name}`);
        console.log(`   Display: ${model.displayName}`);
      });
      
    console.log('\n' + '='.repeat(60));
    console.log('Copy one of the model names above to use in gemini-client.ts');
      
  } catch (error) {
    console.error('Error:', error);
  }
}

listModels();
