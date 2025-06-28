# 🤖 AI-Powered Blog Writer using LangChain + AWS Lambda

An intelligent, serverless blog creation system that **automatically creates complete blogs with one API call**. Simply provide a website URL via Postman, and the system will analyze competitors, identify content gaps, and generate SEO-optimized blog posts using AI agents.

## 🎯 Sequential Workflow Overview

**🚀 ONE API CALL = COMPLETE BLOG CREATION**

Enter a URL → Get a complete, published blog post in 3-8 minutes!

### 10-Step Automated Pipeline:
1. **Analyze Website** - Extract business type, target audience, content focus
2. **Research Popular Pages** - Find trending content using Perplexity AI  
3. **Content Strategy Analysis** - Identify content patterns and strategies
4. **Generate SEO Keywords** - Create targeted keyword lists (30+ keywords)
5. **Cluster Keywords** - Group keywords by topic relevance
6. **Gap Analysis** - Find content opportunities and gaps
7. **Create Blog Outline** - Generate comprehensive blog structure
8. **Write Blog Content** - Generate full blog content using AI (2000+ words)
9. **Final Edit & SEO** - Optimize content and metadata  
10. **Publish to Sanity** - Automatically publish to CMS with proper formatting

## 🏗️ Architecture

The system uses a microservices approach with AWS Lambda functions:

```
Frontend → API Gateway → Lambda Functions → AI APIs → Sanity CMS
```

### Components:
- **LangChain**: AI agent orchestration and prompt management
- **AWS Lambda**: Serverless compute for each pipeline step  
- **Google Gemini**: Content generation and analysis
- **Perplexity AI**: Real-time web research and competitor analysis
- **Sanity CMS**: Content management and publishing
- **Serverless Framework**: Infrastructure as code

## 📋 Prerequisites

1. **Node.js** (v18+)
2. **AWS Account** with appropriate permissions
3. **API Keys**:
   - Google Gemini API key
   - Perplexity API key
   - Sanity project credentials

## 🚀 Quick Start - Create a Blog in 4 Steps

### 1. Install & Setup

```bash
git clone <your-repo>
cd ai-blog-writer-lambda
npm install
```

### 2. Configure API Keys

Edit `serverless.yml` with your API keys:
```yaml
environment:
  GOOGLE_API_KEY: 'your_google_gemini_api_key'
  PERPLEXITY_API_KEY: 'your_perplexity_api_key'
  SANITY_PROJECT_ID: 'your_sanity_project_id'
  SANITY_DATASET: 'production'
  SANITY_API_TOKEN: 'your_sanity_api_token'
```

### 3. Start Server

```bash
npm run dev
# Server starts on http://localhost:3000
```

### 4. Create Complete Blog via Postman

**🎯 One Request = Complete Blog**

```
POST http://localhost:3000/create-blog
Content-Type: application/json

{
  "url": "https://flipkart.com"
}
```

**⏱️ Processing Time:** 3-8 minutes  
**📝 Output:** Complete blog post published to Sanity CMS

### Alternative Testing Methods

**PowerShell Test:**
```powershell
.\test-postman.ps1
```

**cURL:**
```bash
curl -X POST http://localhost:3000/create-blog \
  -H "Content-Type: application/json" \
  -d '{"url": "https://flipkart.com"}'
```

**Custom Topic & Keywords:**
```json
{
  "url": "https://flipkart.com",
  "selectedTopic": "Best Budget Smartphones Under ₹15000 in 2024",
  "targetKeywords": ["budget smartphones", "phones under 15000"]
}
```

## 📁 Project Structure

