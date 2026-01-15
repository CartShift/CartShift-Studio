# Firebase Permission Error Fix Guide

## ❌ The Error

```
Missing or insufficient permissions
```

## ✅ Root Causes & Solutions

Your Firestore rules require **authentication** and **organization membership**. The error occurs when:

### 1. **User Not Authenticated** (Most Common)

- You're accessing Firestore before signing in
- Auth state hasn't loaded yet
- Session expired

**Fix:**

```typescript
// Always check auth state before Firestore access
import { getFirebaseAuth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const auth = getFirebaseAuth();
onAuthStateChanged(auth, async user => {
  if (user) {
    // Now safe to access Firestore
    const db = getFirestoreDb();
    // ... proceed with queries
  } else {
    console.log('User not authenticated');
    // Redirect to login or show auth UI
  }
});
```

### 2. **User Not in Organization**

- User exists but has no `portal_members` document linking them to an org
- The organization doesn't exist in Firestore

**Fix: Create Organization & Membership**

```typescript
// In Firebase Console or admin script:
// 1. Create portal_organizations doc
{
  id: "org-id-here"
  data: {
    name: "Your Company",
    createdBy: "user-id-here",
    createdAt: timestamp,
    updatedAt: timestamp
  }
}

// 2. Create portal_members doc
{
  id: "org-id-here_user-id-here"  // IMPORTANT: Must follow this format
  data: {
    orgId: "org-id-here",
    userId: "user-id-here",
    email: "user@example.com",
    role: "owner",
    createdAt: timestamp,
    updatedAt: timestamp
  }
}

// 3. Create portal_users doc
{
  id: "user-id-here"
  data: {
    email: "user@example.com",
    name: "User Name",
    organizations: ["org-id-here"],
    createdAt: timestamp,
    updatedAt: timestamp
  }
}
```

### 3. **Client-Side Code Accessing Firestore Too Early**

The most common mistake in your code.

**Current Problem:**

```typescript
// ❌ WRONG - This happens before auth is ready
const db = getFirestoreDb();
const snapshot = await getDoc(doc(db, 'portal_users', userId));
```

**Fix:**

```typescript
// ✅ CORRECT - Wait for auth first
import { waitForAuth } from '@/lib/firebase';

export async function getUserData(userId: string) {
  await waitForAuth(); // Wait for auth to be ready
  const db = getFirestoreDb();
  const snapshot = await getDoc(doc(db, 'portal_users', userId));
  return snapshot.data();
}
```

---

## 🔍 Diagnostic Steps

### Step 1: Check Authentication

Open your browser console and run:

```javascript
import { getAuth } from 'firebase/auth';
const auth = getAuth();
console.log('Current user:', auth.currentUser);
console.log('User ID:', auth.currentUser?.uid);
console.log('Email:', auth.currentUser?.email);
```

**Expected Result:**

- If `auth.currentUser` is `null` → **You're not signed in** (Fix: Sign in)
- If `auth.currentUser` has a `uid` → **You're signed in** (Proceed to Step 2)

### Step 2: Check User Document

```javascript
import { getFirestore, doc, getDoc } from 'firebase/firestore';
const db = getFirestore();
const userDoc = await getDoc(doc(db, 'portal_users', auth.currentUser.uid));
console.log('User document exists:', userDoc.exists());
console.log('User data:', userDoc.data());
```

**Expected Result:**

- Document exists with email, name, and organizations array
- If missing → **Create user document** (See "Create Organization" section)

### Step 3: Check Organization Membership

```javascript
const orgId = userDoc.data().organizations[0]; // Get first org
const memberId = `${orgId}_${auth.currentUser.uid}`;
const memberDoc = await getDoc(doc(db, 'portal_members', memberId));
console.log('Member document exists:', memberDoc.exists());
console.log('Member data:', memberDoc.data());
```

**Expected Result:**

- Document exists with orgId, role, email
- If missing → **Create member document** (See "Create Organization" section)

