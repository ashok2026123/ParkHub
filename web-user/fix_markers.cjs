const fs = require('fs');

const files = [
  'C:/Users/Administrator/Desktop/spotpark/web-user/src/App.jsx',
  'C:/Users/Administrator/Desktop/spotpark/web-user/src/TripPlanner.tsx',
  'C:/Users/Administrator/Desktop/spotpark/web-user/src/components/ParkHubMap.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Change marker backgrounds from dark #1e1e1e to white #FFFFFF
  content = content.replace(/#1e1e1e/g, '#FFFFFF');

  // For isSelected ternary in background:
  // e.g. background: ${isSelected ? 'var(--text-primary)' : '#1e1e1e'}
  // was changed to background: ${isSelected ? 'var(--text-primary)' : '#FFFFFF'}
  // But wait, if text is forced to #000, then selected background should be a light blue so we can read it.
  content = content.replace(/background: \${isSelected \? 'var\(--text-primary\)' : '#FFFFFF'}/g, "background: ${isSelected ? '#E0F2FE' : '#FFFFFF'}");

  // Fix the text color ternary: color: ${isSelected ? '#000' : 'var(--text-primary)'}
  // is fine since both are black and readable on white/light-blue background.

  // Also in line 1076 (Fuel stations), it was `background: #1e1e1e; color: #FFF;`
  // My force script made it `color: '#000000'`.
  // Wait, the force script only targeted React style objects! 
  // Line 1076 is a string literal! `color: #FFF;` inside a template literal.
  // So it wasn't affected by the previous script?
  // Let me replace any remaining #FFF in string literals to #000000
  content = content.replace(/color:\s*#FFF;/gi, 'color: #000000;');

  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
});
