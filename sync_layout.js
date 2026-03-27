const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const BASE_DIR = __dirname;
const INDEX_PATH = path.join(BASE_DIR, 'index.html');

// --- EXTRACT FROM INDEX.HTML ---
const indexContent = fs.readFileSync(INDEX_PATH, 'utf-8');
const $index = cheerio.load(indexContent);

const headerHtml = $index('header.header').prop('outerHTML');
const footerHtml = $index('footer.footer').prop('outerHTML');
const floatersHtml = $index('.floaters').prop('outerHTML');
const modalHtml = $index('.modal').prop('outerHTML');

const directories = ['pages', 'blogs', 'projects'];

function getRelativePrefix(filePath) {
    const depth = filePath.split(path.sep).length - BASE_DIR.split(path.sep).length - 1;
    return '../'.repeat(depth);
}

function updatePaths(html, prefix) {
    if (!prefix) return html;
    let updated = html;
    
    // Replace assets/ with prefix + assets/
    updated = updated.replace(/(src|href)="assets\//g, `$1="${prefix}assets/`);
    // Replace pages/ with prefix + pages/
    updated = updated.replace(/(src|href)="pages\//g, `$1="${prefix}pages/`);
    // Replace blogs/ with prefix + blogs/
    updated = updated.replace(/(src|href)="blogs\//g, `$1="${prefix}blogs/`);
    // Replace projects/ with prefix + projects/
    updated = updated.replace(/(src|href)="projects\//g, `$1="${prefix}projects/`);
    // Replace index.html with prefix + index.html
    updated = updated.replace(/href="index\.html"/g, `href="${prefix}index.html"`);
    
    return updated;
}

directories.forEach(dir => {
    const dirPath = path.join(BASE_DIR, dir);
    if (!fs.existsSync(dirPath)) return;

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.html'));
    
    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        let content = fs.readFileSync(filePath, 'utf-8');
        const $ = cheerio.load(content);
        const prefix = getRelativePrefix(filePath);

        // Update Header
        if ($('header.header').length) {
            $('header.header').replaceWith(updatePaths(headerHtml, prefix));
        } else if ($('header').length) {
            $('header').replaceWith(updatePaths(headerHtml, prefix));
        } else {
            $('body').prepend(updatePaths(headerHtml, prefix));
        }

        // Update Footer
        if ($('footer.footer').length) {
            $('footer.footer').replaceWith(updatePaths(footerHtml, prefix));
        } else if ($('footer').length) {
            $('footer').replaceWith(updatePaths(footerHtml, prefix));
        } else {
            // Find where to insert footer (before script tags at end of body)
            const firstScript = $('body > script').first();
            if (firstScript.length) {
                firstScript.before(updatePaths(footerHtml, prefix));
            } else {
                $('body').append(updatePaths(footerHtml, prefix));
            }
        }

        // Update Floaters
        $('.floaters').remove();
        $('footer.footer').after('\n' + updatePaths(floatersHtml, prefix));

        // Update Modal
        $('.modal').remove();
        $('.floaters').after('\n' + updatePaths(modalHtml, prefix));

        // Ensure JS link is correct
        $('script[src*="app.js"]').attr('src', prefix + 'js/app.js');
        
        // Ensure CSS link is correct
        $('link[href*="styles.css"]').attr('href', prefix + 'css/styles.css');

        fs.writeFileSync(filePath, $.html());
        console.log(`Synced Layout: ${dir}/${file}`);
    });
});

console.log('Global Layout Synchronization Complete.');