```
ai-blog-writer-lambda/
├── src/
│   ├── handlers/           # Lambda function handlers
│   │   ├── analyzeWebsite.js       # Step 1: Website analysis
│   │   ├── perplexitySearch1.js    # Step 2: Popular pages research
│   │   ├── perplexitySearch2.js    # Step 3: Content strategy analysis
│   │   ├── generateKeywords.js     # Step 4: SEO keyword generation
│   │   ├── clusterKeywords.js      # Step 5: Keyword clustering
│   │   ├── gapAnalysis.js          # Step 6: Content gap analysis
│   │   ├── createOutline.js        # Step 7: Blog outline creation
│   │   ├── writeBlogContent.js     # Step 8: Content writing
│   │   ├── finalEdit.js            # Step 9: Final editing & SEO
│   │   ├── publishToSanity.js      # Step 10: CMS publishing
│   │   └── orchestrator.js         # Main pipeline coordinator
│   └── utils/              # Utility modules
│       ├── llmClients.js           # AI client initialization
│       └── sanityClient.js         # Sanity CMS integration
├── frontend.html           # Simple test interface
├── serverless.yml          # AWS Lambda configuration
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## 🔄 Pipeline Steps

### Step 1: Website Analysis
- Scrapes target website content
- Uses Gemini to analyze business type, products, target audience
- Identifies communication style and industry vertical

### Step 2-3: Competitor Research  
- Uses Perplexity AI to find popular pages and content types
- Identifies content strategy and trending topics
- Analyzes what competitors are and aren't covering

### Step 4-5: Keyword Research
- Generates 30+ SEO keywords using AI
- Creates keyword variations and gap-specific terms
- Clusters keywords into logical content topics

### Step 6: Gap Analysis
- Combines all research to identify content opportunities
- Prioritizes gaps by traffic potential and competition
- Suggests specific blog post ideas

### Step 7: Content Planning
- Creates detailed blog outline with H2/H3 structure
- Plans word count distribution and key points
- Optimizes for SEO and featured snippets

### Step 8-9: Content Creation
- Writes comprehensive blog content using Gemini
- Performs final editing for grammar, flow, and SEO
- Optimizes keyword density and readability

### Step 10: Publishing
- Formats content for Sanity CMS
- Adds metadata, tags, and SEO elements
- Publishes with proper schema markup

## 🛠️ API Endpoints

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/create-blog` | POST | Full pipeline execution |
| `/analyze-website` | POST | Website analysis only |
| `/generate-keywords` | POST | Keyword generation only |
| `/gap-analysis` | POST | Content gap analysis |
| `/create-outline` | POST | Blog outline creation |
| `/publish-to-sanity` | POST | Publish to CMS |

### Example Request

```json
{
  "url": "https://example.com",
  "selectedTopic": "Best eco-friendly phones 2024",
  "targetKeywords": ["eco phone", "sustainable smartphone", "green technology"]
}
```

### Example Response

```json
{
  "summary": {
    "success": true,
    "blogCreated": {
      "title": "The Complete Guide to Eco-Friendly Phones in 2024",
      "wordCount": 2156,
      "seoScore": 87,
      "sanityUrl": "https://your-project.sanity.studio/desk/post;doc-id"
    },
    "pipeline": {
      "totalSteps": 10,
      "keywordsGenerated": 34,
      "clustersCreated": 6,
      "gapsIdentified": 8,
      "processingTime": 145000
    }
  }
}
```

## 🔧 Configuration

### Serverless Configuration
Edit `serverless.yml` to customize:
- AWS region and runtime
- Function timeouts and memory
- Environment variables
- API Gateway settings

### AI Model Settings
Modify `src/utils/llmClients.js` to adjust:
- Gemini model parameters (temperature, max tokens)
- Perplexity search filters
- Content generation prompts

### Sanity Schema
Set up your Sanity project with this blog post schema:

```javascript
export default {
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'slug', title: 'Slug', type: 'slug' },
    { name: 'body', title: 'Body', type: 'text' },
    { name: 'excerpt', title: 'Excerpt', type: 'text' },
    {
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        { name: 'metaTitle', title: 'Meta Title', type: 'string' },
        { name: 'metaDescription', title: 'Meta Description', type: 'text' },
        { name: 'keywords', title: 'Keywords', type: 'array', of: [{ type: 'string' }] }
      ]
    }
  ]
}
```

## 📊 Monitoring and Logs

- **CloudWatch Logs**: Each Lambda function logs detailed execution info
- **Error Handling**: Comprehensive error catching and user-friendly messages
- **Performance Metrics**: Processing time and success rates tracked
- **SEO Scoring**: Built-in content quality assessment

## 🧪 Testing

```bash
# Run individual Lambda functions locally
npm run dev

# Test specific endpoints
curl -X POST http://localhost:3000/analyze-website \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## 🎯 Use Cases

1. **Content Marketing Agencies**: Automate blog creation for clients
2. **SEO Teams**: Identify and fill content gaps quickly  
3. **Startups**: Generate thought leadership content
4. **E-commerce**: Create product comparison and guide content
5. **SaaS Companies**: Build educational content libraries

## 💡 Customization Examples

### Custom Content Types
Modify prompts in handlers to generate:
- Product reviews and comparisons
- How-to guides and tutorials  
- Industry news and updates
- Case studies and success stories

### Additional AI Models
Integrate other AI services:
- OpenAI GPT-4 for specific tasks
- Anthropic Claude for analysis
- Cohere for embeddings

### CMS Integration
Extend beyond Sanity to:
- WordPress via REST API
- Contentful
- Strapi
- Ghost CMS

## 🚨 Important Notes

- **Rate Limits**: Respect API rate limits for all services
- **Cost Management**: Monitor AWS Lambda and AI API usage
- **Content Quality**: Always review AI-generated content before publishing
- **SEO Best Practices**: Customize prompts for your industry
- **Legal Compliance**: Ensure content meets your publication guidelines

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your improvements
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For questions and support:
- Open an issue on GitHub
- Check the troubleshooting section
- Review CloudWatch logs for debugging

---

**Built with ❤️ using LangChain, AWS Lambda, and AI** 