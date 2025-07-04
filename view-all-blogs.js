require('dotenv').config();
const { client } = require('./src/utils/sanityMCP');

async function showBlogs() {
  try {
    // Query posts using the new schema structure
    const posts = await client.fetch(`
      *[_type == "post"] | order(_createdAt desc)[0...10]{
        _id,
        title,
        subtitle,
        slug,
        _createdAt,
        readTime,
        seoKeywords,
        publishedAt
      }
    `);

    console.log('\n📚 YOUR BLOGS IN SANITY (New Project):');
    console.log('=========================================');
    console.log(`🏢 Project ID: ${process.env.SANITY_PROJECT_ID || '0u2n1rlt'}`);
    console.log(`📊 Dataset: ${process.env.SANITY_DATASET || 'production'}`);
    console.log('=========================================\n');

    if (posts.length > 0) {
      posts.forEach((post, i) => {
        console.log(`${i + 1}. 📝 ${post.title || 'Untitled'}`);
        console.log(`   📄 Subtitle: ${post.subtitle || 'No subtitle'}`);
        console.log(`   🔗 Slug: ${post.slug?.current || 'No slug'}`);
        console.log(`   🆔 ID: ${post._id}`);
        console.log(`   ⏱️  Reading Time: ${post.readTime || 'Not specified'}`);
        console.log(`   🏷️  Keywords: ${post.seoKeywords?.length ? post.seoKeywords.join(', ') : 'None'}`);
        console.log(`   📅 Published: ${post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Not published'}`);
        console.log(`   🕒 Created: ${new Date(post._createdAt).toLocaleDateString()}`);
        console.log('');
      });
      console.log(`✅ Total blogs found: ${posts.length}`);
    } else {
      console.log('❌ No blogs found in database');
      console.log('💡 Make sure blogs have been published using the MCP-enabled system');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('🔧 Make sure your environment variables are set correctly:');
    console.log('   - SANITY_PROJECT_ID should be: 0u2n1rlt');
    console.log('   - SANITY_DATASET should be: production');
    console.log('   - SANITY_API_TOKEN should be set with read permissions');
  }
}

showBlogs(); 