---

## 🚀 Deploy Updated Rules

Your Firestore rules have been updated with better null-safety checks.

**Deploy them:**

### Option 1: Firebase Console (Web)

1. Go to https://console.firebase.google.com
2. Select your project
3. Go to **Firestore Database** → **Rules**
4. Copy entire contents of `firestore.rules`
5. Paste and click **"Publish"**

### Option 2: Firebase CLI (Recommended)

```bash
# Login if needed
firebase login

# Deploy rules
firebase deploy --only firestore:rules

# Verify deployment
firebase rules:test
```

---

## 🛠️ Common Fixes in Your Code

### For Components Reading Portal Data

**Before (❌ Causes permission errors):**

```typescript
export default function Component() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const db = getFirestoreDb();
    getDoc(doc(db, 'portal_users', userId)).then(doc => {
      setData(doc.data());
    });
  }, []);
}
```

**After (✅ Waits for auth):**

```typescript
'use client';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useEffect, useState } from 'react';
import { getFirestoreDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function Component() {
  const { user, loading } = usePortalAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!user) return; // Don't query if not authenticated

    const db = getFirestoreDb();
    getDoc(doc(db, 'portal_users', user.uid)).then(docSnap => {
      if (docSnap.exists()) {
        setData(docSnap.data());
      }
    }).catch(error => {
      console.error('Permission error:', error.message);
      // Handle error - could be missing org membership
    });
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;
  if (!data) return <div>No data found</div>;

  return <div>{/* Render data */}</div>;
}
```

### For Cloud Functions Accessing Firestore

If you're calling functions that access Firestore, ensure the user's ID token is sent:

```typescript
// Client side: Send auth token with request
const user = getAuth().currentUser;
if (user) {
  const token = await user.getIdToken();
  const response = await fetch('/api/endpoint', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
```

```typescript
// Server side: Verify token and get user ID
import { admin } from 'firebase-admin';

export async function handler(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return { error: 'Unauthorized' };
  }

  const decoded = await admin.auth().verifyIdToken(token);
  const userId = decoded.uid;

  // Now use userId with Firestore
  const db = admin.firestore();
  const userDoc = await db.collection('portal_users').doc(userId).get();
}
```

---

## 📋 Quick Checklist

- [ ] Rules deployed with `firebase deploy --only firestore:rules`
- [ ] User is authenticated (`auth.currentUser` is not null)
- [ ] User document exists in `portal_users` collection
- [ ] Member document exists in `portal_members` collection
- [ ] Member document ID format: `{orgId}_{userId}`
- [ ] Organization document exists in `portal_organizations` collection
- [ ] All Firestore queries wrapped with auth checks
- [ ] Using `usePortalAuth()` hook in client components
- [ ] Calling `waitForAuth()` before Firestore access in non-React code

---

## ✨ What Changed

### In `firestore.rules`:

1. Added `resource == null` checks to prevent errors on non-existent docs
2. Improved organization read access to include ownership checks
3. Better member document access control

These changes make the rules more robust without weakening security.

---

## 🚨 If Still Getting Errors

1. **Check console for specific collection:**
   - "Missing or insufficient permissions: Missing permissions for resource..." tells you which collection
   - Add rule for that collection if needed

2. **Enable debug logging:**

   ```typescript
   import { connectFirestoreEmulator } from 'firebase/firestore';
   if (location.hostname === 'localhost') {
     connectFirestoreEmulator(db, 'localhost', 8080);
   }
   ```

3. **Run diagnostic script** from browser console
4. **Check Firebase Console** for recent rule deployments
5. **Verify project ID** matches in env vars and rules

---

## 📞 Support

If you're still stuck:

1. Run the diagnostic commands above and share the output
2. Check which specific collection is throwing the error
3. Verify the error isn't from an API/Cloud Function (different rules)
4. Make sure rules are fully deployed (can take 1-2 minutes)
