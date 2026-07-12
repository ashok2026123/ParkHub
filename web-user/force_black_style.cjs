const fs = require('fs');

const appFile = 'C:/Users/Administrator/Desktop/spotpark/web-user/src/App.jsx';
let content = fs.readFileSync(appFile, 'utf8');

// We will inject a <style> block into the top level App component
const styleBlock = `
        <style>
          * {
            color: #000000 !important;
            font-weight: 700 !important;
          }
          /* Except for white buttons or specific icons that need color */
          svg, path {
            fill: #000000 !important;
            stroke: #000000 !important;
          }
        </style>
`;

if (!content.includes('<style>')) {
  // Find the first return statement of App component
  content = content.replace(/return\s*\(\s*<div/, `return (\n      <div\n${styleBlock}`);
  fs.writeFileSync(appFile, content);
  console.log('Injected aggressive black styling into App.jsx');
} else {
  console.log('Style block already exists');
}
