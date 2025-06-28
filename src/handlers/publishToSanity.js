const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { finalContent, metadata, seoAnalysis } = body;

    if (!finalContent || !metadata) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Final content and metadata are required' })
      };
    }

    console.log(`Publishing blog to Sanity via MCP: ${metadata.title}`);

    // Convert markdown content to enhanced block content structure
    const enhancedBlockContent = convertMarkdownToBlocks(finalContent);

    // Prepare the creation instruction for the MCP
    const instruction = `Create a blog post with the following details:
    
Title: ${metadata.title}
Subtitle: ${metadata.metaDescription || generateExcerpt(finalContent)}
Slug: ${metadata.slug}
Content: ${finalContent}
Reading Time: ${metadata.estimatedReadingTime || calculateReadingTime(metadata.wordCount)}
SEO Keywords: ${(metadata.keywords || []).join(', ')}
Publish Date: ${metadata.publishDate || new Date().toISOString()}
Author: ${metadata.author || 'AI Blog Writer'}

Please format the content properly as enhanced block content for rich text display.`;

    // Use Sanity MCP to create the document
    const createResult = await createBlogPost(instruction, enhancedBlockContent, metadata);

    if (!createResult.success) {
      throw new Error(`Failed to publish to Sanity via MCP: ${createResult.error}`);
    }

    const result = {
      success: true,
      published: true,
      blogData: {
        id: createResult.documentId,
        title: metadata.title,
        slug: metadata.slug,
        url: createResult.url,
        publishDate: metadata.publishDate || new Date().toISOString(),
        wordCount: metadata.wordCount,
        seoScore: seoAnalysis?.overallScore || 0
      },
      sanityDetails: {
        documentId: createResult.documentId,
        sanityUrl: createResult.url,
        status: 'published'
      },
      metrics: {
        totalWordCount: metadata.wordCount,
        estimatedReadingTime: metadata.estimatedReadingTime,
        keywordsTargeted: metadata.keywords?.length || 0,
        seoScore: seoAnalysis?.overallScore || 0,
        categoriesAssigned: metadata.categories?.length || 0,
        tagsAssigned: metadata.tags?.length || 0
      },
      timestamp: new Date().toISOString()
    };

    // Log success
    console.log(`✅ Blog published successfully via MCP!`);
    console.log(`📄 Title: ${metadata.title}`);
    console.log(`🔗 Document ID: ${createResult.documentId}`);
    console.log(`📊 SEO Score: ${seoAnalysis?.overallScore || 'N/A'}`);
    console.log(`📝 Word Count: ${metadata.wordCount}`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Error in publishToSanity (MCP):', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to publish to Sanity via MCP',
        details: error.message,
        success: false,
        published: false
      })
    };
  }
};

// Function to create blog post using Sanity MCP
const createBlogPost = async (instruction, enhancedBlockContent, metadata) => {
  try {
    // Import Sanity MCP functions (these would be available in the Lambda environment)
    const { 
      mcp_sanity_create_document,
      mcp_sanity_get_initial_context 
    } = require('../utils/sanityMCP');

    // Initialize MCP connection
    await mcp_sanity_get_initial_context({ random_string: 'init' });

    // Create the document using MCP
    const createResponse = await mcp_sanity_create_document({
      resource: {
        projectId: process.env.SANITY_PROJECT_ID || "0u2n1rlt",
        dataset: process.env.SANITY_DATASET || "production",
        target: "dataset"
      },
      type: "post",
      instruction: [instruction],
      workspaceName: "default"
    });

    if (createResponse && createResponse.success) {
      return {
        success: true,
        documentId: createResponse.documentId || createResponse.id,
        url: createResponse.url || `https://0u2n1rlt.sanity.studio/desk/post;${createResponse.documentId}`,
        mcpResponse: createResponse
      };
    } else {
      throw new Error(createResponse?.error || 'Unknown MCP error');
    }

  } catch (error) {
    console.error('Error in createBlogPost MCP:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Helper function to convert markdown to enhanced block content structure
const convertMarkdownToBlocks = (markdownContent) => {
  // This is a simplified conversion - in production you might want to use a proper markdown parser
  const blocks = [];
  const paragraphs = markdownContent.split('\n\n');
  
  paragraphs.forEach((paragraph, index) => {
    if (paragraph.trim()) {
      // Handle headers
      if (paragraph.startsWith('#')) {
        const level = paragraph.match(/^#+/)[0].length;
        const text = paragraph.replace(/^#+\s*/, '');
        blocks.push({
          _type: 'block',
          _key: `header_${index}`,
          style: level === 1 ? 'h1' : level === 2 ? 'h2' : level === 3 ? 'h3' : 'h4',
          children: [{ _type: 'span', text: text }]
        });
      } else {
        // Regular paragraph
        blocks.push({
          _type: 'block',
          _key: `paragraph_${index}`,
          style: 'normal',
          children: [{ _type: 'span', text: paragraph }]
        });
      }
    }
  });

  return blocks;
};

// Helper function to generate excerpt from content
const generateExcerpt = (content) => {
  // Remove markdown formatting
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italics
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`(.*?)`/g, '$1') // Remove inline code
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();

  // Get first 150 characters and end at word boundary
  if (plainText.length <= 150) {
    return plainText;
  }

  const excerpt = plainText.substring(0, 150);
  const lastSpace = excerpt.lastIndexOf(' ');
  
  if (lastSpace > 100) {
    return excerpt.substring(0, lastSpace) + '...';
  }
  
  return excerpt + '...';
};

// Helper function to calculate reading time
const calculateReadingTime = (wordCount) => {
  if (!wordCount) return '5 min read';
  const minutes = Math.ceil(wordCount / 200); // Average reading speed: 200 words per minute
  return `${minutes} min read`;
};

module.exports = { handler }; 