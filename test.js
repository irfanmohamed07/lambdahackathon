require('dotenv').config();

// Simple test to verify the system components
const testSystem = async () => {
  console.log('🧪 Testing AI Blog Writer System...\n');

  // Test 1: Environment Variables
  console.log('1️⃣ Testing Environment Variables:');
  const requiredEnvVars = [
    'GOOGLE_API_KEY',
    'PERPLEXITY_API_KEY', 
    'SANITY_PROJECT_ID',
    'SANITY_DATASET',
    'SANITY_API_TOKEN'
  ];

  let envPassed = true;
  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar}: Set`);
    } else {
      console.log(`   ❌ ${envVar}: Missing`);
      envPassed = false;
    }
  });

  if (!envPassed) {
    console.log('\n⚠️  Please set up your environment variables in .env file');
    console.log('Copy env.example to .env and fill in your API keys\n');
  }

  // Test 2: Dependencies
  console.log('\n2️⃣ Testing Dependencies:');
  const dependencies = [
    '@langchain/google-genai',
    'axios',
    'cheerio',
    '@sanity/client',
    'dotenv'
  ];

  let depsInstalled = true;
  dependencies.forEach(dep => {
    try {
      require(dep);
      console.log(`   ✅ ${dep}: Installed`);
    } catch (error) {
      console.log(`   ❌ ${dep}: Missing`);
      depsInstalled = false;
    }
  });

  // Test 3: File Structure
  console.log('\n3️⃣ Testing File Structure:');
  const fs = require('fs');
  const path = require('path');
  
  const requiredFiles = [
    'src/handlers/analyzeWebsite.js',
    'src/handlers/orchestrator.js',
    'src/utils/llmClients.js',
    'src/utils/sanityClient.js',
    'serverless.yml',
    'package.json'
  ];

  let filesExist = true;
  requiredFiles.forEach(file => {
    if (fs.existsSync(path.join(__dirname, file))) {
      console.log(`   ✅ ${file}: Exists`);
    } else {
      console.log(`   ❌ ${file}: Missing`);
      filesExist = false;
    }
  });

  // Test 4: Handler Functions
  console.log('\n4️⃣ Testing Handler Functions:');
  const handlers = [
    'analyzeWebsite',
    'generateKeywords', 
    'clusterKeywords',
    'gapAnalysis',
    'createOutline',
    'writeBlogContent',
    'finalEdit',
    'publishToSanity',
    'orchestrator'
  ];

  let handlersValid = true;
  handlers.forEach(handlerName => {
    try {
      const handler = require(`./src/handlers/${handlerName}.js`);
      if (handler.handler && typeof handler.handler === 'function') {
        console.log(`   ✅ ${handlerName}: Valid`);
      } else {
        console.log(`   ❌ ${handlerName}: Invalid export`);
        handlersValid = false;
      }
    } catch (error) {
      console.log(`   ❌ ${handlerName}: Error - ${error.message}`);
      handlersValid = false;
    }
  });

  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`   Environment: ${envPassed ? '✅ Ready' : '❌ Needs Setup'}`);
  console.log(`   Dependencies: ${depsInstalled ? '✅ Installed' : '❌ Missing'}`);
  console.log(`   File Structure: ${filesExist ? '✅ Complete' : '❌ Incomplete'}`);
  console.log(`   Handlers: ${handlersValid ? '✅ Valid' : '❌ Issues Found'}`);

  if (envPassed && depsInstalled && filesExist && handlersValid) {
    console.log('\n🎉 System is ready for deployment!');
    console.log('\nNext steps:');
    console.log('1. Set up your .env file with API keys');
    console.log('2. Run "npm run dev" to test locally');
    console.log('3. Run "npm run deploy" to deploy to AWS');
  } else {
    console.log('\n⚠️  Please fix the issues above before proceeding');
  }
};

// Run the test
testSystem().catch(console.error); 