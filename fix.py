import os

count = 0

for root, dirs, files in os.walk('.'):
    # Skip some dirs
    if '.git' in dirs: dirs.remove('.git')
    if 'node_modules' in dirs: dirs.remove('node_modules')
    if '.gemini' in dirs: dirs.remove('.gemini')
    
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            orig = content
            
            # Simple string replacements
            content = content.replace('pattern="[0-9]{10}"', '')
            content = content.replace("pattern='[0-9]{10}'", '')
            content = content.replace('placeholder="10-digit mobile number"', 'placeholder="Phone number"')
            content = content.replace('placeholder="10-digit mobile"', 'placeholder="Phone number"')
            
            # Cleanup multiple spaces before >
            content = content.replace(' required=""  >', ' required="">')
            content = content.replace(' required="" >', ' required="">')
            content = content.replace(' required  >', ' required>')
            content = content.replace(' required >', ' required>')
            
            if content != orig:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                count += 1

print(f"Successfully updated {count} files")
