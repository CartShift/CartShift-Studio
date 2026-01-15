# Firebase Setup & Permission Error Resolution Checklist

## 🚨 The Problem

You're getting **"Missing or insufficient permissions"** error. This usually means one of:

1. **Firebase is not initialized** (missing environment variables)
2. **Rules deny the access** (Firestore/Storage security rules)
3. **User is not authenticated** (not logged in)
4. **User doesn't belong to the organization** (missing portal_members document)

---

## ✅ STEP 1: Verify Environment Variables

### What You Need

Your Firebase project provides these values in the **Project Settings** → **General**:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Where to Get These Values

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**
3. **Click Settings icon** (⚙️) → **Project Settings**
4. **Scroll down to "Your apps"**
5. **Click the Web app** (looks like `</>`)
6. **Copy the config object** - it looks like:
   ```javascript
   const firebaseConfig = {
     apiKey: '...',
     authDomain: '...',
     projectId: '...',
     storageBucket: '...',
     messagingSenderId: '...',
     appId: '...',
   };
   ```

### How to Add to Your Project

Create `.env.local` in your project root:

```bash
# Copy the .env.example file
cp .env.example .env.local

# Edit .env.local with your Firebase values
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cartshift...firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cartshiftstudio
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cartshiftstudio.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456
```

### Verify It Works

1. **Stop your dev server** (Ctrl+C)
2. **Clear Node cache**: `rm -r .next` (or `rmdir /s /q .next` on Windows)
3. **Restart**: `npm run dev`
4. **Open browser console** (F12 → Console tab)
5. **Check for errors** about Firebase initialization

---

## ✅ STEP 2: Check Firestore Rules

Your current `firestore.rules` file has security rules. The issue is usually that these rules require:

1. **User must be authenticated**
2. **User must belong to organization** (have a `portal_members` document)

### View Your Rules

**Rules are in**: `firestore.rules`

### Deploy Rules to Firebase

The rules are already configured, but they need to be deployed:

**Option A: Using Firebase CLI (Recommended)**

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

**Option B: Manual (via Firebase Console)**

1. Go to **Firestore Database** → **Rules** tab
2. Copy content from `firestore.rules` file
3. Paste into the editor
4. Click **Publish**

### What the Rules Do

```firestore
// Only authenticated users can read portal_users documents
match /portal_users/{userId} {
  allow read: if isAuthenticated();
  allow write: if isAuthenticated() && request.auth.uid == userId;
}

// Only organization members can read portal_organizations
match /portal_organizations/{orgId} {
  allow read: if isAuthenticated() && (
    // User is org owner OR member
    resource.data.createdBy == getUserId() ||
    exists(/databases/$(database)/documents/portal_members/$(orgId + '_' + getUserId()))
  );
}
```

---

## ✅ STEP 3: Check Authentication

### Verify User is Logged In

Paste this in **browser console**:

```javascript
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';

const auth = getAuth();
console.log('Current user:', auth.currentUser);
console.log('User ID:', auth.currentUser?.uid);
console.log('Email:', auth.currentUser?.email);
```

**Expected output:**

```javascript
Current user: User {...}
User ID: "abc123def456..."
Email: "user@example.com"
```

**If you see `null`:**

- User is not logged in
- They need to sign up or log in first
- Direct them to `/portal/login` or `/portal/signup`

### Create Test User

1. Go to **Firebase Console** → **Authentication** → **Users** tab
2. Click **Add User**
3. Enter test email: `test@example.com`
4. Password: `Test123456!`
5. Click **Create User**
6. Go back to your app and log in with these credentials

---

## ✅ STEP 4: Check Organization & Membership

Once user is authenticated, they need to belong to an organization.

### Create an Organization

The app should auto-create this when user signs up, but if missing:

**In Firebase Console** → **Firestore** → **Collections**:

1. **Create collection**: `portal_organizations`
2. **Add document** with ID: `default-org`
   ```json
   {
     "name": "Test Organization",
     "createdBy": "USER_ID_HERE",
     "createdAt": "2024-01-01T00:00:00Z",
     "subscription": "pro",
     "maxMembers": 10
   }
   ```

### Create Membership

3. **Create collection**: `portal_members`
4. **Add document** with ID: `default-org_USER_ID_HERE`
   ```json
   {
     "userId": "USER_ID_HERE",
     "orgId": "default-org",
     "role": "owner",
     "joinedAt": "2024-01-01T00:00:00Z",
     "status": "active"
   }
   ```

### Update User Document

5. **In `portal_users` collection** → find user document → edit it
6. **Add field**: `organizations: ["default-org"]`

---

## ✅ STEP 5: Run Diagnostic

### Browser Console Diagnostic

1. **Open your app** in browser
2. **Press F12** to open Developer Tools
3. **Go to Console tab**
4. **Copy-paste this entire script:**

