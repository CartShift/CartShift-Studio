/**
 * Clean up remaining debug console statements in production
 * This script scans for and removes debug console.log statements
 * while keeping important error logging
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIRS_TO_SCAN = ['components', 'lib', 'app'];

const PATTERNS_TO_REMOVE = [
  /console\.log\(\[.*DEBUG.*\);?\s*\n/g,
  /console\.log\(\[.*Step|Initiated|Started|Auth completed|Storage path|Generated|About to|File uploaded|Successfully|Public URL|Built Function URL|Redirect URI|Exchanging|Checking|Found|Exists|Retrieved|Applied|Synced|Loaded|Validating|Checking|Creating|Updating|Deleting|Setting|Clearing|Removed|Added|Generated|Creating|Initialized|Starting|Stopping|Closing|Opening|Saving|Loading|Refreshing|Fetching|Listing|Storing|Getting|Sending|Calling|Executing|Processing|Handling|Building|Preparing|Constructing|Rendering|Mounting|Unmounting|Connecting|Disconnecting|Syncing|Verifying|Validating|Initializing|Configuring|Setting up|Tearing down|Cleaning up|Resetting|Switching|Toggling|Enabling|Disabling]\);?\s*\n/g,
];

const PATTERNS_TO_KEEP = [/console\.error\(/g, /console\.warn\(/g];

function scanFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    let modified = false;
    let newContent = content;

    for (const pattern of PATTERNS_TO_REMOVE) {
      const matches = content.match(pattern);
      if (matches) {
        newContent = newContent.replace(pattern, '');
        modified = true;
      }
    }

    for (const pattern of PATTERNS_TO_KEEP) {
      const originalMatches = content.match(pattern);
      const newMatches = newContent.match(pattern);

      if (originalMatches && !newMatches) {
        return { modified: false, path: filePath, error: 'Important logging accidentally removed' };
      }
    }

    if (modified && newContent !== content) {
      writeFileSync(filePath, newContent, 'utf8');
      return { modified: true, path: filePath };
    }

    return { modified: false, path: filePath };
  } catch (error) {
    return { modified: false, path: filePath, error: error.message };
  }
}

function scanDirectory(dirPath) {
  const results = [];

  function recurse(currentPath) {
    try {
      const entries = readdirSync(currentPath);

      for (const entry of entries) {
        const fullPath = join(currentPath, entry);
        const stats = statSync(fullPath);

        if (stats.isDirectory()) {
          if (['node_modules', '.next', '.git', 'dist', 'build'].includes(entry)) continue;
          recurse(fullPath);
        } else if (stats.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry)) {
          const result = scanFile(fullPath);
          results.push(result);
        }
      }
    } catch {}
  }

  recurse(dirPath);
  return results;
}

function main() {
  console.log('🧹 Scanning for debug console statements...\n');

  let totalFiles = 0;
  let modifiedFiles = 0;
  let errors = 0;

  for (const dir of DIRS_TO_SCAN) {
    const dirPath = join(process.cwd(), dir);

    try {
      const results = scanDirectory(dirPath);
      totalFiles += results.length;
      modifiedFiles += results.filter(r => r.modified).length;
      errors += results.filter(r => r.error).length;

      results.forEach(result => {
        if (result.modified) {
          console.log(`✅ Cleaned: ${result.path.replace(process.cwd(), '')}`);
        } else if (result.error) {
          console.log(`❌ Error: ${result.path} - ${result.error}`);
        }
      });
    } catch (error) {
      console.log(`⚠️ Could not scan directory: ${dir} - ${error.message}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Scanned: ${totalFiles} files`);
  console.log(`   Modified: ${modifiedFiles} files`);
  console.log(`   Errors: ${errors} files`);

  if (modifiedFiles > 0) {
    console.log(`\n✨ Done! Debug logging cleaned up from ${modifiedFiles} files.`);
  } else {
    console.log(`\n✨ Done! No debug logging found to clean up.`);
  }
}

main();
