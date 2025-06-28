require('dotenv').config();
const { mcp_sanity_get_initial_context, mcp_sanity_create_document, checkConnection } = require('./src/utils/sanityMCP');

async function testMCPIntegration() {
  console.log('🚀 Testing Sanity MCP Integration');
  console.log('================================\n');

  try {
    // Test 1: Check connection
    console.log('1️⃣ Testing Sanity connection...');
    const connectionTest = await checkConnection();
    
    if (connectionTest.success) {
      console.log('✅ Connection successful!');
    } else {
      console.log('❌ Connection failed:', connectionTest.error);
      return;
    }

    // Test 2: Initialize MCP context
    console.log('\n2️⃣ Testing MCP initialization...');
    const initResult = await mcp_sanity_get_initial_context({ random_string: 'test' });
    
    if (initResult.success) {
      console.log('✅ MCP initialization successful!');
      console.log(`   Project ID: ${initResult.context.projectId}`);
      console.log(`   Dataset: ${initResult.context.dataset}`);
      console.log(`   Workspace: ${initResult.context.workspace}`);
    } else {
      console.log('❌ MCP initialization failed:', initResult.error);
    }

    // Test 3: Create a test blog post
    console.log('\n3️⃣ Testing blog post creation...');
    
    const testInstruction = `Create a blog post with the following details:
    
Title: Test Blog Post via MCP
Subtitle: This is a test blog post created using the new MCP integration
Slug: test-blog-post-mcp
Content: # Welcome to our test blog post

This is a test blog post created using the new Sanity MCP integration. 

## Features

- MCP-powered content creation
- Enhanced block content support
- Proper schema mapping

The integration allows us to publish blog content directly to Sanity using the Model Context Protocol approach.

## Conclusion

This test demonstrates that the MCP integration is working correctly.
Reading Time: 2 min read
SEO Keywords: test, mcp, sanity, integration
Publish Date: ${new Date().toISOString()}
Author: MCP Test Suite

Please format the content properly as enhanced block content for rich text display.`;

    const createParams = {
      resource: {
        projectId: process.env.SANITY_PROJECT_ID || "0u2n1rlt",
        dataset: process.env.SANITY_DATASET || "production",
        target: "dataset"
      },
      type: "post",
      instruction: [testInstruction],
      workspaceName: "default"
    };

    const createResult = await mcp_sanity_create_document(createParams);
    
    if (createResult.success) {
      console.log('✅ Test blog post created successfully!');
      console.log(`   Document ID: ${createResult.documentId}`);
      console.log(`   Studio URL: ${createResult.url}`);
    } else {
      console.log('❌ Blog post creation failed:', createResult.error);
    }

    console.log('\n🎉 MCP Integration Test Complete!');
    console.log('==================================');
    console.log('✨ Your blog publishing system is now using Sanity MCP');
    console.log('🔗 New Project ID: 0u2n1rlt');
    console.log('📊 Dataset: production');
    console.log('\n💡 Run "node view-all-blogs.js" to see all your published blogs');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your .env file has the correct SANITY_API_TOKEN');
    console.log('2. Verify the token has write permissions');
    console.log('3. Ensure the project ID (0u2n1rlt) is correct');
  }
}

// Run the test
testMCPIntegration(); 