const { initGeminiClient } = require('../utils/llmClients');

const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { url, websiteAnalysis, perplexityResults1, perplexityResults2 } = body;

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

    console.log(`Generating keywords for: ${url}`);

    const geminiClient = initGeminiClient();
    const domain = new URL(url).hostname.replace('www.', '');
    const businessType = websiteAnalysis.analysis?.businessType || 'business';
    const industry = websiteAnalysis.analysis?.industry || 'general';
    const targetAudience = websiteAnalysis.analysis?.targetAudience || 'general consumers';

    // Combine insights from Perplexity searches
    const competitorInsights = perplexityResults1?.insights || {};
    const contentGaps = perplexityResults2?.insights?.contentGaps || [];

    const keywordPrompt = `
    You are a professional SEO expert. Generate 30 SEO keywords for a ${businessType} in the ${industry} industry targeting ${targetAudience}.
    
    Website: ${domain}
    Business Context: ${websiteAnalysis.analysis?.summary || 'No summary available'}
    
    Content Gaps Identified: ${contentGaps.slice(0, 5).join(', ')}
    
    Generate keywords in these categories:
    1. Primary Keywords (5-7): Main business/product terms
    2. Long-tail Keywords (8-10): Specific, less competitive phrases
    3. Question Keywords (5-7): What, how, why, when questions
    4. Comparison Keywords (3-5): vs, best, alternative terms
    5. Local/Geographic Keywords (3-5): Include location if relevant
    6. Trend-based Keywords (2-4): Current trending terms in the industry
    
    IMPORTANT: You MUST respond with ONLY valid JSON. Do not include any explanatory text before or after the JSON.
    
    Format as JSON array with objects containing:
    [
      {
        "keyword": "keyword phrase",
        "category": "primary",
        "searchVolume": "high",
        "competition": "medium",
        "difficulty": "easy",
        "reason": "why this keyword is valuable"
      }
    ]
    
    Return ONLY the JSON array, nothing else.
    `;

    const response = await geminiClient.invoke(keywordPrompt);
    
    let keywords;
    try {
      // Clean the response to extract JSON
      const cleanedResponse = cleanJsonResponse(response.content);
      keywords = JSON.parse(cleanedResponse);
      
      // Ensure it's an array
      if (!Array.isArray(keywords)) {
        keywords = [keywords];
      }
    } catch (parseError) {
      console.log('JSON parsing failed, extracting keywords from text');
      keywords = extractKeywordsFromText(response.content);
    }

    // Generate additional keyword variations with simpler prompt
    const variationPrompt = `
    Generate 10 additional SEO keyword variations for ${businessType} business.
    Base keywords: ${keywords.slice(0, 5).map(k => k.keyword || k).join(', ')}
    
    Include modifiers like: best, top, cheap, affordable, premium, how to, guide, review
    
    Respond with ONLY a simple JSON array of strings:
    ["keyword 1", "keyword 2", "keyword 3"]
    `;

    const variationResponse = await geminiClient.invoke(variationPrompt);
    let variations;
    try {
      const cleanedVariations = cleanJsonResponse(variationResponse.content);
      variations = JSON.parse(cleanedVariations);
    } catch (error) {
      variations = extractSimpleKeywords(variationResponse.content);
    }

    // Generate gap keywords with simpler prompt
    const gapAnalysisPrompt = `
    Generate 5 specific keywords targeting these content gaps for ${domain}:
    ${contentGaps.slice(0, 3).join(', ')}
    
    Focus on commercial intent keywords that competitors might be missing.
    
    Respond with ONLY a JSON array of strings:
    ["gap keyword 1", "gap keyword 2", "gap keyword 3"]
    `;

    const gapKeywordsResponse = await geminiClient.invoke(gapAnalysisPrompt);
    let gapKeywords;
    try {
      const cleanedGap = cleanJsonResponse(gapKeywordsResponse.content);
      gapKeywords = JSON.parse(cleanedGap);
    } catch (error) {
      gapKeywords = extractSimpleKeywords(gapKeywordsResponse.content);
    }

    const result = {
      url,
      domain,
      totalKeywords: keywords.length + variations.length + gapKeywords.length,
      primaryKeywords: keywords,
      variations: variations,
      gapKeywords: gapKeywords,
      keywordCategories: categorizeKeywords(keywords),
      timestamp: new Date().toISOString(),
      metadata: {
        businessType,
        industry,
        targetAudience,
        generationMethod: 'gemini-ai'
      }
    };

    console.log(`Generated ${result.totalKeywords} keywords for ${domain}`);

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
    console.error('Error in generateKeywords:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Failed to generate keywords',
        details: error.message
      })
    };
  }
};

