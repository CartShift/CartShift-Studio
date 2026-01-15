# Quick Fix Guide: Firebase Permission Errors

## 🚨 If You're Seeing "Missing or insufficient permissions" in Console

### Step 1: Run the Diagnostic (30 seconds)

Open your browser console and run:

```javascript
const { diagnoseFirebasePermissions } = await import('/lib/utils/firebase-diagnostics.js');
await diagnoseFirebasePermissions();
```

This will tell you exactly what's wrong.

### Step 2: Common Fixes Based on Diagnostic Results

#### ❌ "No authenticated user found"

**Fix:** Sign in to your account

#### ❌ "User document does not exist in Firestore"

**Fix:**

1. Sign out and sign back in (this creates the document automatically)
2. Or manually create it in Firebase Console:
   - Collection: `portal_users`
   - Document ID: `{your-user-id}` (from Auth)
   - Data: `{ email, name, accountType: "CLIENT", isAgency: false, organizations: [] }`

#### ❌ "Member document missing for org"

**Fix:**

1. Accept the organization invite if you have one
2. Or manually create the member document:
   - Collection: `portal_members`
   - Document ID: `{orgId}_{userId}` (MUST be this exact format)
   - Data: `{ orgId, userId, email, role: "member" }`

#### ❌ "Permission denied accessing [collection]"

**Fix:**

1. Deploy Firestore rules: `firebase deploy --only firestore:rules`
2. Verify your user has the required permissions in Firestore rules
3. Check if you're a member of the organization

### Step 3: If Error Persists

1. **Check which collection is failing:**
   - Look at the full error message in console
   - It will say something like "Missing permissions for resource: projects/.../databases/.../documents/portal_organizations/..."

2. **Verify Firestore Rules:**

   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Clear browser cache:**

   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

4. **Check your user in Firebase Console:**
   - Go to Authentication → Users
   - Find your user
   - Copy the UID
   - Go to Firestore → Check if `portal_users/{uid}` exists

## ✅ Expected Behavior

- **During login/logout:** Permission errors are automatically suppressed (this is normal)
- **On login/signup pages:** Permission errors are suppressed (expected)
- **After authentication:** All Firestore operations should work if you have proper permissions

## 🎯 Still Stuck?

Share the output from `diagnoseFirebasePermissions()` and we can help identify the specific issue.
