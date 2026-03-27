const fs = require('fs');
const path = require('path');

const infra_base = path.join('d:', 'Mahalaxmi Developers', 'websites', 'mahalaxmiinfra.in', 'mahalaxmiinfra.in');
const sz_base = path.join(__dirname);
const projects_dir = path.join(sz_base, 'projects');
const legacy_dir = path.join(sz_base, 'assets', 'legacy');

// Ensure destination directories
if (!fs.existsSync(projects_dir)) fs.mkdirSync(projects_dir, { recursive: true });
if (!fs.existsSync(legacy_dir)) fs.mkdirSync(legacy_dir, { recursive: true });

console.log('Copying legacy assets... this may take a moment.');

// Copy legacy assets to be self-contained
const dirsToCopy = ['build', 'frontend', 'images', 'documents'];
for (const dir of dirsToCopy) {
    const src = path.join(infra_base, dir);
    const dest = path.join(legacy_dir, dir);
    if (fs.existsSync(src)) {
        fs.cpSync(src, dest, { recursive: true });
        console.log(`Copied ${dir} to legacy assets.`);
    }
}

// Get sz header and footer from index.html
const indexHtml = fs.readFileSync(path.join(sz_base, 'index.html'), 'utf-8');

// Extract Header from index.html
const headerMatch = indexHtml.match(/<header[^>]*class="header"[^>]*>[\s\S]*?<\/header>/);
let szHeader = headerMatch ? headerMatch[0] : '';
// Fix URLs for sub-directory (since projects are in /projects/)
szHeader = szHeader.replace(/"assets\//g, '"../assets/');
szHeader = szHeader.replace(/"pages\//g, '"../pages/');
szHeader = szHeader.replace(/"blogs\//g, '"../blogs/');
// Wait, the index header links to "pages/about.html", so from projects it must be "../pages/about.html"
// Home is just "../index.html", wait in index.html it's 'HREF="#"' or something.
szHeader = szHeader.replace(/href="index\.html"/g, 'href="../index.html"');
szHeader = szHeader.replace(/href="#"/g, 'href="../index.html"'); // if home is #

// Extract Footer from index.html
const footerMatch = indexHtml.match(/<footer[^>]*class="footer"[^>]*>[\s\S]*?<\/footer>/);
let szFooter = footerMatch ? footerMatch[0] : '';
szFooter = szFooter.replace(/"assets\//g, '"../assets/');
szFooter = szFooter.replace(/"pages\//g, '"../pages/');
szFooter = szFooter.replace(/"blogs\//g, '"../blogs/');
szFooter = szFooter.replace(/href="index\.html"/g, 'href="../index.html"');
szFooter = szFooter.replace(/href="#"/g, 'href="../index.html"');

// also get the floaters
const floatersMatch = indexHtml.match(/<div class="floaters">[\s\S]*?<\/div>/);
let szFloaters = floatersMatch ? floatersMatch[0] : '';

// Process all project files
const infraProjectsDir = path.join(infra_base, 'project');
const projectFiles = fs.readdirSync(infraProjectsDir).filter(f => f.endsWith('.html'));

projectFiles.forEach(file => {
    let content = fs.readFileSync(path.join(infraProjectsDir, file), 'utf-8');

    // Replace header
    content = content.replace(/<header[^>]*>[\s\S]*?<\/header>/i, szHeader);

    // Replace footer
    content = content.replace(/<footer[^>]*>[\s\S]*?<\/footer>/i, szFooter + '\n' + szFloaters);

    // Fix paths to point to legacy assets
    content = content.replace(/\.\.\/build\//g, '../assets/legacy/build/');
    content = content.replace(/\.\.\/frontend\//g, '../assets/legacy/frontend/');
    content = content.replace(/\.\.\/images\//g, '../assets/legacy/images/');
    content = content.replace(/\.\.\/documents\//g, '../assets/legacy/documents/');
    
    // Some assets might be absolute in the template, e.g. src="/images/..."
    content = content.replace(/(src|href)="\/build\//g, '$1="../assets/legacy/build/');
    content = content.replace(/(src|href)="\/frontend\//g, '$1="../assets/legacy/frontend/');
    content = content.replace(/(src|href)="\/images\//g, '$1="../assets/legacy/images/');
    content = content.replace(/(src|href)="\/documents\//g, '$1="../assets/legacy/documents/');

    // Add styles.css, ensuring our custom styles don't conflict but override properly
    content = content.replace(/<\/head>/i, `  <!-- SZ Global Styles -->\n  <link rel="stylesheet" href="../css/styles.css">\n  <script src="../js/app.js" defer></script>\n</head>`);

    // Write to projects
    fs.writeFileSync(path.join(projects_dir, file), content);
    console.log(`Migrated project: ${file}`);
});

console.log('Project HTML structures successfully migrated.');
