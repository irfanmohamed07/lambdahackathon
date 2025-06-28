const { createClient } = require('@sanity/client');

// Initialize Sanity client
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'tbrj2u0q',
  dataset: process.env.SANITY_DATASET || 'production',
  useCdn: false, // Set to false for write operations
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01'
});

// Function to publish blog to Sanity
const publishBlog = async (blogData) => {
  try {
    console.log('Publishing to Sanity with data:', {
      title: blogData.title,
      slug: blogData.slug,
      wordCount: blogData.wordCount
    });

    // Create document in Sanity
    const doc = {
      _type: 'post',
      title: blogData.title,
      slug: {
        _type: 'slug',
        current: blogData.slug
      },
      content: blogData.content,
      excerpt: blogData.excerpt,
      seoTitle: blogData.seoTitle,
      seoDescription: blogData.seoDescription,
      keywords: blogData.keywords,
      categories: blogData.categories,
      tags: blogData.tags,
      publishDate: blogData.publishDate,
      author: blogData.author,
      wordCount: blogData.wordCount,
      readingTime: blogData.readingTime,
      seoScore: blogData.seoScore,
      status: blogData.status || 'draft'
    };

    // Create the document
    const result = await client.create(doc);
    
    console.log('✅ Document created in Sanity:', result._id);

    // Generate URLs
    const studioUrl = `https://${process.env.SANITY_PROJECT_ID || 'tbrj2u0q'}.sanity.studio/desk/post;${result._id}`;
    const previewUrl = `https://your-site.com/blog/${blogData.slug}`;

    return {
      success: true,
      documentId: result._id,
      url: studioUrl,
      previewUrl: previewUrl,
      sanityResponse: result
    };

  } catch (error) {
    console.error('Error publishing to Sanity:', error);
    
    return {
      success: false,
      error: error.message,
      details: error.details || 'Unknown Sanity error'
    };
  }
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
  publishBlog,
  checkConnection
}; 