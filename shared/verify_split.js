const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'web-user/package.json',
  'web-user/vite.config.js',
  'web-user/index.html',
  'web-user/src/App.jsx',
  'web-user/src/main.jsx',
  'web-owner/package.json',
  'web-owner/vite.config.js',
  'web-owner/index.html',
  'web-owner/src/App.jsx',
  'web-owner/src/main.jsx',
  'web-admin/package.json',
  'web-admin/vite.config.js',
  'web-admin/index.html',
  'web-admin/src/App.jsx',
  'web-admin/src/main.jsx',
  'mobile-user/pubspec.yaml',
  'mobile-user/lib/main.dart',
  'mobile-owner/pubspec.yaml',
  'mobile-owner/lib/main.dart',
  'shared/firestore.rules'
];

console.log('🔍 Running Decoupled Multi-Service Verification...\n');
let missingCount = 0;

requiredFiles.forEach(file => {
  const absolutePath = path.join(__dirname, '..', file);
  if (fs.existsSync(absolutePath)) {
    console.log(`✅ FOUND: ${file}`);
  } else {
    console.error(`❌ MISSING: ${file}`);
    missingCount++;
  }
});

console.log('\n----------------------------------------');
if (missingCount === 0) {
  console.log('🎉 Verification Successful! All multi-service components are created.');
  process.exit(0);
} else {
  console.error(`⚠️ Verification Failed: ${missingCount} files are missing!`);
  process.exit(1);
}
