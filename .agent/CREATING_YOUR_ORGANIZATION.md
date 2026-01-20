# Creating Your First Organization

Since you're working with the portal, you'll need to create a real organization in Firestore. Here are your options:

## Option 1: Use the Signup Flow (Recommended)

1. Go to `/portal/signup`
2. Sign up with your email
3. This will automatically create:
   - Your user account
   - Your first organization
   - Set you as the owner

## Option 2: Manually Create in Firebase Console

1. Open Firebase Console: https://console.firebase.google.com
2. Go to your project → Firestore Database
3. Create a new document in the `portal_organizations` collection:

```
Collection: portal_organizations
Document ID: your-org-id (e.g., "my-company")

Fields:
- name: "Your Company Name"
- slug: "your-company-slug"
- logoUrl: "" (optional)
- website: "https://yourwebsite.com" (optional)
- industry: "Your Industry" (optional)
- bio: "About your company" (optional)
- createdAt: [Current timestamp]
- updatedAt: [Current timestamp]
```

4. Create your user document in `portal_users`:

```
Collection: portal_users
Document ID: your-user-id

Fields:
- email: "your@email.com"
- name: "Your Name"
- organizations: ["your-org-id"]
- createdAt: [Current timestamp]
- updatedAt: [Current timestamp]
```

5. Add yourself as a member in `portal_members`:

```
Collection: portal_members

Fields:
- orgId: "your-org-id"
- userId: "your-user-id"
- email: "your@email.com"
- name: "Your Name"
- role: "owner"
- joinedAt: [Current timestamp]
```

## Option 3: Use Firebase Admin SDK (For Development)

If you want to seed development data, you can create a script using Firebase Admin SDK to populate test organizations.

## Why "default-org" Doesn't Work

The "default-org" ID is used for static site generation during the build process. It's a placeholder and doesn't exist in your Firestore database. This is intentional - it allows the build to succeed without requiring actual data.

When you navigate to `/portal/org/default-org/settings`, you're viewing a static page that was generated at build time. To work with real data, you need to either:

1. Sign up and create a real organization
2. Navigate directly to your organization's URL: `/portal/org/YOUR-ORG-ID/settings`

## Next Steps

Once you have a real organization:

- You can invite team members
- Upload files
- Create requests
- All CRUD operations will work perfectly!

The portal is fully functional - it just needs real data to work with instead of the build-time placeholder.
