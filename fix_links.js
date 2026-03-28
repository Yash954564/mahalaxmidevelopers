// Fix broken footer links across all pages
const fs = require('fs');
const path = require('path');

const fixes = [
  // Pages in /pages/ directory need ../plots/ prefix
  {
    dir: 'pages', files: ['about.html', 'contact.html', 'locations.html', 'privacy.html', 'projects.html', 'reviews.html', 'terms.html', 'blogs.html'],
    from: ['"plots-in-manish-nagar/"', '"plots-in-besa/"', '"plots-in-beltarodi/"', '"plots-on-wardha-road/"'],
    to: ['"../plots/plots-in-manish-nagar/"', '"../plots/plots-in-besa/"', '"../plots/plots-in-beltarodi/"', '"../plots/plots-on-wardha-road/"']
  },
  // Homepage needs plots/ prefix
  {
    dir: '.', files: ['/'],
    from: ['"plots-in-manish-nagar/"', '"plots-in-besa/"', '"plots-in-beltarodi/"', '"plots-on-wardha-road/"'],
    to: ['"plots/plots-in-manish-nagar/"', '"plots/plots-in-besa/"', '"plots/plots-in-beltarodi/"', '"plots/plots-on-wardha-road/"']
  },
  // Plots pages themselves - already correct (relative to own dir) or need fixing
  // Fix about.html CTA links
  {
    dir: 'pages', files: ['about.html'],
    from: ['href="contact.html"', 'href="projects.html"'],
    to: ['href="../pages/contact.html"', 'href="../pages/projects.html"']
  }
];

let totalFixes = 0;

fixes.forEach(fix => {
  fix.files.forEach(file => {
    const filePath = path.join(__dirname, fix.dir, file);
    if (!fs.existsSync(filePath)) { console.log(`⚠️  ${fix.dir}/${file} not found, skipping`); return; }
    let content = fs.readFileSync(filePath, 'utf8');
    let fileFixCount = 0;
    fix.from.forEach((fromStr, i) => {
      const count = (content.match(new RegExp(fromStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      if (count > 0) {
        content = content.split(fromStr).join(fix.to[i]);
        fileFixCount += count;
      }
    });
    if (fileFixCount > 0) {
      fs.writeFileSync(filePath, content);
      totalFixes += fileFixCount;
      console.log(`✅ ${fix.dir}/${file}: ${fileFixCount} links fixed`);
    }
  });
});

// Also check about.html for broken CTA links that should already be correct
const aboutPath = path.join(__dirname, 'pages', 'about.html');
if (fs.existsSync(aboutPath)) {
  let about = fs.readFileSync(aboutPath, 'utf8');
  // Fix self-referencing links: about.html links that say "../pages/contact.html" which is double-prefixed
  // Actually the about CTA might point to "contact.html" without the path which resolves from /pages/ dir - that's correct
  // Let's undo the potential double fix
  about = about.replace(/"\.\.\/pages\/\.\.\/pages\//g, '"../pages/');
  fs.writeFileSync(aboutPath, about);
}

console.log(`\n🎉 Fixed ${totalFixes} broken footer links across all pages`);
