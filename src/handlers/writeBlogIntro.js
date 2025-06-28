const { initGeminiClient } = require('../utils/llmClients');

const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { outline, contentBrief, writingGuidelines } = body;

    if (!outline) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Blog outline is required' })
      };
    }

    console.log(`Writing introduction for: ${outline.title}`);

    const geminiClient = initGeminiClient();
    const introSection = outline.outline?.find(section => 
      section.heading.toLowerCase().includes('intro') || section.type === 'h1'
    );

    const introPrompt = `
    Write an engaging blog introduction for the following post:
    
    Title: "${outline.title}"
    Meta Description: "${outline.metaDescription}"
    Primary Keyword: "${outline.seoStrategy?.primaryKeyword || outline.targetKeywords?.[0]}"
    Target Word Count: ${introSection?.wordCount || 200} words
    
    Content Guidelines:
    - Tone: ${writingGuidelines?.tone || 'Professional'}
    - Style: ${writingGuidelines?.style || 'Informative and actionable'}
    - Include primary keyword in first 100 words
    - Hook readers with an interesting opening
    - Preview what they'll learn
    - Make them want to continue reading
    
    Key points to cover:
    ${introSection?.keyPoints?.map(point => `- ${point}`).join('\n') || '- Hook readers\n- Preview main points\n- Include primary keyword'}
    
    Target Audience: ${contentBrief?.targetAudience || 'General audience'}
    Purpose: ${contentBrief?.purpose || 'Provide valuable information'}
    
    Write a compelling introduction that:
    1. Opens with a hook (statistic, question, or bold statement)
    2. Identifies the reader's pain point or need
    3. Promises value and solutions
    4. Previews the main sections
    5. Naturally includes the primary keyword
    
    Return only the introduction content, no additional formatting or explanations.
    `;

    const response = await geminiClient.invoke(introPrompt);
    const introduction = response.content;

    const result = {
      section: 'introduction',
      content: introduction,
      wordCount: introduction.split(' ').length,
      targetWordCount: introSection?.wordCount || 200,
      metadata: {
        primaryKeyword: outline.seoStrategy?.primaryKeyword || outline.targetKeywords?.[0],
        keywordIncluded: introduction.toLowerCase().includes(
          (outline.seoStrategy?.primaryKeyword || outline.targetKeywords?.[0] || '').toLowerCase()
        ),
        tone: writingGuidelines?.tone || 'Professional',
        timestamp: new Date().toISOString()
      }
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
    console.error('Error in writeBlogIntro:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to write blog introduction',
        details: error.message
      })
    };
  }
};

module.exports = { handler }; 