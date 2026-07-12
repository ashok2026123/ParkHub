const fs = require('fs');

const files = [
  'C:/Users/Administrator/Desktop/spotpark/web-user/src/App.jsx',
  'C:/Users/Administrator/Desktop/spotpark/web-user/src/TripPlanner.tsx',
  'C:/Users/Administrator/Desktop/spotpark/web-user/src/components/PlaceCard.tsx',
  'C:/Users/Administrator/Desktop/spotpark/web-user/src/components/ParkHubMap.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Fix all text gradients
  content = content.replace(/background:\s*['"]linear-gradient\([^)]+\)['"],\s*WebkitBackgroundClip:\s*['"]text['"],\s*WebkitTextFillColor:\s*['"]transparent['"]/gi, "color: 'var(--text-primary)'");
  
  // Fix inline colors in ternary operators and elsewhere that use #FFF or white
  content = content.replace(/'#FFF'/gi, "'var(--text-primary)'");
  content = content.replace(/'#FFFFFF'/gi, "'var(--text-primary)'");
  content = content.replace(/'white'/gi, "'var(--text-primary)'");

  // Fix other scattered light text colors like #8B9AC4 or #F0F4FF or #A3A3A3
  content = content.replace(/'#8B9AC4'/gi, "'var(--text-primary)'");
  content = content.replace(/'#F0F4FF'/gi, "'var(--text-primary)'");
  content = content.replace(/'#A3A3A3'/gi, "'var(--text-primary)'");

  // Ensure var(--text-muted) and var(--text-secondary) are definitely black in the inline styles if needed,
  // but they are already mapped to #000 in index.css.
  
  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
});
