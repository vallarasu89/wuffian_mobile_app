const fs = require('fs');
const path = require('path');

const targetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  '@maplibre',
  'maplibre-react-native',
  'android',
  'build.gradle'
);

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');

  if (!content.includes('buildFeatures {')) {
    // Inject buildFeatures { buildConfig true } right inside android {
    content = content.replace(
      /android\s*\{/,
      `android {\n  buildFeatures {\n    buildConfig true\n  }`
    );
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('[patch-maplibre] Successfully enabled buildConfig true in maplibre-react-native android/build.gradle');
  } else {
    console.log('[patch-maplibre] buildFeatures already present in maplibre-react-native');
  }
} else {
  console.log('[patch-maplibre] maplibre-react-native android/build.gradle not found (skipped)');
}
