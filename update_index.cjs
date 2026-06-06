const fs = require('fs');
const path = 'C:/Users/CENTER_ELRahama/Desktop/social-media-downloader/index.js';
let content = fs.readFileSync(path, 'utf8');

const staticCode = `const path = require('path');
app.use(express.static(path.join(__dirname, 'src', 'public')));
`;

if (!content.includes('express.static')) {
  // Find the app.get('/', ...) route
  const searchPattern = /app\.get\('\/', \(_req, res\) => \{[\s\S]*?\}\);/;
  if (searchPattern.test(content)) {
    content = content.replace(searchPattern, staticCode);
    fs.writeFileSync(path, content);
    console.log('Successfully updated index.js to serve the HTML file.');
  } else {
    console.log('Could not find the app.get("/", ...) route.');
  }
} else {
  console.log('Already serving static files.');
}
