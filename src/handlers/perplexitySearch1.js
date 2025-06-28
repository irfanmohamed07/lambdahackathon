const { perplexitySearch } = require('../utils/llmClients');

const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { url, websiteAnalysis } = body;

    if (!url || !websiteAnalysis) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'URL and website analysis are required'
        })
      };
    }

    console.log(`Performing Perplexity search 1 for: ${url}`);

    // Extract domain name for search
    const domain = new URL(url).hostname.replace('www.', '');

    // Search query to find popular pages and content
    const searchQuery = `
    What are the most popular and high-traffic pages on ${domain}? 
    List the top 10 pages with their URLs and brief descriptions of what content they contain.
    Focus on:
    - Most visited product categories
    - Top landing pages
    - Popular blog posts or content sections
    - Main navigation pages
    
    Please provide specific URLs where possible.
    `;

    const searchResults = await perplexitySearch(searchQuery);

    // Parse and structure the results
    const result = {
      url,
      domain,
      searchQuery,
      searchResults,
      searchType: 'popular_pages',
      timestamp: new Date().toISOString(),
      insights: {
        popularPages: extractUrls(searchResults),
        contentTypes: extractContentTypes(searchResults),
        categories: extractCategories(searchResults, websiteAnalysis)
      }
    };

    console.log('Perplexity search 1 completed:', result);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Error in perplexitySearch1:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Failed to perform Perplexity search',
        details: error.message
      })
    };
  }
};

// Helper function to extract URLs from search results
const extractUrls = (text) => {
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
  const urls = text.match(urlRegex) || [];
  return [...new Set(urls)].slice(0, 10); // Remove duplicates and limit to 10
};

// Helper function to extract content types mentioned
const extractContentTypes = (text) => {
  const contentTypes = [];
  const keywords = ['blog', 'product', 'category', 'guide', 'review', 'comparison', 'tutorial', 'news', 'feature'];
  
  keywords.forEach(keyword => {
    if (text.toLowerCase().includes(keyword)) {
      contentTypes.push(keyword);
    }
  });
  
  return [...new Set(contentTypes)];
};

// Helper function to extract categories based on website analysis
const extractCategories = (text, analysis) => {
  const categories = [];
  
  // Use the analysis to identify relevant categories
  if (analysis && analysis.analysis && analysis.analysis.contentCategories) {
    analysis.analysis.contentCategories.forEach(category => {
      if (text.toLowerCase().includes(category.toLowerCase())) {
        categories.push(category);
      }
    });
  }
  
  return categories;
};

module.exports = { handler }; 