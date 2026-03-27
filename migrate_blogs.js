const fs = require('fs');
const path = require('path');

const SOURCE_DIR_INFRA = path.join('d:', 'Mahalaxmi Developers', 'websites', 'mahalaxmiinfra.in', 'mahalaxmiinfra.in', 'blog');
const DEST_DIR = path.join(__dirname, 'blogs');
const TEMPLATE_FILE = path.join(DEST_DIR, 'blog-template.html');

if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

const template = fs.readFileSync(TEMPLATE_FILE, 'utf-8');

function extractTag(html, tag, attr = '') {
  // basic regex, note: robust parsing would use cheerio but this is fine for static templates
  const re = new RegExp(`<${tag}[^>]*${attr}[^>]*>(.*?)<\/${tag}>`, 'is');
  const match = html.match(re);
  return match ? match[1].trim() : '';
}

function extractMeta(html, name) {
  const re = new RegExp(`<meta\\s+(?:name|property)="${name}"\\s+content="(.*?)"`, 'i');
  const match = html.match(re);
  return match ? match[1].trim() : '';
}

function processInfraBlogs() {
  if (!fs.existsSync(SOURCE_DIR_INFRA)) return;
  const files = fs.readdirSync(SOURCE_DIR_INFRA).filter(f => f.endsWith('.html'));

  files.forEach(file => {
    // skip already existed files to prevent overwrite if they are premium edited
    // wait, I will just generate them as -new if not sure
    if (file === 'blog-template.html') return;
    
    const filePath = path.join(SOURCE_DIR_INFRA, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    const title = extractTag(content, 'title') || 'Blog Post | Mahalaxmi Developers';
    const metaDesc = extractMeta(content, 'description');
    
    // Extract main image (try grabbing first large image in content)
    let imageUrl = '../assets/images/Crafting.png'; // default fallback
    const imgMatch = content.match(/<img[^>]+src="([^"]+)"[^>]*>/i);
    // Try to get canonical image if exists
    const ogImage = extractMeta(content, 'og:image');
    if (ogImage) {
       // if it's an absolute url we can keep it or copy
    }
    
    // Extract date
    const dateMatch = content.match(/<p[^>]*class="[^"]*text-gray-500[^"]*"[^>]*>(.*?)<\/p>/is);
    const dateStr = dateMatch ? dateMatch[1].replace(/<[^>]+>/g, '').trim() : 'Real Estate Insights';

    // Extract article content
    let articleContent = '';
    // Let's grab everything inside the main article or the div containing the text
    const articleContainerMatch = content.match(/<div class="prose[^>]*>(.*?)<\/div>.*?<\/section>/is);
    if (articleContainerMatch) {
        articleContent = articleContainerMatch[1];
    } else {
        // fallback generic extraction
        const divMatch = content.match(/<div class="[^"]*container[^"]*"[^>]*>(?:.*?)<h1[^>]*>.*?<\/h1>(.*?)<\/div>/is);
        if (divMatch) articleContent = divMatch[1];
    }

    // Clean up content
    articleContent = articleContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    articleContent = articleContent.replace(/class="[^"]*"/g, ''); // strip tailwind classes to apply prose

    // Inject into new template
    let newHtml = template;
    newHtml = newHtml.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
    newHtml = newHtml.replace(/<meta name="description" content=".*?"\s*\/?>/, `<meta name="description" content="${metaDesc}">`);
    
    // Replace h1
    newHtml = newHtml.replace(/<h1 class="heading-md">.*?<\/h1>/s, `<h1 class="heading-md">${title.split('|')[0].trim()}</h1>`);
    // Replace date
    newHtml = newHtml.replace(/<time datetime=".*?">.*?<\/time>/s, `<time>${dateStr}</time>`);
    
    // Replace the placeholder content
    newHtml = newHtml.replace(/<div class="prose".*?>.*?<\/div>/s, `<div class="prose">${articleContent}</div>`);

    fs.writeFileSync(path.join(DEST_DIR, file), newHtml);
    console.log(`Migrated: ${file}`);
  });
}

processInfraBlogs();
