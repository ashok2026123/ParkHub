const fs = require('fs');
const path = 'C:/Users/Administrator/Desktop/spotpark/web-user/src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

// Fix the card background to be white
content = content.replace(
  /background: rgba\(6, 11, 24, 0\.94\);/g,
  "background: #ffffff;"
);

// Fix the input fields background to be light grey
content = content.replace(
  /background: '#0d0d0d'/g,
  "background: 'var(--bg-tertiary, #f8f9fa)'"
);

// Also check for the "Sign in with Google" button background
content = content.replace(
  /background: 'rgba\(0, 0, 0, 0\.3\)'/g,
  "background: 'var(--bg-tertiary, #f8f9fa)'"
);

content = content.replace(
  /background: 'rgba\(255, 255, 255, 0\.03\)'/g,
  "background: 'var(--bg-tertiary, #f8f9fa)'"
);

// Remove the dark text-muted fallback just in case
content = content.replace(
  /color: 'var\(--text-muted, #78909C\)'/g,
  "color: 'var(--text-secondary, #4B5563)'"
);


fs.writeFileSync(path, content);
console.log('Fixed Login input and card background');
