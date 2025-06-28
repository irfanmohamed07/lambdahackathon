# 🚀 AI Blog Writer - Postman Integration Guide

## Overview
This guide shows you how to use Postman to trigger the complete AI blog creation pipeline with a single API call. The system will automatically execute all 10 steps sequentially and create a complete blog post.

## 🔄 Sequential Workflow

When you make a POST request to `/create-blog`, the system automatically runs these steps:

1. **Analyze Website** - Extract business type, target audience, content focus
2. **Research Popular Pages** - Find trending content using Perplexity AI
3. **Content Strategy Analysis** - Identify content patterns and strategies
4. **Generate SEO Keywords** - Create targeted keyword lists
5. **Cluster Keywords** - Group keywords by topic relevance
6. **Gap Analysis** - Find content opportunities and gaps
7. **Create Blog Outline** - Generate comprehensive blog structure
8. **Write Blog Content** - Generate full blog content using AI
9. **Final Edit & SEO** - Optimize content and metadata
10. **Publish to Sanity** - Automatically publish to CMS

---

## 📡 API Endpoint

### Base URL
- **Local Development**: `http://localhost:3000`
- **AWS Lambda**: `https://your-api-gateway-url.amazonaws.com/dev`

### Endpoint
```
POST /create-blog
```

---

## 🔧 Postman Setup

### 1. Create New Request
1. Open Postman
2. Click "New" → "Request"
3. Name it "AI Blog Writer - Complete Pipeline"
4. Set method to `POST`

### 2. Set URL
```
http://localhost:3000/dev/create-blog
```
*(Notice the /dev/ prefix for local development)*

### 3. Set Headers
```
Content-Type: application/json
```

### 4. Request Body (JSON)

#### Minimal Request (Auto-detect everything)
```json
{
  "url": "https://flipkart.com"
}
```

#### Full Request (With specific preferences)
```json
{
  "url": "https://flipkart.com",
  "selectedTopic": "Best Budget Smartphones Under ₹15000 in 2024",
  "targetKeywords": [
    "budget smartphones",
    "phones under 15000",
    "best budget phones 2024",
    "affordable smartphones",
    "value for money phones"
  ]
}
```

⚠️ **Important:** Use `http://localhost:3000/dev/create-blog` (with `/dev/` prefix) for local development!

---

## 📝 Request Examples

### Example 1: E-commerce Website
```json
{
  "url": "https://amazon.in",
  "selectedTopic": "Best Deals and Shopping Tips for 2024",
  "targetKeywords": ["online shopping", "best deals", "amazon offers"]
}
```

### Example 2: Technology Company
```json
{
  "url": "https://microsoft.com",
  "selectedTopic": "Future of AI in Enterprise Software",
  "targetKeywords": ["artificial intelligence", "enterprise software", "business automation"]
}
```

### Example 3: Restaurant Chain
```json
{
  "url": "https://dominos.com",
  "selectedTopic": "Pizza Trends and Customer Preferences 2024",
  "targetKeywords": ["pizza delivery", "food trends", "customer satisfaction"]
}
```

---

## ✅ Expected Response

### Success Response (200 OK)
```json
{
  "summary": {
    "success": true,
    "pipelineComplete": true,
    "input": {
      "url": "https://flipkart.com",
      "selectedTopic": "Best Budget Smartphones Under ₹15000 in 2024",
      "targetKeywords": ["budget smartphones", "phones under 15000"]
    },
    "blogCreated": {
      "title": "Best Budget Smartphones Under ₹15000 in 2024: Ultimate Buying Guide",
      "slug": "best-budget-smartphones-under-15000-2024",
      "wordCount": 2150,
      "seoScore": 87,
      "sanityUrl": "https://tbrj2u0q.sanity.studio/desk/post;draft-xyz123",
      "documentId": "draft-xyz123",
      "previewUrl": "https://your-site.com/blog/best-budget-smartphones-under-15000-2024"
    },
    "pipeline": {
      "totalSteps": 10,
      "stepsCompleted": 10,
      "completedSteps": [
        "analyze-website",
        "perplexity-search-1",
        "perplexity-search-2",
        "generate-keywords",
        "cluster-keywords",
        "gap-analysis",
        "create-outline",
        "write-blog-content",
        "final-edit",
        "publish-to-sanity"
      ],
      "processingTimeMs": 180000,
      "processingTimeMinutes": 3.0,
      "startTime": "2024-01-15T10:00:00.000Z",
      "endTime": "2024-01-15T10:03:00.000Z"
    },
    "analytics": {
      "keywordsGenerated": 47,
      "clustersCreated": 5,
      "gapsIdentified": 8,
      "sectionsWritten": 6,
      "finalWordCount": 2150
    }
  },
  "message": "Blog 'Best Budget Smartphones Under ₹15000 in 2024: Ultimate Buying Guide' successfully created and published to Sanity in 3.0 minutes!"
}
```

