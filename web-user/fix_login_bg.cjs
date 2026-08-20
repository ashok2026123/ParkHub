const fs = require('fs');
const path = 'C:/Users/Administrator/Desktop/spotpark/web-user/src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace dark login wrapper
content = content.replace(
  /background: 'linear-gradient\(135deg, #060B18 0%, #0D1526 50%, #060B18 100%\)',/g,
  "background: 'var(--bg-primary)',"
);

// Replace tech grid color
content = content.replace(
  /rgba\(0, 212, 255, 0\.04\)/g,
  "rgba(0, 0, 0, 0.04)"
);

// Fix glass card shadows for light theme
content = content.replace(
  /box-shadow: 0 40px 80px rgba\(0, 0, 0, 0\.7\), 0 0 60px rgba\(0, 212, 255, 0\.06\);/g,
  "box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);"
);

// Change text color in the card
content = content.replace(
  /color: #fff/g,
  "color: #000"
);

// More text color changes for login
content = content.replace(
  /color: '#FFFFFF'/g,
  "color: '#000000'"
);

content = content.replace(
  /color: '#A0AEC0'/g,
  "color: '#4B5563'"
);
content = content.replace(
  /color: 'rgba\(255,255,255,0\.5\)'/g,
  "color: 'rgba(0,0,0,0.5)'"
);


fs.writeFileSync(path, content);
console.log('Fixed Login bg and text');
