const axios = require('axios');

const handler = async (event) => {
  const startTime = Date.now();
  
  try {
    const body = JSON.parse(event.body);
    const { url, selectedTopic, targetKeywords } = body;

    if (!url) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Website URL is required',
          usage: 'POST /create-blog with body: { "url": "https://example.com", "selectedTopic": "optional", "targetKeywords": ["optional"] }'
        })
      };
    }

    console.log(`🚀 Starting AI blog creation pipeline for: ${url}`);
    console.log(`⚙️ Optional parameters: Topic="${selectedTopic || 'auto-detect'}", Keywords=${targetKeywords?.length || 'auto-generate'}`);
    
    const baseUrl = process.env.IS_OFFLINE ? 'http://localhost:3000/dev' : 
                   `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
    
    const results = {};
    const pipeline = {
      totalSteps: 10,
      currentStep: 0,
      stepsCompleted: [],
      startTime: new Date().toISOString()
    };
    
    // Step 1: Analyze Website
    pipeline.currentStep = 1;
    console.log('📊 Step 1/10: Analyzing website...');
    const websiteAnalysis = await callLambdaFunction(baseUrl, '/analyze-website', { url }, 1);
    results.websiteAnalysis = websiteAnalysis;
    pipeline.stepsCompleted.push('analyze-website');
    console.log(`✅ Step 1 completed: Found ${websiteAnalysis.businessType} website`);

    // Step 2: Perplexity Search 1 - Popular Pages
    pipeline.currentStep = 2;
    console.log('🔍 Step 2/10: Researching popular pages and content...');
    const perplexityResults1 = await callLambdaFunction(baseUrl, '/perplexity-search-1', {
      url,
      websiteAnalysis
    }, 2);
    results.perplexityResults1 = perplexityResults1;
    pipeline.stepsCompleted.push('perplexity-search-1');
    console.log(`✅ Step 2 completed: Found ${perplexityResults1.popularPages?.length || 0} popular pages`);

    // Step 3: Perplexity Search 2 - Content Strategy
    pipeline.currentStep = 3;
    console.log('📈 Step 3/10: Analyzing content strategy and gaps...');
    const perplexityResults2 = await callLambdaFunction(baseUrl, '/perplexity-search-2', {
      url,
      websiteAnalysis,
      perplexityResults1
    }, 3);
    results.perplexityResults2 = perplexityResults2;
    pipeline.stepsCompleted.push('perplexity-search-2');
    console.log(`✅ Step 3 completed: Content strategy analysis finished`);

    // Step 4: Generate Keywords
    pipeline.currentStep = 4;
    console.log('🎯 Step 4/10: Generating SEO keywords...');
    const keywordData = await callLambdaFunction(baseUrl, '/generate-keywords', {
      url,
      websiteAnalysis,
      perplexityResults1,
      perplexityResults2
    }, 4);
    results.keywordData = keywordData;
    pipeline.stepsCompleted.push('generate-keywords');
    console.log(`✅ Step 4 completed: Generated ${keywordData.totalKeywords || 0} keywords`);

    // Step 5: Cluster Keywords
    pipeline.currentStep = 5;
    console.log('📚 Step 5/10: Clustering keywords by topic...');
    const clusterData = await callLambdaFunction(baseUrl, '/cluster-keywords', {
      keywordData,
      websiteAnalysis
    }, 5);
    results.clusterData = clusterData;
    pipeline.stepsCompleted.push('cluster-keywords');
    console.log(`✅ Step 5 completed: Created ${clusterData.clusters?.length || 0} keyword clusters`);

    // Step 6: Gap Analysis
    pipeline.currentStep = 6;
    console.log('🔍 Step 6/10: Performing content gap analysis...');
    const gapAnalysis = await callLambdaFunction(baseUrl, '/gap-analysis', {
      websiteAnalysis,
      perplexityResults1,
      perplexityResults2,
      keywordData,
      clusterData
    }, 6);
    results.gapAnalysis = gapAnalysis;
    pipeline.stepsCompleted.push('gap-analysis');
    console.log(`✅ Step 6 completed: Identified ${gapAnalysis.gapAnalysis?.contentGaps?.length || 0} content gaps`);

    // Determine topic to write about
    const topicToWrite = selectedTopic || 
      gapAnalysis.blogSuggestions?.[0] || 
      gapAnalysis.gapAnalysis?.contentGaps?.[0]?.topic ||
      'Industry Guide';

    console.log(`📝 Selected blog topic: "${topicToWrite}"`);

    // Step 7: Create Outline
    pipeline.currentStep = 7;
    console.log('📋 Step 7/10: Creating comprehensive blog outline...');
    const outline = await callLambdaFunction(baseUrl, '/create-outline', {
      gapAnalysis,
      selectedTopic: topicToWrite,
      targetKeywords: targetKeywords || keywordData.primaryKeywords?.slice(0, 3),
      websiteAnalysis
    }, 7);
    results.outline = outline;
    pipeline.stepsCompleted.push('create-outline');
    console.log(`✅ Step 7 completed: Created outline with ${outline.outline?.sections?.length || 0} sections`);

    // Step 8: Write Blog Content (Main Content)
    pipeline.currentStep = 8;
    console.log('✍️ Step 8/10: Writing comprehensive blog content...');
    const mainContent = await callLambdaFunction(baseUrl, '/write-blog-content', {
      outline: outline.outline,
      contentBrief: outline.contentBrief,
      writingGuidelines: outline.writingGuidelines
    }, 8);
    results.mainContent = mainContent;
    pipeline.stepsCompleted.push('write-blog-content');
    console.log(`✅ Step 8 completed: Written ${mainContent.content?.split(' ').length || 0} words of content`);

    // Step 9: Final Edit
    pipeline.currentStep = 9;
    console.log('✏️ Step 9/10: Final editing and SEO optimization...');
    const finalEdit = await callLambdaFunction(baseUrl, '/final-edit', {
      outline: outline.outline,
      mainContent,
      contentBrief: outline.contentBrief
    }, 9);
    results.finalEdit = finalEdit;
    pipeline.stepsCompleted.push('final-edit');
    console.log(`✅ Step 9 completed: Final content ready (${finalEdit.metadata?.wordCount || 0} words, SEO score: ${finalEdit.seoAnalysis?.overallScore || 'N/A'})`);

    // Step 10: Publish to Sanity
    pipeline.currentStep = 10;
    console.log('🚀 Step 10/10: Publishing to Sanity CMS...');
    const publishResult = await callLambdaFunction(baseUrl, '/publish-to-sanity', {
      finalContent: finalEdit.finalContent,
      metadata: finalEdit.metadata,
      seoAnalysis: finalEdit.seoAnalysis
    }, 10);
    results.publishResult = publishResult;
    pipeline.stepsCompleted.push('publish-to-sanity');
    console.log(`✅ Step 10 completed: Published to Sanity with document ID: ${publishResult.sanityDetails?.documentId}`);

    // Calculate final metrics
    const endTime = Date.now();
    const totalProcessingTime = endTime - startTime;
    
    // Final summary
    const summary = {
      success: true,
      pipelineComplete: true,
      input: {
        url,
        selectedTopic,
        targetKeywords
      },
      blogCreated: {
        title: finalEdit.metadata?.title,
        slug: finalEdit.metadata?.slug,
        wordCount: finalEdit.metadata?.wordCount,
        seoScore: finalEdit.seoAnalysis?.overallScore,
        sanityUrl: publishResult.sanityDetails?.sanityUrl,
        documentId: publishResult.sanityDetails?.documentId,
        previewUrl: publishResult.sanityDetails?.previewUrl
      },
      pipeline: {
        totalSteps: 10,
        stepsCompleted: pipeline.stepsCompleted.length,
        completedSteps: pipeline.stepsCompleted,
        processingTimeMs: totalProcessingTime,
        processingTimeMinutes: Math.round(totalProcessingTime / 60000 * 100) / 100,
        startTime: pipeline.startTime,
        endTime: new Date().toISOString()
      },
      analytics: {
        keywordsGenerated: keywordData.totalKeywords || 0,
        clustersCreated: clusterData.clusters?.length || 0,
        gapsIdentified: gapAnalysis.gapAnalysis?.contentGaps?.length || 0,
        sectionsWritten: outline.outline?.sections?.length || 0,
        finalWordCount: finalEdit.metadata?.wordCount || 0
      },
      timestamp: new Date().toISOString()
    };

    console.log('\n🎉 AI BLOG CREATION PIPELINE COMPLETED SUCCESSFULLY! 🎉');
    console.log('================================================');
    console.log(`📝 Blog Title: ${summary.blogCreated.title}`);
    console.log(`📏 Word Count: ${summary.blogCreated.wordCount} words`);
    console.log(`🎯 SEO Score: ${summary.blogCreated.seoScore}/100`);
    console.log(`⏱️ Total Time: ${summary.pipeline.processingTimeMinutes} minutes`);
    console.log(`🔗 Sanity URL: ${summary.blogCreated.sanityUrl}`);
    console.log(`📄 Document ID: ${summary.blogCreated.documentId}`);
    console.log('================================================\n');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        summary, 
        fullResults: results,
        message: `Blog "${summary.blogCreated.title}" successfully created and published to Sanity in ${summary.pipeline.processingTimeMinutes} minutes!`
      })
    };

  } catch (error) {
    const endTime = Date.now();
    const totalProcessingTime = endTime - startTime;
    
    console.error('\n❌ PIPELINE EXECUTION FAILED ❌');
    console.error('================================');
    console.error(`Error: ${error.message}`);
    console.error(`Failed after: ${Math.round(totalProcessingTime / 60000 * 100) / 100} minutes`);
    console.error('================================\n');
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Blog creation pipeline failed',
        details: error.message,
        processingTimeMs: totalProcessingTime,
        processingTimeMinutes: Math.round(totalProcessingTime / 60000 * 100) / 100,
        timestamp: new Date().toISOString(),
        troubleshooting: {
          commonIssues: [
            'Check if all API keys are valid (Google, Perplexity, Sanity)',
            'Ensure target website is accessible',
            'Verify serverless deployment is successful',
            'Check Lambda function timeout limits'
          ],
          support: 'Review logs for detailed error information'
        }
      })
    };
  }
};

// Enhanced helper function to call other Lambda functions with better error handling
const callLambdaFunction = async (baseUrl, path, data, stepNumber) => {
  const stepStartTime = Date.now();
  
  try {
    console.log(`⏳ Calling ${path}...`);
    
    const response = await axios.post(`${baseUrl}${path}`, data, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 300000 // 5 minutes timeout
    });
    
    const stepTime = Date.now() - stepStartTime;
    console.log(`✅ ${path} completed in ${Math.round(stepTime / 1000 * 100) / 100}s`);
    
    return response.data;
  } catch (error) {
    const stepTime = Date.now() - stepStartTime;
    console.error(`❌ Step ${stepNumber} failed (${path}) after ${Math.round(stepTime / 1000 * 100) / 100}s:`);
    console.error(`   Error: ${error.message}`);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    throw new Error(`Step ${stepNumber} (${path}) failed: ${error.message}`);
  }
};

module.exports = { handler }; 