### Error Response (500)
```json
{
  "success": false,
  "error": "Blog creation pipeline failed",
  "details": "Step 4 (generate-keywords) failed: API rate limit exceeded",
  "processingTimeMs": 120000,
  "processingTimeMinutes": 2.0,
  "troubleshooting": {
    "commonIssues": [
      "Check if all API keys are valid (Google, Perplexity, Sanity)",
      "Ensure target website is accessible",
      "Verify serverless deployment is successful",
      "Check Lambda function timeout limits"
    ],
    "support": "Review logs for detailed error information"
  }
}
```

---

## ⏱️ Expected Processing Time

| Website Type | Complexity | Estimated Time |
|--------------|------------|----------------|
| Small Business | Low | 2-4 minutes |
| E-commerce | Medium | 3-6 minutes |
| Enterprise | High | 5-8 minutes |
| Complex SaaS | Very High | 6-10 minutes |

---

## 🔍 Testing Steps

### 1. Start Local Server
```bash
npm run dev
# Server starts on http://localhost:3000
```

### 2. Test in Postman
1. Set URL to `http://localhost:3000/create-blog`
2. Set method to `POST`
3. Add request body with target website
4. Click "Send"
5. Monitor response for real-time progress

### 3. Monitor Logs
Watch the console for real-time progress:
```
🚀 Starting AI blog creation pipeline for: https://flipkart.com
📊 Step 1/10: Analyzing website...
✅ Step 1 completed: Found E-commerce Marketplace website
🔍 Step 2/10: Researching popular pages and content...
✅ Step 2 completed: Found 12 popular pages
📈 Step 3/10: Analyzing content strategy and gaps...
✅ Step 3 completed: Content strategy analysis finished
... (continues for all 10 steps)
🎉 AI BLOG CREATION PIPELINE COMPLETED SUCCESSFULLY! 🎉
```

---

## 🚀 Deployment Testing

### AWS Lambda Testing
Once deployed, replace localhost with your API Gateway URL:
```
https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev/create-blog
```

### Environment Variables Required
Ensure these are set in your deployment:
- `GOOGLE_API_KEY` - For Gemini AI
- `PERPLEXITY_API_KEY` - For competitor research
- `SANITY_PROJECT_ID` - For CMS publishing
- `SANITY_DATASET` - Usually "production"
- `SANITY_API_TOKEN` - For write access

---

## 📊 Postman Collection

Save this as a Postman Collection for easy reuse:

```json
{
  "info": {
    "name": "AI Blog Writer API",
    "description": "Complete AI blog creation pipeline"
  },
  "item": [
    {
      "name": "Create Blog - Auto Mode",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"url\": \"https://flipkart.com\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/create-blog",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["create-blog"]
        }
      }
    },
    {
      "name": "Create Blog - Custom Topic",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"url\": \"https://flipkart.com\",\n  \"selectedTopic\": \"Best Budget Smartphones Under ₹15000 in 2024\",\n  \"targetKeywords\": [\"budget smartphones\", \"phones under 15000\"]\n}"
        },
        "url": {
          "raw": "http://localhost:3000/create-blog",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["create-blog"]
        }
      }
    }
  ]
}
```

---

## 🐛 Troubleshooting

### Common Issues

1. **Timeout Errors**
   - Increase Lambda timeout in `serverless.yml`
   - Use faster website URLs for testing

2. **API Key Errors**
   - Verify all environment variables are set
   - Check API key validity and quotas

3. **Network Errors**
   - Ensure target website is accessible
   - Check if website blocks automated requests

4. **Memory Issues**
   - Increase Lambda memory allocation
   - Use simpler websites for initial testing

### Success Indicators
✅ All 10 steps complete without errors  
✅ Blog published to Sanity with document ID  
✅ Response includes complete blog metadata  
✅ Processing time under 10 minutes  

---

## 🎯 Next Steps

After successful blog creation:
1. **Review** the generated content in Sanity CMS
2. **Edit** any sections that need refinement
3. **Publish** the blog to your website
4. **Monitor** SEO performance and engagement
5. **Iterate** with different topics and keywords

---

*Need help? Check the logs in your console or serverless dashboard for detailed error information.* 