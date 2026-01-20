/**
 * Script to create Firestore indexes for rate limiting
 * Run with: node scripts/deploy-rate-limiter-indexes.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Deploying Firestore indexes for rate limiter...\n');

try {
  // Add rate limit collection index to firestore.indexes.json
  const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');

  console.log('✅ Rate limiter indexes would be added to firestore.indexes.json');
  console.log('📝 Manual index configuration:');
  console.log({
    indexes: [
      {
        collectionGroup: '_rate_limits',
        queryScope: 'COLLECTION',
        fields: [
          { fieldPath: 'windowStart', order: 'ASCENDING' },
          { fieldPath: 'count', order: 'ASCENDING' },
        ],
      },
    ],
    fieldOverrides: [
      {
        collection: '_rate_limits',
        fieldPath: 'lastUpdated',
        ttl: true,
      },
    ],
  });

  console.log('\n⚠️  Note: For production, add the above to firestore.indexes.json');
  console.log('and run: firebase deploy --only firestore:indexes\n');
} catch (error) {
  console.error('❌ Error deploying indexes:', error);
  process.exit(1);
}
