const fs = require('fs');


function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walkDir(file));
    } else if (file.endsWith('.jsx') || file.endsWith('.tsx') || file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walkDir('C:/Users/Administrator/Desktop/spotpark/web-user/src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace all color declarations to absolute black #000000
  content = content.replace(/color:\s*['"]var\(--text-primary\)['"]/gi, "color: '#000000'");
  content = content.replace(/color:\s*['"]var\(--text-secondary\)['"]/gi, "color: '#000000'");
  content = content.replace(/color:\s*['"]var\(--text-muted\)['"]/gi, "color: '#000000'");
  
  content = content.replace(/color:\s*['"]#(FFF|FFFFFF|F0F4FF|8B9AC4|4A5580|A3A3A3)['"]/gi, "color: '#000000'");
  content = content.replace(/color:\s*['"]white['"]/gi, "color: '#000000'");

  // Fix white borders/backgrounds that should be dark
  content = content.replace(/rgba\(255,\s*255,\s*255,/gi, "rgba(0, 0, 0,");

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
