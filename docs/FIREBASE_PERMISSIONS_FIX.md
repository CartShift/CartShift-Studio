# Firebase Permissions Error Fix

## 🔍 Problem

You're seeing the error: **"Missing or insufficient permissions"** in the console.

**Note:** Some permission errors are expected during authentication transitions (login/logout) and are now automatically suppressed. If you see this error persistently, use the diagnostic tool below to identify the specific issue.

This happens when:

1. User is authenticated but doesn't have a `portal_users` document in Firestore
2. User doesn't have organization membership (`portal_members` document)
3. Firestore rules are blocking access due to missing permissions
4. Auth token hasn't loaded yet when Firestore is accessed

## ✅ Solutions Applied

### 1. Improved Error Handling

- **BrandingProvider**: Now gracefully handles permission errors without crashing
- **usePortalAuth**: Better client-side checks and error suppression during auth transitions
- **GlobalSearch**: Now waits for authentication before subscribing to Firestore
- All Firestore access now properly waits for authentication
- Permission errors during auth transitions are automatically suppressed

### 2. Diagnostic Tool

A new diagnostic utility is available to help identify the exact issue:

**In Browser Console:**

```javascript
// Method 1: Import and run diagnostic
const { diagnoseFirebasePermissions } = await import('/lib/utils/firebase-diagnostics.js');
await diagnoseFirebasePermissions();

// Method 2: Quick check for specific document
const { checkFirestoreAccess } = await import('/lib/utils/firebase-diagnostics.js');
const hasAccess = await checkFirestoreAccess('portal_users', 'your-user-id');
console.log('Has access:', hasAccess);
```

**Or use the helper utilities:**

```typescript
import { isPermissionError, shouldSuppressPermissionError } from '@/lib/utils/firestore-helpers';
```

## 🚀 Quick Fixes

### Fix 1: Ensure User Document Exists

If you're a new user or your document is missing:

1. **Sign out and sign back in** - This will trigger document creation
2. **Or manually create** the document in Firebase Console:
   - Collection: `portal_users`
   - Document ID: `{your-user-id}`
   - Data:
     ```json
     {
       "email": "your@email.com",
       "name": "Your Name",
       "accountType": "CLIENT",
       "isAgency": false,
       "organizations": [],
       "createdAt": "timestamp",
       "updatedAt": "timestamp"
     }
     ```

### Fix 2: Create Organization Membership

If you have an organization but can't access it:

1. **Accept the invite** if you received one
2. **Or manually create** the member document:
   - Collection: `portal_members`
   - Document ID: `{orgId}_{userId}` (IMPORTANT: Must be this format)
   - Data:
     ```json
     {
       "orgId": "your-org-id",
       "userId": "your-user-id",
       "email": "your@email.com",
       "role": "member",
       "createdAt": "timestamp",
       "updatedAt": "timestamp"
     }
     ```

### Fix 3: Deploy Firestore Rules

Make sure your Firestore rules are deployed:

```bash
firebase deploy --only firestore:rules
```

Or deploy via Firebase Console:

1. Go to https://console.firebase.google.com
2. Select your project
3. Firestore Database → Rules
4. Copy contents from `firestore.rules`
5. Click "Publish"

## 🔧 Testing

1. **Clear browser cache and localStorage**:

   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Sign out and sign back in**

3. **Run the diagnostic**:

   ```javascript
   import { diagnoseFirebasePermissions } from '@/lib/utils/firebase-diagnostics';
   await diagnoseFirebasePermissions();
   ```

4. **Check console** for specific error messages

## 📋 Common Scenarios

### Scenario 1: New User

- **Symptom**: Permission error immediately after signup
- **Cause**: User document not created yet
- **Fix**: Sign out/in or wait a few seconds for document creation

### Scenario 2: No Organization Access

- **Symptom**: Can sign in but can't see dashboard
- **Cause**: Missing `portal_members` document
- **Fix**: Accept invite or create member document

### Scenario 3: Build Errors

- **Symptom**: "Firestore can only be used on the client side" during build
- **Cause**: Server-side code trying to access Firestore
- **Fix**: Already handled - all Firestore access is now client-only

## 🎯 Next Steps

1. **Run the diagnostic** to identify your specific issue
2. **Check the console** for detailed error messages
3. **Verify Firestore rules** are deployed
4. **Ensure user document exists** in Firestore
5. **Check organization membership** if accessing portal features

## 📞 Still Having Issues?

If the error persists:

1. Share the output from `diagnoseFirebasePermissions()`
2. Check which specific collection is throwing the error
3. Verify your user ID matches in Auth and Firestore
4. Ensure Firestore rules are deployed and match `firestore.rules`
