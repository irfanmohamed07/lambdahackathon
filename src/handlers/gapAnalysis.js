const { initGeminiClient } = require('../utils/llmClients');

const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { 
      websiteAnalysis, 
      perplexityResults1, 
      perplexityResults2, 
      keywordData, 
      clusterData 
    } = body;

    if (!websiteAnalysis || !keywordData) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Website analysis and keyword data are required' })
      };
    }

    console.log('Performing gap analysis...');

    const geminiClient = initGeminiClient();
    const domain = keywordData.domain || new URL(websiteAnalysis.url).hostname;
    const industry = websiteAnalysis.analysis?.industry || 'general';
    const businessType = websiteAnalysis.analysis?.businessType || 'business';

    // Compile insights from previous steps
    const competitorPages = perplexityResults1?.insights?.popularPages || [];
    const contentGaps = perplexityResults2?.insights?.contentGaps || [];
    const clusters = clusterData?.clusters || [];

    const gapAnalysisPrompt = `
    You are a content strategy expert. Analyze content gaps for ${domain} (${businessType} in ${industry}).
    
    Current insights:
    - Popular competitor pages: ${competitorPages.slice(0, 3).join(', ')}
    - Identified content gaps: ${contentGaps.slice(0, 5).join(', ')}
    - Keyword clusters: ${clusters.map(c => c.name).slice(0, 3).join(', ')}
    
    Identify the top 8 content gaps that represent the best opportunities.
    
    IMPORTANT: You MUST respond with ONLY valid JSON. Do not include any explanatory text.
    
    Format as this exact JSON structure:
    {
      "contentGaps": [
        {
          "topic": "Specific content topic",
          "description": "Why this is a gap and opportunity",
          "trafficPotential": "high",
          "competition": "low",
          "difficulty": "easy",
          "businessRelevance": "high",
          "suggestedContent": "Specific blog post idea",
          "targetKeywords": ["keyword1", "keyword2"],
          "priority": 1
        }
      ],
      "opportunities": {
        "quickWins": ["Topic 1", "Topic 2"],
        "longTermProjects": ["Topic 3", "Topic 4"],
        "seasonalContent": ["Topic 5", "Topic 6"]
      }
    }
    
    Return ONLY the JSON, nothing else.
    `;

    const response = await geminiClient.invoke(gapAnalysisPrompt);
    
    let gapAnalysis;
    try {
      const cleanedResponse = cleanJsonResponse(response.content);
      gapAnalysis = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.log('JSON parsing failed, creating basic gap analysis');
      gapAnalysis = createBasicGapAnalysis(contentGaps, clusters);
    }

    // Generate blog suggestions with a simpler prompt
    const blogSuggestionsPrompt = `
    Based on the content gaps for ${domain}, suggest 5 specific blog post titles that would capture traffic.
    
    Focus on ${businessType} business goals and ${industry} industry trends.
    
    Respond with ONLY a JSON array of blog titles:
    ["Blog Title 1", "Blog Title 2", "Blog Title 3", "Blog Title 4", "Blog Title 5"]
    `;

    const blogSuggestionsResponse = await geminiClient.invoke(blogSuggestionsPrompt);
    let blogSuggestions;
    try {
      const cleanedBlog = cleanJsonResponse(blogSuggestionsResponse.content);
      blogSuggestions = JSON.parse(cleanedBlog);
    } catch (error) {
      blogSuggestions = extractBlogSuggestions(blogSuggestionsResponse.content);
    }

    const result = {
      domain,
      industry,
      businessType,
      gapAnalysis,
      blogSuggestions,
      recommendations: generateRecommendations(gapAnalysis),
      priorityMatrix: createPriorityMatrix(gapAnalysis.contentGaps || []),
      timestamp: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Error in gapAnalysis:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to perform gap analysis',
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

const createBasicGapAnalysis = (contentGaps, clusters) => {
  const gaps = contentGaps.slice(0, 8).map((gap, index) => ({
    topic: gap.replace(/\*\*/g, '').trim(),
    description: `Content opportunity identified through competitor analysis`,
    trafficPotential: index < 3 ? 'high' : 'medium',
    competition: index < 4 ? 'low' : 'medium',
    difficulty: index < 5 ? 'easy' : 'medium',
    businessRelevance: 'high',
    suggestedContent: `Complete guide to ${gap.replace(/\*\*/g, '').trim()}`,
    targetKeywords: [],
    priority: index + 1
  }));

  return {
    contentGaps: gaps,
    opportunities: {
      quickWins: gaps.slice(0, 3).map(g => g.topic),
      longTermProjects: gaps.slice(3, 6).map(g => g.topic),
      seasonalContent: gaps.slice(6, 8).map(g => g.topic)
    }
  };
};

const extractBlogSuggestions = (text) => {
  const suggestions = [];
  const lines = text.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.length > 10 && 
        (trimmed.match(/^\d+\./) || trimmed.includes('"') || trimmed.includes('title'))) {
      const suggestion = trimmed.replace(/^\d+\.|\s*[-*•]\s*|title:|"/g, '').trim();
      if (suggestion.length > 5 && suggestion.length < 100) {
        suggestions.push(suggestion);
      }
    }
  });
  
  return suggestions.slice(0, 8);
};

const generateRecommendations = (gapAnalysis) => {
  const recommendations = [];
  const gaps = gapAnalysis.contentGaps || [];
  
  const highPriorityGaps = gaps.filter(gap => gap.priority <= 3);
  if (highPriorityGaps.length > 0) {
    recommendations.push(`Start with high-priority content gaps: ${highPriorityGaps.map(g => g.topic).join(', ')}`);
  }
  
  const quickWins = gaps.filter(gap => gap.difficulty === 'easy' && gap.trafficPotential === 'high');
  if (quickWins.length > 0) {
    recommendations.push(`Focus on quick wins for immediate traffic gains`);
  }
  
  const lowCompetition = gaps.filter(gap => gap.competition === 'low');
  if (lowCompetition.length > 0) {
    recommendations.push(`Target low-competition topics for easier ranking`);
  }
  
  return recommendations;
};

const createPriorityMatrix = (gaps) => {
  return {
    highPriorityHighImpact: gaps.filter(g => g.priority <= 3 && g.trafficPotential === 'high'),
    quickWins: gaps.filter(g => g.difficulty === 'easy' && g.competition === 'low'),
    longTermValue: gaps.filter(g => g.businessRelevance === 'high' && g.trafficPotential === 'high'),
    lowHangingFruit: gaps.filter(g => g.difficulty === 'easy' && g.priority <= 5)
  };
};

module.exports = { handler }; 