```javascript
(async function () {
  console.log('🔍 CartShift Firebase Diagnostic');
  console.log('='.repeat(50));

  const { getAuth } = window.firebase.auth;
  const { getFirestore, doc, getDoc } = window.firebase.firestore;

  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;

  // Test 1: Auth
  console.log('\n1. Authentication:');
  if (!user) {
    console.error('❌ NOT LOGGED IN');
    return;
  }
  console.log('✅ Logged in:', user.email);
  console.log('   UID:', user.uid);

  // Test 2: User Doc
  console.log('\n2. User Document:');
  try {
    const userDoc = await getDoc(doc(db, 'portal_users', user.uid));
    if (!userDoc.exists()) {
      console.error('❌ User document missing');
    } else {
      console.log('✅ User document exists');
      console.log('   Orgs:', userDoc.data().organizations);
    }
  } catch (e) {
    console.error('❌ Error:', e.message);
  }

  // Test 3: Org Access
  console.log('\n3. Organization Access:');
  try {
    const orgDoc = await getDoc(doc(db, 'portal_organizations', 'default-org'));
    if (!orgDoc.exists()) {
      console.error('❌ Org not found');
    } else {
      console.log('✅ Can read org:', orgDoc.data().name);
    }
  } catch (e) {
    console.error('❌ Error:', e.message);
  }

  console.log('\n' + '='.repeat(50));
})();
```

5. **Press Enter** and check the output

---

## 🚀 STEP 6: Test & Verify

### In Browser

1. **Reload the page**: F5
2. **Check browser console**: F12 → Console
3. **Look for any red error messages**
4. **Try accessing portal**: Navigate to `/portal`

### Expected Behavior

✅ **Success indicators:**

- No "Missing or insufficient permissions" errors
- Can see portal dashboard
- Can create requests/view requests
- Can upload files
- Can manage team members

❌ **If still failing:**

- Note the **exact error message**
- Note which **collection** the error mentions (e.g., "portal_requests")
- Check the **firestore.rules** for that collection
- See **troubleshooting section** below

---

## 🛠️ Troubleshooting Specific Collections

### "Missing or insufficient permissions" for `portal_requests`

Check rule in `firestore.rules`:

```firestore
match /portal_requests/{requestId} {
  allow read, write: if canAccessOrg(resource.data.orgId);
}
```

**Fix**: Make sure user has `canAccessOrg()` permission (member or owner)

### "Missing or insufficient permissions" for `portal_files`

Check rule in `firestore.rules`:

```firestore
match /portal_files/{fileId} {
  allow read, write: if canAccessOrg(resource.data.orgId);
}
```

**Fix**: Same as above - verify membership

### "Missing or insufficient permissions" for `portal_members`

This often means the member document ID is wrong.

**Correct format**: `{orgId}_{userId}`

**Example**: If orgId is "default-org" and userId is "abc123", the ID should be:

```
default-org_abc123
```

### "Missing or insufficient permissions" for Cloud Storage

Check `storage.rules`:

```
match /portal/{orgId}/{allPaths=**} {
  allow read, write: if request.auth.uid != null &&
    exists(/databases/$(database)/documents/portal_members/$(orgId + '_' + request.auth.uid));
}
```

**Fix**: Verify member document exists with correct ID format

---

## 📋 Quick Checklist

- [ ] `.env.local` file exists with all Firebase config variables
- [ ] Firebase Console shows your project
- [ ] Authentication enabled in Firebase
- [ ] Firestore database created
- [ ] Cloud Storage bucket created
- [ ] `firestore.rules` deployed
- [ ] `storage.rules` deployed
- [ ] Test user created in Firebase Authentication
- [ ] `portal_users` document exists for test user
- [ ] `portal_organizations` document exists with ID `default-org`
- [ ] `portal_members` document exists with ID `default-org_{userId}`
- [ ] Test user's `organizations` array includes `"default-org"`
- [ ] Can log in to portal
- [ ] No permission errors in console
- [ ] Can access dashboard/requests/files

---

## 🆘 Still Having Issues?

### Provide These Details

When asking for help, include:

1. **Exact error message** from console
2. **Which collection** causes the error (e.g., portal_requests)
3. **Your Firebase Project ID**
4. **Output of the diagnostic script** above
5. **Your `portal_members` document ID format**

### Common Mistakes

| Mistake                         | Fix                                           |
| ------------------------------- | --------------------------------------------- |
| Environment vars not loaded     | Restart dev server: `npm run dev`             |
| Rules not deployed              | Run: `firebase deploy --only firestore:rules` |
| Wrong member ID format          | Use: `{orgId}_{userId}`                       |
| User not in organizations array | Update `portal_users` document                |
| Member document missing         | Create it in Firestore console                |
| Org document missing            | Create `portal_organizations/{orgId}`         |
| Rules have typos                | Copy from `.firestore.rules` file             |

---

## 📚 Related Documentation

- [Firebase Auth Setup](./docs/FIREBASE_AUTH_SETUP.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Firestore Rules](./firestore.rules)
- [Storage Rules](./storage.rules)

---

**Last Updated**: January 2025
**Firebase Version**: v9.22.2+
**Next.js Version**: 16.0.10+
