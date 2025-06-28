const { initGeminiClient } = require('../utils/llmClients');

const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { outline, contentBrief, writingGuidelines, introContent } = body;

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

    console.log(`Writing main content for: ${outline.title}`);

    const geminiClient = initGeminiClient();
    
    // Get main content sections (excluding intro and conclusion)
    const contentSections = outline.outline?.filter(section => 
      !section.heading.toLowerCase().includes('intro') && 
      !section.heading.toLowerCase().includes('conclusion') &&
      section.type !== 'h1'
    ) || [];

    const contentPrompt = `
    Write the main body content for this blog post:
    
    Title: "${outline.title}"
    Target Keywords: ${outline.targetKeywords?.join(', ')}
    Tone: ${writingGuidelines?.tone || 'Professional'}
    Style: ${writingGuidelines?.style || 'Informative and actionable'}
    
    Write content for these sections:
    ${contentSections.map((section, index) => 
      `${index + 1}. ${section.heading} (${section.wordCount} words)
      Key points: ${section.keyPoints?.join(', ') || 'Cover main aspects'}
      SEO notes: ${section.seoNotes || 'Use keywords naturally'}`
    ).join('\n\n')}
    
    Content Guidelines:
    - Write in ${writingGuidelines?.perspective || 'third person'}
    - Include examples: ${writingGuidelines?.includeExamples ? 'Yes' : 'No'}
    - Include statistics: ${writingGuidelines?.includeStats ? 'Yes' : 'No'}
    - Target audience: ${contentBrief?.targetAudience || 'General audience'}
    - Be actionable and valuable
    - Use natural keyword placement
    - Include subheadings (H3) where appropriate
    - Use bullet points and lists for readability
    
    Return the content with proper markdown formatting including H2 and H3 headings.
    `;

    const response = await geminiClient.invoke(contentPrompt);
    const mainContent = response.content;

    // Generate SEO-focused enhancements
    const enhancementPrompt = `
    Enhance this blog content for better SEO and readability:
    
    Title: "${outline.title}"
    Target keywords: ${outline.targetKeywords?.join(', ')}
    
    Original content preview: ${mainContent.substring(0, 500)}...
    
    Suggest:
    1. Additional H3 subheadings to break up long sections
    2. Bullet points or numbered lists for key information
    3. Call-out boxes or important notes
    4. Places to naturally include secondary keywords
    5. Internal linking opportunities
    
    Keep suggestions brief and actionable.
    `;

    const enhancementResponse = await geminiClient.invoke(enhancementPrompt);

    const result = {
      section: 'main-content',
      content: mainContent,
      wordCount: mainContent.split(' ').length,
      targetWordCount: contentSections.reduce((total, section) => total + (section.wordCount || 0), 0),
      enhancements: enhancementResponse.content,
      sectionsWritten: contentSections.length,
      metadata: {
        sectionsIncluded: contentSections.map(s => s.heading),
        keywordsTargeted: outline.targetKeywords,
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
    console.error('Error in writeBlogContent:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to write blog content',
        details: error.message
      })
    };
  }
};

module.exports = { handler }; 