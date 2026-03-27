const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const PROJECTS_DIR = path.join(__dirname, 'projects');
const files = fs.readdirSync(PROJECTS_DIR).filter(f => f.endsWith('.html') && f !== 'project-template.html');

files.forEach(file => {
    const filePath = path.join(PROJECTS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(content);

    // 1. Fix broken absolute links to mahalaxmiinfra.in
    $('a[href*="mahalaxmiinfra.in"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href.includes('/contact')) {
            $(el).attr('href', '../pages/contact.html');
        } else if (href.includes('/project/')) {
            const slug = href.split('/').pop().replace('.html', '');
            if (fs.existsSync(path.join(PROJECTS_DIR, slug + '.html'))) {
                $(el).attr('href', slug + '.html');
            }
        }
    });

    // 2. Fix broken absolute image links
    $('img[src*="mahalaxmiinfra.in"]').each((i, el) => {
        const src = $(el).attr('src');
        const fileName = src.split('/').pop();
        // Check if we have it in legacy
        if (src.includes('projects_images')) {
            $(el).attr('src', `../assets/legacy/images/projects_images/${fileName}`);
        } else if (src.includes('amenties')) {
             $(el).attr('src', `../assets/legacy/images/amenties/${fileName}`);
        }
    });

    // 3. Fix "Get in Touch" buttons in the content
    $('a:contains("Get in Touch")').attr('href', '../pages/contact.html');
    $('a:contains("Contact Us")').attr('href', '../pages/contact.html');

    // 4. Ensure body background is consistent with new theme
    $('body').removeClass('bg-[#ffff0]').addClass('active-project-page');
    
    // 5. Fix brochure links if they are absolute
    $('a[href*="/documents/"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href.startsWith('http')) {
             const fileName = href.split('/').pop();
             $(el).attr('href', `../assets/legacy/documents/property_documents/${fileName}`);
        }
    });

    // 6. Ensure the global CSS doesn't break the Tailwind layout
    // Add a helper class to the main content container if it exists
    $('section').first().addClass('project-layout-root');

    fs.writeFileSync(filePath, $.html());
    console.log(`Cleaned up Project: ${file}`);
});

console.log('Project Cleanup Complete.');
