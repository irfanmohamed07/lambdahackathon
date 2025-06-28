const { initGeminiClient } = require('../utils/llmClients');

const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { outline, contentBrief, writingGuidelines, mainContent } = body;

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

    console.log(`Writing conclusion for: ${outline.title}`);

    const geminiClient = initGeminiClient();
    const conclusionSection = outline.outline?.find(section => 
      section.heading.toLowerCase().includes('conclusion') || 
      section.heading.toLowerCase().includes('summary')
    );

    const conclusionPrompt = `
    Write a compelling conclusion for this blog post:
    
    Title: "${outline.title}"
    Primary Keyword: "${outline.seoStrategy?.primaryKeyword || outline.targetKeywords?.[0]}"
    Target Word Count: ${conclusionSection?.wordCount || 200} words
    
    Content Guidelines:
    - Tone: ${writingGuidelines?.tone || 'Professional'}
    - Style: ${writingGuidelines?.style || 'Informative and actionable'}
    - Reinforce the primary keyword naturally
    - Summarize key takeaways
    - Include a strong call-to-action
    - Leave readers with actionable next steps
    
    Key points to cover:
    ${conclusionSection?.keyPoints?.map(point => `- ${point}`).join('\n') || '- Summarize key points\n- Next steps\n- Call to action'}
    
    Call-to-Action: ${outline.callToAction || contentBrief?.purpose || 'Contact us to learn more'}
    
    Write a conclusion that:
    1. Summarizes the main points covered
    2. Reinforces the value provided to readers
    3. Includes the primary keyword naturally
    4. Provides clear next steps
    5. Ends with a compelling call-to-action
    
    Return only the conclusion content, no additional formatting or explanations.
    `;

    const response = await geminiClient.invoke(conclusionPrompt);
    const conclusion = response.content;

    const result = {
      section: 'conclusion',
      content: conclusion,
      wordCount: conclusion.split(' ').length,
      targetWordCount: conclusionSection?.wordCount || 200,
      metadata: {
        primaryKeyword: outline.seoStrategy?.primaryKeyword || outline.targetKeywords?.[0],
        keywordIncluded: conclusion.toLowerCase().includes(
          (outline.seoStrategy?.primaryKeyword || outline.targetKeywords?.[0] || '').toLowerCase()
        ),
        callToAction: outline.callToAction || 'Contact us to learn more',
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
    console.error('Error in writeBlogConclusion:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to write blog conclusion',
        details: error.message
      })
    };
  }
};

module.exports = { handler }; 