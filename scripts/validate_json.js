const fs = require('fs');

try {
  const content = fs.readFileSync('messages/he.json', 'utf8');
  JSON.parse(content);
  console.log('JSON is valid.');
} catch (e) {
  console.log('JSON error:', e.message);
  // Try to match position
  const match = e.message.match(/position (\d+)/);
  if (match) {
    const pos = parseInt(match[1]);
    const upToError = content.substring(0, pos);
    const lines = upToError.split('\n');
    console.log(`Error at line ${lines.length}, column ${lines[lines.length - 1].length}`);

    // Show context
    console.log('Context:');
    const startLine = Math.max(0, lines.length - 5);
    const contextLines = content.split('\n').slice(startLine, lines.length + 2);
    contextLines.forEach((l, i) => {
      console.log(`${startLine + 1 + i}: ${l}`);
    });
  }
}
