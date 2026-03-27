const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio'); // Installed package

const SOURCE_DIR_PK = path.join('d:', 'Mahalaxmi Developers', 'websites', 'pk.mahalaxmidevelopers.com', 'pk.mahalaxmidevelopers.com');
const DEST_DIR = path.join(__dirname, 'blogs');
const TEMPLATE_FILE = path.join(DEST_DIR, 'blog-template.html');

if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

const template = fs.readFileSync(TEMPLATE_FILE, 'utf-8');

function extractBlogFiles(dir, filesList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            extractBlogFiles(fullPath, filesList);
        } else if (file.endsWith('.html')) {
            // Very quick pre-check
            // If it's heavy we can't load all with cheerio, check og:type="article"
            const contentStart = fs.readFileSync(fullPath, 'utf-8').substring(0, 10000);
            if (contentStart.includes('og:type" content="article"') || contentStart.includes('og:type" content="article"')) {
                filesList.push(fullPath);
            }
        }
    }
    return filesList;
}

function processPkBlogs() {
    if (!fs.existsSync(SOURCE_DIR_PK)) {
        console.log('Source directory not found.');
        return;
    }
    
    console.log('Scanning for blog articles in pk.mahalaxmidevelopers.com...');
    const blogFiles = extractBlogFiles(SOURCE_DIR_PK);
    console.log(`Found ${blogFiles.length} potential articles.`);

    blogFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const $ = cheerio.load(content);
        
        const title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Blog Post';
        const metaDesc = $('meta[property="og:description"]').attr('content') || $('meta[name="twitter:description"]').attr('content') || '';
        const ogImage = $('meta[property="og:image"]').attr('content') || '';
        let dateStr = $('meta[property="article:published_time"]').attr('content') || '';
        if (dateStr) {
            dateStr = new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        } else {
            dateStr = 'Real Estate Insights';
        }

        // Try to get content
        let articleContent = '';
        const textEditors = $('.elementor-widget-text-editor .elementor-widget-container');
        if (textEditors.length > 0) {
            articleContent = textEditors.map((i, el) => $(el).html()).get().join('<br>');
        } else {
            // fallback generic extraction
            // Remove scripts, nav, header, footer
            $('script').remove();
            $('style').remove();
            $('header').remove();
            $('footer').remove();
            $('nav').remove();
            $('.elementor-location-header').remove();
            $('.elementor-location-footer').remove();
            
            // let's grab the elementor inner content
            let mainContext = $('.elementor-element-populate').html();
            if(mainContext) {
                articleContent = mainContext;
            } else {
                articleContent = $('body').html();
            }
        }

        // generate slug from title
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const outFileName = slug + '.html';

        // Inject into new template
        let newHtml = template;
        newHtml = newHtml.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
        newHtml = newHtml.replace(/<meta name="description" content=".*?"\s*\/?>/, `<meta name="description" content="${metaDesc.substring(0, 160)}">`);
        
        newHtml = newHtml.replace(/<h1 class="heading-md">.*?<\/h1>/s, `<h1 class="heading-md">${title.split('-')[0].split('|')[0].trim()}</h1>`);
        newHtml = newHtml.replace(/<time datetime=".*?">.*?<\/time>/s, `<time>${dateStr}</time>`);
        
        // Try fixing image path to placeholder or original url if absolute
        let finalImage = ogImage || 'https://sz.mahalaxmidevelopers.com/assets/images/Crafting.png';

        // we don't change template image url much right now.
        // The template has {{IMAGE}} inside and {{CONTENT}} but actually blog-template.html
        // wait, earlier I used replace /<div class="prose".*?>.*?<\/div>/s, because I replaced placeholders in the template.
        // wait my migrate_blogs.js used index.html template.
        
        newHtml = newHtml.replace(/<div class="prose".*?>.*?<\/div>/s, `<div class="prose">${articleContent}</div>`);

        fs.writeFileSync(path.join(DEST_DIR, outFileName), newHtml);
        console.log(`Migrated: ${outFileName}`);
    });
}

processPkBlogs();
