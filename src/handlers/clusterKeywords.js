const { initGeminiClient } = require('../utils/llmClients');

const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { keywordData, websiteAnalysis } = body;

    if (!keywordData || !keywordData.primaryKeywords) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Keyword data is required' })
      };
    }

    console.log('Clustering keywords into topics...');

    const geminiClient = initGeminiClient();
    
    // Combine all keywords
    const allKeywords = [
      ...keywordData.primaryKeywords.map(k => typeof k === 'string' ? k : k.keyword),
      ...(keywordData.variations || []),
      ...(keywordData.gapKeywords || [])
    ];

    const industry = websiteAnalysis?.analysis?.industry || 'general';

    const clusteringPrompt = `
    Group these SEO keywords into 5-7 topic clusters for a ${industry} website:
    
    Keywords: ${allKeywords.join(', ')}
    
    Create clusters with:
    - Descriptive cluster name
    - 3-6 related keywords per cluster  
    - Content type suggestion
    - Traffic potential (high/medium/low)
    
    Format as JSON:
    {
      "clusters": [
        {
          "name": "Cluster Name",
          "keywords": ["keyword1", "keyword2"],
          "contentType": "blog post|guide|comparison",
          "trafficPotential": "high|medium|low",
          "priority": 1
        }
      ]
    }
    `;

    const response = await geminiClient.invoke(clusteringPrompt);
    
    let clusters;
    try {
      clusters = JSON.parse(response.content);
    } catch (parseError) {
      // Fallback: create simple clusters
      clusters = createSimpleClusters(allKeywords);
    }

    const result = {
      url: keywordData.url,
      totalKeywords: allKeywords.length,
      clusters: clusters.clusters || clusters,
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
    console.error('Error in clusterKeywords:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to cluster keywords',
        details: error.message
      })
    };
  }
};

const createSimpleClusters = (keywords) => {
  const chunkSize = Math.ceil(keywords.length / 6);
  const clusters = [];
  
  for (let i = 0; i < keywords.length; i += chunkSize) {
    clusters.push({
      name: `Topic ${Math.floor(i / chunkSize) + 1}`,
      keywords: keywords.slice(i, i + chunkSize),
      contentType: 'blog post',
      trafficPotential: 'medium',
      priority: Math.floor(i / chunkSize) + 1
    });
  }
  
  return { clusters };
};

module.exports = { handler }; 