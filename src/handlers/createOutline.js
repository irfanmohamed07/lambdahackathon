const { initGeminiClient } = require('../utils/llmClients');

const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { gapAnalysis, selectedTopic, targetKeywords, websiteAnalysis } = body;

    if (!gapAnalysis || !selectedTopic) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Gap analysis and selected topic are required' })
      };
    }

    console.log(`Creating outline for topic: ${selectedTopic}`);

    const geminiClient = initGeminiClient();
    const domain = gapAnalysis.domain || 'website';
    const industry = gapAnalysis.industry || 'general';
    const businessType = gapAnalysis.businessType || 'business';
    
    // Find the specific gap details if available
    const topicDetails = gapAnalysis.gapAnalysis?.contentGaps?.find(
      gap => gap.topic.toLowerCase().includes(selectedTopic.toLowerCase())
    ) || { targetKeywords: targetKeywords || [] };

    const outlinePrompt = `
    You are an SEO content strategist. Create a comprehensive blog post outline for: "${selectedTopic}"
    
    Context:
    - Website: ${domain} (${businessType} in ${industry})
    - Target keywords: ${topicDetails.targetKeywords?.join(', ') || 'SEO optimized'}
    - Word count target: 1500-2500 words
    
    IMPORTANT: You MUST respond with ONLY valid JSON. Do not include any explanatory text.
    
    Create this exact JSON structure:
    {
      "title": "SEO-optimized blog title with primary keyword",
      "metaDescription": "155-character meta description",
      "slug": "url-friendly-slug",
      "targetKeywords": ["primary keyword", "secondary keyword", "long-tail keyword"],
      "estimatedWordCount": 2000,
      "outline": [
        {
          "heading": "Main Title",
          "type": "h1",
          "wordCount": 0,
          "keyPoints": []
        },
        {
          "heading": "Introduction",
          "type": "h2",
          "wordCount": 200,
          "keyPoints": ["Hook readers", "Preview main points", "Include primary keyword"],
          "seoNotes": "Include primary keyword in first 100 words"
        },
        {
          "heading": "Main Section 1",
          "type": "h2",
          "wordCount": 400,
          "keyPoints": ["Key point 1", "Key point 2", "Examples"],
          "seoNotes": "Use secondary keywords"
        }
      ],
      "seoStrategy": {
        "primaryKeyword": "main keyword",
        "secondaryKeywords": ["keyword2", "keyword3"],
        "internalLinkingOpportunities": ["related topic 1", "related topic 2"],
        "featuredSnippetOpportunity": "Yes - list format works well"
      },
      "callToAction": "Specific CTA based on business goals"
    }
    
    Return ONLY the JSON, nothing else.
    `;

    const response = await geminiClient.invoke(outlinePrompt);
    
    let outline;
    try {
      const cleanedResponse = cleanJsonResponse(response.content);
      outline = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.log('JSON parsing failed, creating basic outline');
      outline = createBasicOutline(selectedTopic, topicDetails.targetKeywords);
    }

    // Generate SEO enhancements with a simpler prompt
    const seoEnhancementPrompt = `
    Suggest 3 alternative SEO titles for: "${outline.title}"
    
    Include keywords: ${outline.targetKeywords?.join(', ')}
    
    Respond with ONLY a JSON array of title strings:
    ["Alternative Title 1", "Alternative Title 2", "Alternative Title 3"]
    `;

    const seoResponse = await geminiClient.invoke(seoEnhancementPrompt);
    let seoEnhancements;
    try {
      const cleanedSeo = cleanJsonResponse(seoResponse.content);
      const alternativeTitles = JSON.parse(cleanedSeo);
      seoEnhancements = {
        alternativeTitles: alternativeTitles,
        relatedKeywords: outline.targetKeywords || [],
        featuredSnippetTips: ["Use numbered lists", "Include clear definitions"],
        linkingStrategy: ["Link to related content", "Include external authority links"]
      };
    } catch (error) {
      seoEnhancements = {
        alternativeTitles: [`Complete Guide to ${selectedTopic}`, `Ultimate ${selectedTopic} Guide`],
        relatedKeywords: outline.targetKeywords || [],
        featuredSnippetTips: ["Use structured format"],
        linkingStrategy: ["Include relevant links"]
      };
    }

    const result = {
      selectedTopic,
      outline,
      seoEnhancements,
      contentBrief: {
        purpose: `Address content gap: ${selectedTopic}`,
        targetAudience: websiteAnalysis?.analysis?.targetAudience || 'Target customers',
        contentGoals: ['SEO traffic', 'Lead generation', 'Brand authority'],
        competitiveLandscape: 'Medium competition based on gap analysis'
      },
      writingGuidelines: {
        tone: websiteAnalysis?.analysis?.communicationStyle || 'Professional',
        style: 'Informative and actionable',
        perspective: 'Third person',
        includeExamples: true,
        includeStats: true
      },
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
    console.error('Error in createOutline:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to create outline',
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

const createBasicOutline = (topic, keywords = []) => {
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  return {
    title: `The Complete Guide to ${topic}`,
    metaDescription: `Learn everything about ${topic}. Comprehensive guide with tips, strategies, and actionable insights.`,
    slug: slug,
    targetKeywords: keywords.length > 0 ? keywords : [topic],
    estimatedWordCount: 2000,
    outline: [
      {
        heading: `The Complete Guide to ${topic}`,
        type: 'h1',
        wordCount: 0,
        keyPoints: []
      },
      {
        heading: 'Introduction',
        type: 'h2',
        wordCount: 200,
        keyPoints: ['Hook readers', 'Preview main points', 'Include primary keyword'],
        seoNotes: 'Include primary keyword in first 100 words'
      },
      {
        heading: `What is ${topic}?`,
        type: 'h2',
        wordCount: 300,
        keyPoints: ['Define the topic', 'Explain importance', 'Provide context'],
        seoNotes: 'Use secondary keywords naturally'
      },
      {
        heading: `Benefits of ${topic}`,
        type: 'h2',
        wordCount: 400,
        keyPoints: ['List key benefits', 'Include examples', 'Use bullet points'],
        seoNotes: 'Include long-tail keywords'
      },
      {
        heading: `How to Get Started`,
        type: 'h2',
        wordCount: 500,
        keyPoints: ['Step-by-step guide', 'Actionable tips', 'Common mistakes to avoid'],
        seoNotes: 'Optimize for "how to" queries'
      },
      {
        heading: 'Best Practices',
        type: 'h2',
        wordCount: 400,
        keyPoints: ['Expert recommendations', 'Industry standards', 'Pro tips'],
        seoNotes: 'Use related keywords'
      },
      {
        heading: 'Conclusion',
        type: 'h2',
        wordCount: 200,
        keyPoints: ['Summarize key points', 'Next steps', 'Call to action'],
        seoNotes: 'Reinforce primary keyword'
      }
    ],
    seoStrategy: {
      primaryKeyword: keywords[0] || topic,
      secondaryKeywords: keywords.slice(1) || [],
      internalLinkingOpportunities: [],
      featuredSnippetOpportunity: 'Yes - definition and list format'
    },
    callToAction: 'Contact us to learn more about our services'
  };
};

module.exports = { handler }; 