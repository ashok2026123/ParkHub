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
  
  // Replace dark rgba backgrounds
  content = content.replace(/background:\s*['"]rgba\(6,\s*11,\s*24,\s*0\.95\)['"]/gi, "background: 'var(--bg-secondary)'");
  content = content.replace(/background:\s*['"]rgba\(13,\s*21,\s*38,\s*[\d.]+['"]/gi, "background: 'var(--bg-secondary)'");

  // Remove the text gradient for the h1 (ParkHub / AppName)
  content = content.replace(/background:\s*['"]linear-gradient\(135deg,\s*#00D4FF,\s*#7B61FF\)['"],\s*WebkitBackgroundClip:\s*['"]text['"],\s*WebkitTextFillColor:\s*['"]transparent['"]/gi, "color: 'var(--text-primary)'");
  
  // Also any other #00D4FF or #7B61FF that is used for text
  content = content.replace(/color:\s*['"]#00D4FF['"]/gi, "color: 'var(--text-primary)'");
  content = content.replace(/color:\s*['"]#8B9AC4['"]/gi, "color: 'var(--text-primary)'");
  content = content.replace(/color:\s*['"]#F0F4FF['"]/gi, "color: 'var(--text-primary)'");

  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
});
