const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'web/package.json',
  'web/vite.config.js',
  'web/index.html',
  'web/src/index.css',
  'web/src/context/LangContext.jsx',
  'web/src/context/AuthContext.jsx',
  'web/src/services/mockDb.js',
  'web/src/App.jsx',
  'web/src/main.jsx',
  'mobile/pubspec.yaml',
  'mobile/lib/core/utils/translations.dart',
  'mobile/lib/data/models/parking_location.dart',
  'mobile/lib/providers/parking_provider.dart',
  'mobile/lib/main.dart',
  'shared/firestore.rules',
  'docs/deployment_guide.md'
];

console.log('🔍 Running ParkHub Structure Verification...\n');
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
  console.log('🎉 Verification Successful! All platform components are created.');
  process.exit(0);
} else {
  console.error(`⚠️ Verification Failed: ${missingCount} files are missing!`);
  process.exit(1);
}
