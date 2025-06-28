const { initGeminiClient, scrapeWebsite } = require('../utils/llmClients');

const handler = async (event) => {
  try {
    // Parse the request body
    const body = JSON.parse(event.body);
    const { url } = body;

    if (!url) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'URL is required'
        })
      };
    }

    console.log(`Analyzing website: ${url}`);

    // Step 1: Scrape the website
    const websiteData = await scrapeWebsite(url);

    // Step 2: Use Gemini to analyze the website
    const geminiClient = initGeminiClient();
    
    const analysisPrompt = `
    Analyze this website and provide insights about its business, content, and target audience.
    
    Website URL: ${url}
    Title: ${websiteData.title}
    Description: ${websiteData.description}
    Main Headings: ${websiteData.headings.join(', ')}
    Content Sample: ${websiteData.content}
    
    Please provide:
    1. What type of business this is
    2. Main products/services they offer
    3. Target audience
    4. Content categories they focus on
    5. Industry vertical
    6. Tone and style of communication
    
    Format your response as a JSON object with these keys:
    - businessType
    - mainProducts
    - targetAudience
    - contentCategories
    - industry
    - communicationStyle
    - summary
    `;

    const response = await geminiClient.invoke(analysisPrompt);
    
    let analysis;
    try {
      // Try to parse JSON response
      analysis = JSON.parse(response.content);
    } catch (parseError) {
      // If JSON parsing fails, create structured data from text response
      analysis = {
        businessType: "Unknown",
        mainProducts: [],
        targetAudience: "General consumers",
        contentCategories: [],
        industry: "General",
        communicationStyle: "Professional",
        summary: response.content
      };
    }

    const result = {
      url,
      websiteData,
      analysis,
      timestamp: new Date().toISOString()
    };

    console.log('Website analysis completed:', result);

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
    console.error('Error in analyzeWebsite:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Failed to analyze website',
        details: error.message
      })
    };
  }
};

module.exports = { handler }; 