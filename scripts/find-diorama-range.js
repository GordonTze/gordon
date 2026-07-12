// Replace the diorama section in download/index.html
// with new vanilla JS that mirrors the React CheckpointDiorama.tsx

const fs = require('fs');
const path = '/home/z/my-project/download/index.html';
const html = fs.readFileSync(path, 'utf8');
const lines = html.split('\n');

// Find the start and end of the diorama section
let startIdx = -1, endIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (i + 1 < lines.length && lines[i].includes('DIORAMA BUILDING BLOCKS')) {
    startIdx = i - 1; // the // === line before the comment
    break;
  }
}
for (let i = startIdx + 1; i < lines.length; i++) {
  if (i + 1 < lines.length && lines[i].includes('MAIN ANIMATION LOOP')) {
    endIdx = i - 1; // the // === line before MAIN ANIMATION LOOP
    break;
  }
}

console.log('Start line (1-indexed):', startIdx + 1, '→', lines[startIdx].trim().substring(0, 60));
console.log('End line (1-indexed):', endIdx + 1, '→', lines[endIdx].trim().substring(0, 60));
console.log('Lines to replace:', endIdx - startIdx + 1);
