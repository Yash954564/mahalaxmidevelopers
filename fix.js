const fs = require('fs');
const path = require('path');

function fixHtmlFiles(dir) {
    let count = 0;
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            if (['node_modules', '.git', '.gemini'].includes(file)) continue;
            count += fixHtmlFiles(fullPath);
        } else if (file.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let orig = content;

            // Using pure strings or explicit regexes
            // The text is: pattern="[0-9]{10}"
            content = content.replace(/pattern="\[0-9\]\{10\}"/g, '');
            content = content.replace(/pattern='\[0-9\]\{10\}'/g, '');

            // The text is placeholder="10-digit mobile number"
            content = content.replace(/placeholder="10-digit mobile number"/gi, 'placeholder="Phone number"');
            content = content.replace(/placeholder="10-digit mobile"/gi, 'placeholder="Phone number"');

            // Clean up left over spaces
            content = content.replace(/ required="" /g, ' required=""');

            if (content !== orig) {
                fs.writeFileSync(fullPath, content, 'utf8');
                count++;
            }
        }
    }
    return count;
}

try {
    const total = fixHtmlFiles(__dirname);
    console.log(`\n\n--- SUCCESS: Updated ${total} files! ---\n\n`);
} catch (e) {
    console.error(`\n\n--- ERROR: ${e.message} ---\n\n`);
}
