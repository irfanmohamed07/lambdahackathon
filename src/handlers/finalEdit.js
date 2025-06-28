const { initGeminiClient } = require('../utils/llmClients');

const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { outline, introContent, mainContent, conclusion, contentBrief } = body;

    if (!outline || !mainContent) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Outline and main content are required' })
      };
    }

    console.log(`Final editing for: ${outline.title}`);

    const geminiClient = initGeminiClient();
    
    // Combine all content sections
    const fullContent = `
# ${outline.title}

${introContent?.content || ''}

${mainContent.content || mainContent}

${conclusion?.content || ''}
    `.trim();

    const editingPrompt = `
    Perform final editing and optimization on this complete blog post:
    
    Title: "${outline.title}"
    Target Keywords: ${outline.targetKeywords?.join(', ')}
    Current Word Count: ${fullContent.split(' ').length}
    Target Word Count: ${outline.estimatedWordCount || 2000}
    
    Content:
    ${fullContent}
    
    Editing Tasks:
    1. Grammar and spelling check
    2. Improve readability and flow
    3. Optimize for SEO (keyword density, placement)
    4. Add meta description if missing
    5. Ensure proper heading structure (H1, H2, H3)
    6. Add internal linking suggestions [brackets]
    7. Improve transitions between sections
    8. Enhance call-to-action
    9. Add conclusion if missing
    10. Optimize for featured snippets
    
    SEO Requirements:
    - Primary keyword density: 1-2%
    - Include primary keyword in H1, first paragraph, and conclusion
    - Use secondary keywords naturally throughout
    - Optimize for readability (short paragraphs, bullet points)
    - Include schema markup suggestions
    
    Return the complete, edited blog post with:
    - Proper markdown formatting
    - SEO optimizations applied
    - Internal linking suggestions in [brackets]
    - Meta description at the top
    `;

    const response = await geminiClient.invoke(editingPrompt);
    const editedContent = response.content;

    // Generate SEO score and recommendations
    const seoAnalysisPrompt = `
    Analyze this blog post for SEO optimization:
    
    Title: "${outline.title}"
    Target keyword: "${outline.seoStrategy?.primaryKeyword || outline.targetKeywords?.[0]}"
    Content word count: ${editedContent.split(' ').length}
    
    Content preview: ${editedContent.substring(0, 1000)}...
    
    Provide SEO score (1-100) and analysis for:
    1. Keyword optimization
    2. Content structure
    3. Readability
    4. Meta elements
    5. Internal linking potential
    6. Featured snippet optimization
    
    Format as JSON:
    {
      "overallScore": 85,
      "keywordScore": 90,
      "structureScore": 80,
      "readabilityScore": 85,
      "recommendations": ["suggestion1", "suggestion2"]
    }
    `;

    const seoResponse = await geminiClient.invoke(seoAnalysisPrompt);
    let seoAnalysis;
    
    try {
      seoAnalysis = JSON.parse(seoResponse.content);
    } catch (error) {
      seoAnalysis = {
        overallScore: 80,
        recommendations: ['Manual SEO review recommended']
      };
    }

    // Extract meta information
    const metaInfo = extractMetaInfo(editedContent, outline);
    
    const result = {
      finalContent: editedContent,
      metadata: {
        title: metaInfo.title,
        metaDescription: metaInfo.metaDescription,
        slug: metaInfo.slug,
        keywords: outline.targetKeywords,
        wordCount: editedContent.split(' ').length,
        estimatedReadingTime: Math.ceil(editedContent.split(' ').length / 200),
        publishDate: new Date().toISOString(),
        author: 'AI Blog Writer',
        categories: extractCategories(outline, contentBrief),
        tags: extractTags(editedContent, outline.targetKeywords)
      },
      seoAnalysis,
      publishReady: seoAnalysis.overallScore >= 70,
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
    console.error('Error in finalEdit:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to perform final edit',
        details: error.message
      })
    };
  }
};

const extractMetaInfo = (content, outline) => {
  const lines = content.split('\n');
  let title = outline.title;
  let metaDescription = outline.metaDescription;
  
  // Look for title in content
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    title = h1Match[1];
  }
  
  // Look for meta description in content
  const metaMatch = content.match(/Meta Description:\s*(.+)$/m);
  if (metaMatch) {
    metaDescription = metaMatch[1];
  }
  
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  return { title, metaDescription, slug };
};

const extractCategories = (outline, contentBrief) => {
  const categories = [];
  
  if (contentBrief?.purpose?.includes('guide')) categories.push('Guides');
  if (outline.title?.toLowerCase().includes('how to')) categories.push('How-to');
  if (outline.title?.toLowerCase().includes('best')) categories.push('Reviews');
  if (outline.title?.toLowerCase().includes('tips')) categories.push('Tips');
  
  return categories.length > 0 ? categories : ['Blog'];
};

const extractTags = (content, keywords) => {
  const tags = [];
  
  if (keywords && Array.isArray(keywords)) {
    keywords.forEach(keyword => {
      // Ensure keyword is a string before processing
      if (keyword && typeof keyword === 'string' && content.toLowerCase().includes(keyword.toLowerCase())) {
        tags.push(keyword);
      }
    });
  }
  
  // Add common tags based on content
  const commonTags = ['SEO', 'Marketing', 'Business', 'Tips', 'Guide'];
  commonTags.forEach(tag => {
    if (content.toLowerCase().includes(tag.toLowerCase()) && !tags.includes(tag)) {
      tags.push(tag);
    }
  });
  
  return tags.slice(0, 8);
};

module.exports = { handler }; 