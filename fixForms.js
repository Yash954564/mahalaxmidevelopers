const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    let changedCount = 0;
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            if (file === 'node_modules' || file === '.git' || file === '.gemini') continue;
            changedCount += processDir(fullPath);
        } else if (file.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // Remove the exact pattern constraint
            content = content.split('pattern="[0-9]{10}"').join('');
            content = content.split("pattern='[0-9]{10}'").join('');
            
            // Wait, what if there's a space before it? e.g. ` required="" pattern="[0-9]{10}"`
            // Let's just remove ` pattern="[0-9]{10}"` explicitly
            content = content.split(' pattern="[0-9]{10}"').join('');
            
            // Just in case it was exactly `pattern="[0-9]{10}"` without space
            content = content.split('pattern="[0-9]{10}"').join('');

            // Update placeholders
            content = content.split('placeholder="10-digit mobile number"').join('placeholder="Phone number"');
            content = content.split('placeholder="10-digit mobile"').join('placeholder="Phone number"');
            content = content.split("placeholder='10-digit mobile number'").join("placeholder='Phone number'");
            content = content.split("placeholder='10-digit mobile'").join("placeholder='Phone number'");

            // Removing `required="" >` artifacts that might have been left if I removed pattern loosely
            content = content.split(' required="" >').join(' required="">');
            content = content.split(' required=""  >').join(' required="">');

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                changedCount++;
            }
        }
    }
    return changedCount;
}

const total = processDir(__dirname);
console.log(`Successfully updated ${total} HTML files to remove phone restrictions.`);
