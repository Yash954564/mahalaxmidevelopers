// Extract blog metadata from all blog HTML files
const fs = require('fs');
const path = require('path');

const blogsDir = path.join(__dirname, 'blogs');
const files = fs.readdirSync(blogsDir).filter(f => f.endsWith('.html') && f !== 'blog-template.html');

const blogs = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(blogsDir, file), 'utf8');
  
  // Extract title from <h1> tag
  let title = '';
  const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/s);
  if (h1Match) {
    title = h1Match[1].replace(/<[^>]*>/g, '').trim();
  }
  
  // Extract meta description
  let description = '';
  const metaDescMatch = content.match(/<meta\s+name="description"\s+content="([^"]*?)"/i);
  if (metaDescMatch) {
    description = metaDescMatch[1].trim();
  }
  
  // Extract first meaningful paragraph as excerpt
  let excerpt = '';
  const pMatches = content.match(/<p[^>]*>(.*?)<\/p>/gs);
  if (pMatches) {
    for (const p of pMatches) {
      const text = p.replace(/<[^>]*>/g, '').trim();
      if (text.length > 40 && !text.startsWith('Published') && !text.startsWith('Source:')) {
        excerpt = text.substring(0, 200);
        break;
      }
    }
  }
  
  // Check file size to determine type
  const stats = fs.statSync(path.join(blogsDir, file));
  const sizeKB = Math.round(stats.size / 1024);
  
  // Determine category from content
  let category = 'Market Guide';
  const lowerContent = content.toLowerCase();
  if (lowerContent.includes('nmrda') && (lowerContent.includes('legal') || lowerContent.includes('sanctioned'))) {
    category = 'Legal';
  } else if (lowerContent.includes('loan') || lowerContent.includes('registration charges') || lowerContent.includes('finance')) {
    category = 'Finance';
  } else if (lowerContent.includes('investment') || lowerContent.includes('evaluate') || lowerContent.includes('best time to buy')) {
    category = 'Investment';
  } else if (lowerContent.includes('document') || lowerContent.includes('rera') || lowerContent.includes('nit sanctioned')) {
    category = 'Legal';
  } else if (lowerContent.includes('shortlist') || lowerContent.includes('site visit') || lowerContent.includes('how to')) {
    category = 'Buyer Guide';
  }
  
  blogs.push({
    file,
    title: title || file.replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    description: description || excerpt || `Expert guide on ${file.replace('.html', '').replace(/-/g, ' ')} for Nagpur real estate buyers.`,
    excerpt: excerpt || description || `Expert guide on ${file.replace('.html', '').replace(/-/g, ' ')} for Nagpur real estate buyers.`,
    category,
    sizeKB,
    type: sizeKB < 10 ? 'stub' : 'full'
  });
});

// Sort by title
blogs.sort((a, b) => a.title.localeCompare(b.title));

// Output as JSON
console.log(JSON.stringify(blogs, null, 2));

// Also write to file
fs.writeFileSync(path.join(__dirname, 'blog_metadata.json'), JSON.stringify(blogs, null, 2));
console.log(`\n--- Extracted ${blogs.length} blogs ---`);
console.log(`Stubs (< 10KB): ${blogs.filter(b => b.type === 'stub').length}`);
console.log(`Full (>= 10KB): ${blogs.filter(b => b.type === 'full').length}`);
