#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 CADly Deployment Script\n');

// Check if .env.local exists
const envLocalPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envLocalPath)) {
  console.log('⚠️  Warning: .env.local file not found!');
  console.log('Please copy .env.example to .env.local and configure your environment variables.\n');
}

// Pre-deployment checks
async function runChecks() {
  console.log('🔍 Running pre-deployment checks...\n');
  
  // Check if build passes
  console.log('📦 Testing build process...');
  
  return new Promise((resolve, reject) => {
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    let errorOutput = '';
    
    buildProcess.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });
    
    buildProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(data);
    });
    
    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Build successful!\n');
        resolve();
      } else {
        console.log('\n❌ Build failed!');
        console.log('Please fix build errors before deploying.\n');
        reject(new Error('Build failed'));
      }
    });
  });
}

// Deploy to Vercel
async function deployToVercel() {
  console.log('🚀 Deploying to Vercel...\n');
  
  return new Promise((resolve, reject) => {
    const deployProcess = spawn('vercel', ['--prod'], {
      stdio: 'inherit',
      shell: true
    });
    
    deployProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n🎉 Deployment successful!');
        console.log('\nYour CADly application is now live!');
        console.log('Check your Vercel dashboard for the deployment URL.\n');
        resolve();
      } else {
        console.log('\n❌ Deployment failed!');
        reject(new Error('Deployment failed'));
      }
    });
  });
}

// Main deployment function
async function deploy() {
  try {
    await runChecks();
    await deployToVercel();
    
    console.log('🎯 Deployment completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Configure your environment variables in Vercel dashboard');
    console.log('2. Set up your database (MongoDB Atlas recommended)');
    console.log('3. Configure authentication (Clerk)');
    console.log('4. Test your deployed application');
    console.log('\nFor detailed setup instructions, see DEPLOYMENT_GUIDE.md\n');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
if (require.main === module) {
  deploy();
}

module.exports = { deploy, runChecks, deployToVercel };