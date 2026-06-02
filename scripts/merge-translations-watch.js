/**
 * Watch for changes in translation source files and re-merge automatically
 * Usage: node scripts/merge-translations-watch.js
 */
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const messagesDir = path.join(__dirname, '..', 'messages');
const srcDir = path.join(messagesDir, 'src');

console.log('👀 Watching for translation changes in messages/src/...\n');

let isMerging = false;
let pendingMerge = false;
let debounceTimer;

function runMerge() {
  if (isMerging) {
    pendingMerge = true;
    return;
  }

  isMerging = true;
  console.log('🔄 Changes detected. Merging...');

  execFile(process.execPath, ['scripts/merge-translations.js', '--silent'], { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
    isMerging = false;

    if (error) {
      console.error('❌ Merge failed:');
      console.error(stderr || stdout);
    } else {
      console.log('✅ Translations merged');
    }

    if (pendingMerge) {
      pendingMerge = false;
      runMerge();
    } else {
      console.log('\n👀 Waiting for changes...');
    }
  });
}

function scheduleMerge() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runMerge, 200);
}

// Watch recursively (Node 18+ supports recursive watch on Windows/macOS)
try {
  const watcher = fs.watch(srcDir, { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith('.json')) {
      scheduleMerge();
    }
  });

  watcher.on('error', (err) => {
    console.error('Watch error:', err);
  });

  console.log('👀 Waiting for changes...');

} catch (err) {
  console.error('Failed to setup watcher. Ensure you are using Node 18+');
  console.error(err);
}
