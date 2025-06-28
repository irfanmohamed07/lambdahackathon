const { GoogleGenerativeAI } = require('@langchain/google-genai');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const axios = require('axios');

// Initialize Gemini client
const initGeminiClient = () => {
  // Try Gemini 2.0 Flash first, fallback to other models if needed
  const modelOptions = [
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
  ];
  
  return new ChatGoogleGenerativeAI({
    modelName: modelOptions[0], // Use Gemini 2.0 Flash
    maxOutputTokens: 8192,
    temperature: 0.7,
    apiKey: process.env.GOOGLE_API_KEY,
  });
};

// Perplexity API client
const perplexitySearch = async (query, focus = 'web') => {
  try {
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful research assistant. Provide accurate and up-to-date information.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.2,
        max_tokens: 1000,
        return_citations: true,
        search_domain_filter: ['google.com'],
        search_recency_filter: 'month'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Perplexity API error:', error.response?.data || error.message);
    throw new Error(`Perplexity search failed: ${error.message}`);
  }
};

// Website content scraper
const scrapeWebsite = async (url) => {
  const cheerio = require('cheerio');
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    // Remove script and style elements
    $('script, style').remove();
    
    const title = $('title').text();
    const description = $('meta[name="description"]').attr('content') || '';
    const headings = $('h1, h2, h3').map((i, el) => $(el).text()).get();
    const content = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 2000);
    
    return {
      title,
      description,
      headings,
      content,
      url
    };
  } catch (error) {
    console.error('Website scraping error:', error.message);
    throw new Error(`Failed to scrape website: ${error.message}`);
  }
};

module.exports = {
  initGeminiClient,
  perplexitySearch,
  scrapeWebsite
}; 