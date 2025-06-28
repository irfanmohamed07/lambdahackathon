const { publishBlog } = require('../utils/sanityClient');

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

    console.log(`Publishing blog to Sanity: ${metadata.title}`);

    // Prepare blog data for Sanity
    const blogData = {
      title: metadata.title,
      slug: metadata.slug,
      content: finalContent,
      excerpt: generateExcerpt(finalContent),
      seoTitle: metadata.title,
      seoDescription: metadata.metaDescription,
      keywords: metadata.keywords || [],
      categories: metadata.categories || ['Blog'],
      tags: metadata.tags || [],
      publishDate: metadata.publishDate,
      author: metadata.author || 'AI Blog Writer',
      wordCount: metadata.wordCount,
      readingTime: metadata.estimatedReadingTime,
      seoScore: seoAnalysis?.overallScore || 0,
      status: 'published'
    };

    // Publish to Sanity
    const publishResult = await publishBlog(blogData);

    if (!publishResult.success) {
      throw new Error(`Failed to publish to Sanity: ${publishResult.error}`);
    }

    const result = {
      success: true,
      published: true,
      blogData: {
        id: publishResult.documentId,
        title: blogData.title,
        slug: blogData.slug,
        url: publishResult.url,
        publishDate: blogData.publishDate,
        wordCount: blogData.wordCount,
        seoScore: blogData.seoScore
      },
      sanityDetails: {
        documentId: publishResult.documentId,
        sanityUrl: publishResult.url,
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
    console.log(`✅ Blog published successfully!`);
    console.log(`📄 Title: ${blogData.title}`);
    console.log(`🔗 Sanity URL: ${publishResult.url}`);
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
    console.error('Error in publishToSanity:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to publish to Sanity',
        details: error.message,
        success: false,
        published: false
      })
    };
  }
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

module.exports = { handler }; 