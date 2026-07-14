const fs = require('fs');
const path = 'C:/Users/Administrator/Desktop/spotpark/web-user/src/TripPlanner.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace standard variables with exact light theme hex codes if they are glitching
content = content.replace(/var\(--bg-primary\)/g, '#FFFFFF');
content = content.replace(/var\(--bg-secondary\)/g, '#FFFFFF');
content = content.replace(/var\(--bg-tertiary\)/g, '#F8F9FA');
content = content.replace(/var\(--bg-card\)/g, '#FFFFFF');
content = content.replace(/var\(--text-primary\)/g, '#000000');
content = content.replace(/var\(--text-secondary\)/g, '#4B5563');
content = content.replace(/var\(--text-muted\)/g, '#6B7280');

fs.writeFileSync(path, content);
console.log('Fixed background in TripPlanner');
