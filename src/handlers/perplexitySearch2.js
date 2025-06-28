const { perplexitySearch } = require('../utils/llmClients');

const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { url, websiteAnalysis, perplexityResults1 } = body;

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

    console.log(`Performing Perplexity search 2 for: ${url}`);

    const domain = new URL(url).hostname.replace('www.', '');
    const businessType = websiteAnalysis.analysis?.businessType || 'unknown';
    const industry = websiteAnalysis.analysis?.industry || 'general';

    // Search query to understand content strategy and identify gaps
    const searchQuery = `
    What type of content is ${domain} currently publishing? 
    Analyze their content strategy in the ${industry} industry.
    
    Focus on:
    - What blog topics do they cover?
    - What product information do they provide?
    - What educational content do they create?
    - What topics are they NOT covering that their competitors are?
    - What content gaps exist in their ${businessType} niche?
    - What trending topics in ${industry} are they missing?
    
    Please identify specific content gaps and opportunities.
    `;

    const searchResults = await perplexitySearch(searchQuery);

    // Analyze content gaps and opportunities
    const contentGapsQuery = `
    Based on ${domain} being a ${businessType} in the ${industry} industry,
    what are the top 10 content topics that they should be writing about but currently aren't?
    
    Consider:
    - Trending topics in ${industry}
    - Customer pain points they could address
    - Educational content opportunities
    - Comparison guides they're missing
    - How-to content in their niche
    - Seasonal or timely content opportunities
    
    List specific, actionable blog post ideas.
    `;

    const gapAnalysisResults = await perplexitySearch(contentGapsQuery);

    const result = {
      url,
      domain,
      searchQuery,
      searchResults,
      gapAnalysisQuery: contentGapsQuery,
      gapAnalysisResults,
      searchType: 'content_strategy',
      timestamp: new Date().toISOString(),
      insights: {
        currentContentTypes: extractCurrentContent(searchResults),
        contentGaps: extractContentGaps(gapAnalysisResults),
        opportunities: extractOpportunities(gapAnalysisResults),
        trendingTopics: extractTrendingTopics(searchResults, gapAnalysisResults)
      }
    };

    console.log('Perplexity search 2 completed:', result);

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
    console.error('Error in perplexitySearch2:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Failed to perform Perplexity search 2',
        details: error.message
      })
    };
  }
};

// Helper function to extract current content types
const extractCurrentContent = (text) => {
  const contentTypes = [];
  const patterns = [
    /publish(?:es|ing)?\s+([^.]+)/gi,
    /content\s+about\s+([^.]+)/gi,
    /cover(?:s|ing)?\s+([^.]+)/gi,
    /focus(?:es)?\s+on\s+([^.]+)/gi
  ];

  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const content = match.replace(pattern, '$1').trim();
        if (content.length > 3 && content.length < 50) {
          contentTypes.push(content);
        }
      });
    }
  });

  return [...new Set(contentTypes)].slice(0, 10);
};

// Helper function to extract content gaps
const extractContentGaps = (text) => {
  const gaps = [];
  const lines = text.split('\n');
  
  lines.forEach(line => {
    // Look for numbered lists or bullet points
    if (line.match(/^\d+\./) || line.match(/^[-*•]/)) {
      const gap = line.replace(/^\d+\.|\s*[-*•]\s*/, '').trim();
      if (gap.length > 10 && gap.length < 100) {
        gaps.push(gap);
      }
    }
  });

  return gaps.slice(0, 10);
};

// Helper function to extract opportunities
const extractOpportunities = (text) => {
  const opportunities = [];
  const keywords = ['opportunity', 'should write', 'could create', 'missing', 'trending', 'popular'];
  
  const sentences = text.split(/[.!?]+/);
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    if (keywords.some(keyword => lowerSentence.includes(keyword))) {
      const opportunity = sentence.trim();
      if (opportunity.length > 20 && opportunity.length < 150) {
        opportunities.push(opportunity);
      }
    }
  });

  return [...new Set(opportunities)].slice(0, 8);
};

// Helper function to extract trending topics
const extractTrendingTopics = (searchResults, gapResults) => {
  const topics = [];
  const combinedText = searchResults + ' ' + gapResults;
  const trendKeywords = ['trending', 'popular', 'hot topic', 'emerging', 'growing', 'demand'];
  
  const sentences = combinedText.split(/[.!?]+/);
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    if (trendKeywords.some(keyword => lowerSentence.includes(keyword))) {
      const topic = sentence.trim();
      if (topic.length > 15 && topic.length < 100) {
        topics.push(topic);
      }
    }
  });

  return [...new Set(topics)].slice(0, 5);
};

module.exports = { handler }; 