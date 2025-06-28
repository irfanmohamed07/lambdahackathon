# Test the AI Blog Writer Complete Pipeline
# This simulates a Postman request to create a complete blog

Write-Host "🚀 Testing AI Blog Writer - Complete Pipeline" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

# Test endpoint
$url = "http://localhost:3000/dev/create-blog"

# Test payload - minimal request (auto-detect everything)
$body = @{
    url = "https://example.com"
} | ConvertTo-Json

Write-Host "📡 Endpoint: $url" -ForegroundColor Yellow
Write-Host "📝 Request Body:" -ForegroundColor Yellow
Write-Host $body -ForegroundColor White

Write-Host "`n⏳ Sending request..." -ForegroundColor Cyan

try {
    # Make the HTTP POST request
    $response = Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType "application/json" -TimeoutSec 600
    
    Write-Host "`n✅ SUCCESS!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Cyan
    
    if ($response.summary) {
        Write-Host "📝 Blog Title: $($response.summary.blogCreated.title)" -ForegroundColor White
        Write-Host "📏 Word Count: $($response.summary.blogCreated.wordCount) words" -ForegroundColor White
        Write-Host "🎯 SEO Score: $($response.summary.blogCreated.seoScore)/100" -ForegroundColor White
        Write-Host "⏱️ Processing Time: $($response.summary.pipeline.processingTimeMinutes) minutes" -ForegroundColor White
        Write-Host "🔗 Sanity URL: $($response.summary.blogCreated.sanityUrl)" -ForegroundColor White
        Write-Host "📄 Document ID: $($response.summary.blogCreated.documentId)" -ForegroundColor White
        
        Write-Host "`n📊 Pipeline Analytics:" -ForegroundColor Yellow
        Write-Host "   Keywords Generated: $($response.summary.analytics.keywordsGenerated)" -ForegroundColor White
        Write-Host "   Clusters Created: $($response.summary.analytics.clustersCreated)" -ForegroundColor White
        Write-Host "   Content Gaps Found: $($response.summary.analytics.gapsIdentified)" -ForegroundColor White
        Write-Host "   Sections Written: $($response.summary.analytics.sectionsWritten)" -ForegroundColor White
        
        Write-Host "`n✅ Completed Steps:" -ForegroundColor Green
        foreach ($step in $response.summary.pipeline.completedSteps) {
            Write-Host "   ✓ $step" -ForegroundColor Green
        }
    }
    
    Write-Host "`n🎉 Full Response Available - Check for complete details" -ForegroundColor Magenta
    
} catch {
    Write-Host "`n❌ ERROR!" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor White
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "Status Code: $statusCode" -ForegroundColor White
        
        # Try to get error details
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $reader.ReadToEnd()
            $errorData = $errorBody | ConvertFrom-Json
            
            Write-Host "`n🔍 Error Details:" -ForegroundColor Yellow
            Write-Host "$($errorData.error)" -ForegroundColor White
            Write-Host "$($errorData.details)" -ForegroundColor White
            
            if ($errorData.troubleshooting.commonIssues) {
                Write-Host "`n💡 Common Issues:" -ForegroundColor Cyan
                foreach ($issue in $errorData.troubleshooting.commonIssues) {
                    Write-Host "   • $issue" -ForegroundColor White
                }
            }
        } catch {
            Write-Host "Could not parse error response" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "1. If successful, check Sanity CMS for the created blog" -ForegroundColor White
Write-Host "2. Try with different URLs like https://flipkart.com" -ForegroundColor White
Write-Host "3. Use custom topics and keywords for targeted content" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Cyan 