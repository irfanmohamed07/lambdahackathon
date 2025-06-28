// Sanity MCP utility functions for Lambda environment
// This module provides MCP-style functions that mirror the MCP server capabilities

// Mock MCP functions for Lambda environment
// In a real implementation, these would connect to the actual MCP server
// or use the Sanity client with the new project configuration

const { createClient } = require('@sanity/client');

// Initialize Sanity client with new project configuration
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || '0u2n1rlt',
  dataset: process.env.SANITY_DATASET || 'production',
  useCdn: false, // Set to false for write operations
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01'
});

// Mock MCP function: Get initial context
const mcp_sanity_get_initial_context = async (params) => {
  try {
    console.log('Initializing Sanity MCP context...');
    
    // Test connection
    const testQuery = await client.fetch('*[_type == "post"][0]');
    
    return {
      success: true,
      context: {
        projectId: process.env.SANITY_PROJECT_ID || '0u2n1rlt',
        dataset: process.env.SANITY_DATASET || 'production',
        workspace: 'default'
      }
    };
  } catch (error) {
    console.error('MCP initialization error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Mock MCP function: Create document
const mcp_sanity_create_document = async (params) => {
  try {
    const { resource, type, instruction, workspaceName } = params;
    
    console.log('Creating document via MCP-style function:', {
      type,
      projectId: resource.projectId,
      dataset: resource.dataset,
      workspace: workspaceName
    });

    // Parse the instruction to extract blog data
    const blogData = parseInstructionToBlogData(instruction[0]);
    
    // Create document structure matching the Sanity schema
    const doc = {
      _type: type,
      title: blogData.title,
      subtitle: blogData.subtitle,
      slug: {
        _type: 'slug',
        current: blogData.slug
      },
      // Convert markdown content to enhanced block content
      body: convertMarkdownToEnhancedBlocks(blogData.content),
      readTime: blogData.readingTime,
      seoKeywords: blogData.seoKeywords || [],
      publishedAt: blogData.publishDate ? new Date(blogData.publishDate).toISOString() : new Date().toISOString(),
      // Note: author and categories would need to be references to existing documents
      // For now, we'll skip these or create default values
    };

    // Create the document
    const result = await client.create(doc);
    
    console.log('✅ Document created via MCP-style function:', result._id);

    // Generate URLs
    const studioUrl = `https://${resource.projectId}.sanity.studio/desk/${type};${result._id}`;

    return {
      success: true,
      documentId: result._id,
      id: result._id,
      url: studioUrl,
      sanityResponse: result
    };

  } catch (error) {
    console.error('Error in mcp_sanity_create_document:', error);
    return {
      success: false,
      error: error.message,
      details: error.details || 'Unknown error in document creation'
    };
  }
};

// Helper function to parse instruction text into structured blog data
const parseInstructionToBlogData = (instruction) => {
  const data = {};
  
  // Extract title
  const titleMatch = instruction.match(/Title:\s*(.+)/);
  if (titleMatch) data.title = titleMatch[1].trim();
  
  // Extract subtitle
  const subtitleMatch = instruction.match(/Subtitle:\s*(.+)/);
  if (subtitleMatch) data.subtitle = subtitleMatch[1].trim();
  
  // Extract slug
  const slugMatch = instruction.match(/Slug:\s*(.+)/);
  if (slugMatch) data.slug = slugMatch[1].trim();
  
  // Extract content (everything after "Content:" until the next field)
  const contentMatch = instruction.match(/Content:\s*([\s\S]*?)(?=Reading Time:|SEO Keywords:|Publish Date:|Author:|$)/);
  if (contentMatch) data.content = contentMatch[1].trim();
  
  // Extract reading time
  const readingTimeMatch = instruction.match(/Reading Time:\s*(.+)/);
  if (readingTimeMatch) data.readingTime = readingTimeMatch[1].trim();
  
  // Extract SEO keywords
  const keywordsMatch = instruction.match(/SEO Keywords:\s*(.+)/);
  if (keywordsMatch) {
    data.seoKeywords = keywordsMatch[1].split(',').map(k => k.trim()).filter(k => k);
  }
  
  // Extract publish date
  const publishDateMatch = instruction.match(/Publish Date:\s*(.+)/);
  if (publishDateMatch) data.publishDate = publishDateMatch[1].trim();
  
  // Extract author
  const authorMatch = instruction.match(/Author:\s*(.+)/);
  if (authorMatch) data.author = authorMatch[1].trim();
  
  return data;
};

// Helper function to convert markdown to enhanced block content
const convertMarkdownToEnhancedBlocks = (markdownContent) => {
  if (!markdownContent) return [];
  
  const blocks = [];
  const lines = markdownContent.split('\n');
  let currentParagraph = '';
  let blockIndex = 0;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Handle headers
    if (trimmedLine.startsWith('#')) {
      // Save previous paragraph if exists
      if (currentParagraph.trim()) {
        blocks.push(createTextBlock(currentParagraph.trim(), 'normal', blockIndex++));
        currentParagraph = '';
      }
      
      const level = trimmedLine.match(/^#+/)[0].length;
      const text = trimmedLine.replace(/^#+\s*/, '');
      const style = level === 1 ? 'h1' : level === 2 ? 'h2' : level === 3 ? 'h3' : 'h4';
      
      blocks.push(createTextBlock(text, style, blockIndex++));
    }
    // Handle empty lines (paragraph breaks)
    else if (trimmedLine === '') {
      if (currentParagraph.trim()) {
        blocks.push(createTextBlock(currentParagraph.trim(), 'normal', blockIndex++));
        currentParagraph = '';
      }
    }
    // Regular text lines
    else {
      currentParagraph += (currentParagraph ? ' ' : '') + trimmedLine;
    }
  }
  
  // Add final paragraph if exists
  if (currentParagraph.trim()) {
    blocks.push(createTextBlock(currentParagraph.trim(), 'normal', blockIndex++));
  }
  
  return blocks;
};

// Helper function to create a text block
const createTextBlock = (text, style, index) => {
  return {
    _type: 'block',
    _key: `block_${index}`,
    style: style,
    children: [
      {
        _type: 'span',
        _key: `span_${index}`,
        text: text,
        marks: []
      }
    ],
    markDefs: []
  };
};

// Function to check Sanity connection
const checkConnection = async () => {
  try {
    const result = await client.fetch('*[_type == "post"][0]');
    return { success: true, connected: true };
  } catch (error) {
    console.error('Sanity connection failed:', error);
    return { 
      success: false, 
      connected: false, 
      error: error.message 
    };
  }
};

module.exports = {
  client,
  mcp_sanity_get_initial_context,
  mcp_sanity_create_document,
  checkConnection
}; 