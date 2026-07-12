const fs = require('fs');
const file = 'C:/Users/Administrator/Desktop/spotpark/web-user/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the faint background for selected buttons with a bright primary color so it highlights clearly
content = content.replace(/background: [a-zA-Z]+ === '[^']+' \? 'var\(--bg-tertiary\)' : 'transparent'/g, (match) => {
  return match.replace("'var(--bg-tertiary)'", "'var(--primary)'");
});

// Also replace the parking filters (which might use something else like 'rgba(255,255,255,0.1)')
// Let's check parking filters in App.jsx. Let's do a broad replacement for 'var(--bg-tertiary)' in all buttons that look like filters
content = content.replace(/'var\(--bg-tertiary\)'/g, "'var(--primary)'");

fs.writeFileSync(file, content);
console.log('Updated filter button backgrounds to highlight with primary color.');
