# Client Invitation - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 2. Create Request for Client (Before They Register)

```typescript
import { createRequestForClient } from '@/lib/services/portal-requests';

const request = await createRequestForClient(
  orgId,
  yourUserId,
  yourName,
  'client@example.com', // ← Client email
  {
    title: 'Website Redesign',
    description: 'Modern homepage with hero section',
    type: 'design',
    priority: 'HIGH',
    tags: ['design'],
  }
);
```

### 3. Send Invitation

```typescript
import { inviteClient } from '@/lib/services/portal-organizations';
import { getRequestsByClientEmail } from '@/lib/services/portal-requests';

// Get all requests for this client
const clientRequests = await getRequestsByClientEmail(orgId, 'client@example.com');

// Send invitation
const invite = await inviteClient(
  orgId,
  'client@example.com',
  yourUserId,
  yourName,
  clientRequests.map(r => r.id)
);

// Share this link with client
const inviteUrl = `${window.location.origin}/portal/invite/${invite.code}`;
console.log('Share this:', inviteUrl);
```

### 4. Client Registers → Automatic Access! ✨

When client clicks link and registers:

- ✅ Added to your organization
- ✅ All requests instantly visible
- ✅ Zero manual setup needed

---

## 🎯 Common Use Cases

### Admin Creating Multiple Requests Before Inviting

```typescript
// 1. Create multiple requests
const requests = await Promise.all([
  createRequestForClient(orgId, adminId, adminName, 'client@test.com', {
    title: 'Homepage Design',
    type: 'design',
    priority: 'HIGH',
  }),
  createRequestForClient(orgId, adminId, adminName, 'client@test.com', {
    title: 'SEO Optimization',
    type: 'optimization',
    priority: 'NORMAL',
  }),
  createRequestForClient(orgId, adminId, adminName, 'client@test.com', {
    title: 'Mobile Responsiveness',
    type: 'bug',
    priority: 'URGENT',
  }),
]);

// 2. Send one invitation for all requests
const invite = await inviteClient(
  orgId,
  'client@test.com',
  adminId,
  adminName,
  requests.map(r => r.id)
);
```

### Using the UI Component

```tsx
'use client';

import { useState } from 'react';
import { InviteClientForm } from '@/components/portal/forms/InviteClientForm';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export function MyAdminPage({ orgId }) {
  const [showInvite, setShowInvite] = useState(false);

  return (
    <>
      <Button onClick={() => setShowInvite(true)}>Invite Client</Button>

      {showInvite && (
        <InviteClientForm
          orgId={orgId}
          preSelectedEmail="client@example.com"
          onSuccess={code => {
            const url = `${window.location.origin}/portal/invite/${code}`;
            navigator.clipboard.writeText(url);
            toast.success('Invitation link copied to clipboard!');
            setShowInvite(false);
          }}
          onCancel={() => setShowInvite(false)}
        />
      )}
    </>
  );
}
```

### Auto-Linking on Any Auth Method

The system automatically checks for pending invites on:

```typescript
// Email/Password Registration
await signUpWithEmail('client@example.com', 'password', 'John Doe');
// → Auto-accepts invites

// Email/Password Login
await loginWithEmail('client@example.com', 'password');
// → Auto-accepts invites

// Google Sign-In
await signInWithGoogle();
// → Auto-accepts invites
```

---

## 🔍 Quick Debugging

### Check if Request is Linked Correctly

```typescript
const request = await getRequest(requestId);
console.log({
  clientEmail: request.clientEmail, // Should match client's email
  clientUserId: request.clientUserId, // null before registration, userId after
  orgId: request.orgId, // Should match your organization
});
```

### Check if Invitation Exists

```typescript
const invites = await getPendingClientInvites('client@example.com');
console.log('Pending invites:', invites.length);
invites.forEach(inv => {
  console.log({
    code: inv.code,
    linkedRequests: inv.linkedRequestIds?.length || 0,
    expiresAt: inv.expiresAt.toDate(),
  });
});
```

### Verify Firestore Rules Work

Test in Firestore Console:

1. Create a request with `clientEmail: "test@test.com"`
2. Log in as `test@test.com`
3. Try to read the request → Should succeed
4. Try to read a request with different `clientEmail` → Should fail

---

## 📋 Checklist

Before going live:

- [ ] Firestore rules deployed
- [ ] Created test request with `clientEmail`
- [ ] Sent test invitation
- [ ] Tested registration flow in incognito
- [ ] Verified client can see requests immediately
- [ ] Tested permission boundaries (can't see other client's requests)
- [ ] Added UI component to admin panel
- [ ] Translated invitation messages (if using i18n)

---

## ⚠️ Common Mistakes

### ❌ Using Regular `createRequest()` for Clients

```typescript
// WRONG - Client won't be linked
await createRequest(orgId, adminId, adminName, {
  title: 'Request for client',
});
```

```typescript
// CORRECT - Client will be auto-linked
await createRequestForClient(orgId, adminId, adminName, 'client@email.com', {
  title: 'Request for client',
});
```

### ❌ Forgetting to Deploy Rules

```bash
# Must run this after changing firestore.rules!
firebase deploy --only firestore:rules
```

### ❌ Case-Sensitive Email Matching

```typescript
// WRONG - Won't match
createRequestForClient(..., 'Client@Example.COM', ...)
inviteClient(..., 'client@example.com', ...)

// CORRECT - Both normalized to lowercase internally
createRequestForClient(..., 'client@example.com', ...)
inviteClient(..., 'client@example.com', ...)
```

---

## 🎉 Success!

That's it! Your client invitation system is ready to use.

**Full documentation**: [CLIENT_INVITATION_SYSTEM.md](./CLIENT_INVITATION_SYSTEM.md)