// Helper function to clean JSON response from AI
const cleanJsonResponse = (text) => {
  // Remove markdown code blocks
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Remove any text before the first [ or {
  const jsonStart = Math.min(
    cleaned.indexOf('[') !== -1 ? cleaned.indexOf('[') : Infinity,
    cleaned.indexOf('{') !== -1 ? cleaned.indexOf('{') : Infinity
  );
  
  if (jsonStart !== Infinity) {
    cleaned = cleaned.substring(jsonStart);
  }
  
  // Remove any text after the last ] or }
  const lastBracket = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
  if (lastBracket !== -1) {
    cleaned = cleaned.substring(0, lastBracket + 1);
  }
  
  return cleaned.trim();
};

// Helper function to extract keywords from text when JSON parsing fails
const extractKeywordsFromText = (text) => {
  const keywords = [];
  const lines = text.split('\n');
  
  lines.forEach(line => {
    // Look for quoted phrases or phrases after numbers/bullets
    const matches = line.match(/"([^"]+)"|'([^']+)'|\d+\.\s*([^(]+)|[-•*]\s*([^(]+)/);
    if (matches) {
      const keyword = (matches[1] || matches[2] || matches[3] || matches[4] || '').trim();
      if (keyword.length > 2 && keyword.length < 60) {
        keywords.push({
          keyword: keyword,
          category: 'extracted',
          searchVolume: 'medium',
          competition: 'medium',
          difficulty: 'medium',
          reason: 'Extracted from AI response'
        });
      }
    }
  });

  return keywords.slice(0, 30);
};

// Helper function to extract simple keywords from text
const extractSimpleKeywords = (text) => {
  const keywords = [];
  const lines = text.split('\n');
  
  lines.forEach(line => {
    // Clean the line and extract potential keywords
    const cleaned = line.replace(/^\d+\.|[-•*]/g, '').replace(/["\[\]]/g, '').trim();
    if (cleaned.length > 3 && cleaned.length < 60 && !cleaned.includes('Here') && !cleaned.includes('Based on')) {
      keywords.push(cleaned);
    }
  });

  return keywords.slice(0, 15);
};

// Helper function to categorize keywords
const categorizeKeywords = (keywords) => {
  const categories = {
    primary: [],
    longTail: [],
    question: [],
    comparison: [],
    local: [],
    trend: []
  };

  keywords.forEach(kw => {
    const keyword = typeof kw === 'string' ? kw : kw.keyword;
    const category = typeof kw === 'object' ? kw.category : 'general';
    
    if (categories[category]) {
      categories[category].push(keyword);
    } else {
      // Auto-categorize based on keyword characteristics
      if (keyword.includes('what') || keyword.includes('how') || keyword.includes('why')) {
        categories.question.push(keyword);
      } else if (keyword.includes('vs') || keyword.includes('best') || keyword.includes('top')) {
        categories.comparison.push(keyword);
      } else if (keyword.split(' ').length > 3) {
        categories.longTail.push(keyword);
      } else {
        categories.primary.push(keyword);
      }
    }
  });

  return categories;
};

module.exports = { handler }; 