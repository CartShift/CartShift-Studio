# Firestore Permission Error Debugging Guide

## Current Status

✅ Firestore rules updated and deployed successfully
✅ Rules compiled without errors
⏳ Rules may take 1-2 minutes to fully propagate

## What Was Fixed

### Updated Collections:

1. **portal_requests** - Fixed read permissions to handle null resources
2. **portal_comments** - Added proper org membership validation
3. **portal_files** - Improved permission checks

### Key Changes:

```javascript
// Before (BROKEN):
allow read: if isAuthenticated() &&
  exists(/databases/$(database)/documents/portal_members/$(resource.data.orgId + '_' + getUserId()));

// After (FIXED):
allow read: if isAuthenticated() &&
  (resource == null || isOrgMember(resource.data.orgId));
```

## Frontend Permission Check Fix

### Issue: Access Restricted Error Despite Valid Membership

**Problem**: Users were seeing "Access Restricted" error even when they had valid membership documents in `portal_members`. This was caused by a mismatch between:

- **Frontend check**: Used `userData.organizations` array from `portal_users` document
- **Firestore rules**: Checked for membership document in `portal_members` collection

**Root Cause**: The `organizations` array in `portal_users` could be out of sync with actual membership documents, causing false negatives.

**Solution**: Updated permission checks in `PortalShell.tsx` and `DashboardClient.tsx` to verify membership directly from `portal_members` collection using `getMemberByUserId()`, matching what Firestore security rules do.

**Files Updated**:

- `components/portal/PortalShell.tsx` - Now checks membership via `getMemberByUserId()`
- `app/[locale]/portal/org/[orgId]/dashboard/DashboardClient.tsx` - Now checks membership via `getMemberByUserId()`

This ensures frontend permission checks are consistent with Firestore security rules.

## Still Getting Errors?

### Checklist:

#### 1. **Wait for Rule Propagation** ⏱️

- Firestore rule changes can take **1-2 minutes** to fully propagate
- Hard refresh your browser: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Clear browser cache if needed

#### 2. **Check Your Authentication** 🔐

Open browser DevTools → Application → Storage → IndexedDB → firebaseLocalStorage

**Look for:**

- `firebase:authUser:...` - Should exist and have a valid token
- Check if token is expired

**Fix:** Sign out and sign back in to refresh your authentication token

#### 3. **Verify Membership Document** 📋

The user must have a membership document in `portal_members` collection.

**Document ID format:** `{orgId}_{userId}`

**Check in Firebase Console:**

1. Go to Firestore Database
2. Navigate to `portal_members` collection
3. Look for document with ID: `default-org_{your-user-id}`

**If missing**, you need to create it or re-join the organization.

#### 4. **Check Browser Console** 🔍

Look for the exact error message:

```javascript
// Good errors to see (means rules are working):
FirebaseError: PERMISSION_DENIED: Missing or insufficient permissions

// With details like:
// - Collection: portal_requests
// - Path: portal_requests/{docId}
// - UserId: xyz123
```

**Copy the FULL error stack trace** - it will tell us exactly which query is failing.

#### 5. **Common Scenarios**

##### Scenario A: First-time user without org membership

**Symptom:** Can't access any portal pages
**Fix:** User needs to:

1. Be invited to an organization first
2. Accept the invite
3. This creates their membership document

##### Scenario B: User switched organizations

**Symptom:** Can access some orgs but not others
**Fix:** Verify membership document exists for the specific orgId

##### Scenario C: Stale auth token

**Symptom:** Random permission errors that come and go
**Fix:**

1. Sign out completely
2. Clear browser cache
3. Sign back in

##### Scenario D: Frontend permission check mismatch

**Symptom:** "Access Restricted" error even though membership document exists
**Fix:** This has been fixed in the codebase. The frontend now checks membership directly from `portal_members` collection, matching Firestore rules. If you still see this:

1. Hard refresh the browser (Ctrl+Shift+R / Cmd+Shift+R)
2. Clear browser cache
3. Verify membership document exists: `{orgId}_{userId}` in `portal_members` collection

## Quick Diagnostics

### Test 1: Check if you're authenticated

```javascript
// Run in browser console:
import { getAuth } from 'firebase/auth';
const auth = getAuth();
console.log('Current user:', auth.currentUser);
console.log('User ID:', auth.currentUser?.uid);
console.log('Email:', auth.currentUser?.email);
```

### Test 2: Check your organizations

```javascript
// Run in browser console (if you have dev tools access):
import { getFirestore, doc, getDoc } from 'firebase/firestore';
const db = getFirestore();
const userId = 'YOUR_USER_ID'; // Replace with actual ID from Test 1
const userDoc = await getDoc(doc(db, 'portal_users', userId));
console.log('User organizations:', userDoc.data()?.organizations);
```

### Test 3: Check membership

```javascript
// Replace with your actual values:
const orgId = 'default-org';
const userId = 'YOUR_USER_ID';
const memberId = `${orgId}_${userId}`;
const memberDoc = await getDoc(doc(db, 'portal_members', memberId));
console.log('Membership exists:', memberDoc.exists());
console.log('Membership data:', memberDoc.data());
```

## Need More Help?

Please provide:

1. **Full error message** from browser console (with stack trace)
2. **Which page** you're trying to access (URL)
3. **Your user ID** (from browser console: `getAuth().currentUser.uid`)
4. **Organization ID** you're trying to access
5. **Results** from the diagnostic tests above

## Emergency Fix: Temporarily Disable Rules

**⚠️ ONLY FOR TESTING - NOT FOR PRODUCTION**

If you need to test quickly, you can temporarily make rules more permissive:

```javascript
// In firestore.rules - TEMPORARY ONLY
match /portal_requests/{requestId} {
  allow read, write: if isAuthenticated(); // Very permissive!
}
```

Then deploy: `firebase deploy --only firestore:rules`

**Remember to revert this after testing!**
