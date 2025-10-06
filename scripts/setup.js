#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setup() {
  console.log('🚀 Welcome to CADly AI Setup!\n');
  console.log('This will help you configure the OCR + AI analysis features.\n');
  
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';
  
  // Check if .env.local already exists
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local file already exists. This will update it.\n');
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Ask for OpenAI API Key
  console.log('🔑 OpenAI API Key Setup');
  console.log('To use the AI analysis features, you need an OpenAI API key.');
  console.log('Get one at: https://platform.openai.com/api-keys\n');
  
  const openaiKey = await askQuestion('Enter your OpenAI API key (or press Enter to skip): ');
  
  if (openaiKey.trim()) {
    // Update or add OpenAI API key
    if (envContent.includes('OPENAI_API_KEY=')) {
      envContent = envContent.replace(/OPENAI_API_KEY=.*$/m, `OPENAI_API_KEY=${openaiKey.trim()}`);
    } else {
      envContent += `OPENAI_API_KEY=${openaiKey.trim()}\n`;
    }
    console.log('✅ OpenAI API key configured!\n');
  } else {
    console.log('⏭️  Skipping OpenAI API key setup. You can add it later to .env.local\n');
    if (!envContent.includes('OPENAI_API_KEY=')) {
      envContent += 'OPENAI_API_KEY=your_openai_api_key_here\n';
    }
  }
  
  // Add other default environment variables
  if (!envContent.includes('NEXT_PUBLIC_APP_URL=')) {
    envContent += 'NEXT_PUBLIC_APP_URL=http://localhost:3000\n';
  }
  
  // Write the .env.local file
  fs.writeFileSync(envPath, envContent);
  
  console.log('📁 Configuration saved to .env.local');
  console.log('\n🎉 Setup complete! Here\'s what you can do now:\n');
  
  console.log('1. 📄 Upload PDF, DWG, or DXF files for analysis');
  console.log('2. 🔤 OCR will extract text from your documents');
  console.log('3. 🤖 OpenAI GPT-4o-mini will analyze and structure the data');
  console.log('4. 📊 Get detailed reports with equipment, instrumentation, and piping data');
  console.log('5. 📥 Download results in DXF, PDF, and CSV formats\n');
  
  console.log('💡 Tips:');
  console.log('- For best results, upload clear, high-resolution engineering drawings');
  console.log('- P&ID (Piping and Instrumentation Diagrams) work exceptionally well');
  console.log('- The AI can identify equipment tags, instrument loops, and piping specifications\n');
  
  if (!openaiKey.trim()) {
    console.log('⚠️  Note: Without an OpenAI API key, the system will use fallback pattern matching.');
    console.log('   For best results, add your API key to .env.local later.\n');
  }
  
  console.log('🚀 Start the development server with: npm run dev');
  console.log('🌐 Then visit: http://localhost:3000/converter\n');
  
  rl.close();
}

setup().catch(console.error);