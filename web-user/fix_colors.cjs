const fs = require('fs');
const path = require('path');

const files = [
  'C:/Users/Administrator/Desktop/spotpark/web-user/src/App.jsx',
  'C:/Users/Administrator/Desktop/spotpark/web-user/src/TripPlanner.tsx',
  'C:/Users/Administrator/Desktop/spotpark/web-user/src/components/PlaceCard.tsx',
  'C:/Users/Administrator/Desktop/spotpark/web-user/src/components/ParkHubMap.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace dark backgrounds
  content = content.replace(/background:\s*['"]#(0a0810|1A1820|121016|060B18|0D1526|142035)['"]/gi, "background: 'var(--bg-secondary)'");
  
  // Replace light text colors with var(--text-primary)
  content = content.replace(/color:\s*['"]#(FFF|FFFFFF|F0F4FF|8B9AC4|4A5580)['"]/gi, "color: 'var(--text-primary)'");
  content = content.replace(/color:\s*['"]white['"]/gi, "color: 'var(--text-primary)'");
  
  // Also fix gradients that use dark colors
  content = content.replace(/rgba\(13,\s*21,\s*38/gi, "rgba(255, 255, 255");
  content = content.replace(/rgba\(0,\s*0,\s*0,\s*0\.8\)/gi, "rgba(255, 255, 255, 1)");

  // Sidebar specific bg
  content = content.replace(/background:\s*['"]var\(--bg-dark\)['"]/gi, "background: 'var(--bg-primary)'");
  
  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
});
