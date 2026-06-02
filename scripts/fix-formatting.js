const fs = require('fs');
const path = require('path');
const dir = path.join('r:', 'nazo', 'recalliq', 'src', 'components', 'cards');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // Replace {front} inside ReactMarkdown
  content = content.replace(/<ReactMarkdown(.*?)>\{front\}<\/ReactMarkdown>/g, '<ReactMarkdown$1>{front.replace(/\\\\n/g, \'\\n\')}</ReactMarkdown>');
  
  // Replace {back} inside ReactMarkdown
  content = content.replace(/<ReactMarkdown(.*?)>\{back\}<\/ReactMarkdown>/g, '<ReactMarkdown$1>{back.replace(/\\\\n/g, \'\\n\')}</ReactMarkdown>');
  
  // Also check for {advancedMetadata?.assertion || ""}
  content = content.replace(/<ReactMarkdown(.*?)>\{advancedMetadata\?\.assertion \|\| \"\"\}<\/ReactMarkdown>/g, '<ReactMarkdown$1>{(advancedMetadata?.assertion || \"\").replace(/\\\\n/g, \'\\n\')}</ReactMarkdown>');
  
  content = content.replace(/<ReactMarkdown(.*?)>\{advancedMetadata\?\.reason \|\| \"\"\}<\/ReactMarkdown>/g, '<ReactMarkdown$1>{(advancedMetadata?.reason || \"\").replace(/\\\\n/g, \'\\n\')}</ReactMarkdown>');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Updated ' + file);
  }
}
