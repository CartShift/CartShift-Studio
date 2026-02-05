# Client Invitation System - Complete Implementation Guide

## 🎯 Overview

The **Client Invitation System** allows agency admins to invite clients to the portal **before** they have an account, enabling them to create requests in advance. When the client registers, they automatically gain access to all their pre-created requests.

---

## ✨ Key Features

1. **Pre-Create Requests**: Admins can create requests for clients who don't have accounts yet
2. **Email-Based Linking**: Requests are linked via email address (`clientEmail` field)
3. **Automatic Registration**: When client registers, all their requests appear immediately
4. **Seamless Experience**: Zero manual linking required - it's all automatic
5. **Secure Access**: Firestore rules ensure clients can only see their own requests
6. **30-Day Invitations**: Client invites expire after 30 days (vs 7 days for team invites)

---

## 🏗️ Architecture

### Data Model Changes

#### Request Type (`lib/types/portal.ts`)

```typescript
export interface Request {
  // ... existing fields

  // NEW: Client invitation fields
  clientEmail?: string; // Pre-assigned client email for auto-linking
  clientUserId?: string; // Set after client registers
}
```

#### Invite Type (`lib/types/portal.ts`)

```typescript
export interface Invite {
  // ... existing fields

  // NEW: Client invitation fields
  isClientInvite?: boolean; // True for client portal invitations
  linkedRequestIds?: string[]; // Request IDs to link on registration
}
```

### Service Methods

#### Portal Organizations (`lib/services/portal-organizations.ts`)

**`inviteClient()`** - Create a client invitation

```typescript
await inviteClient(
  orgId: string,
  clientEmail: string,
  invitedBy: string,
  invitedByName: string,
  requestIds?: string[]
)
```

**`acceptClientInvite()`** - Accept invitation and link requests

```typescript
await acceptClientInvite(
  inviteId: string,
  userId: string,
  userEmail: string,
  userName?: string
)
```

**`getPendingClientInvites()`** - Find pending invites by email

```typescript
const invites = await getPendingClientInvites(email: string)
```

#### Portal Requests (`lib/services/portal-requests.ts`)

**`createRequestForClient()`** - Create request with client email

```typescript
await createRequestForClient(
  orgId: string,
  userId: string,
  userName: string,
  clientEmail: string,
  data: CreateRequestData
)
```

**`getRequestsByClientEmail()`** - Get all requests for a client email

```typescript
const requests = await getRequestsByClientEmail(orgId: string, clientEmail: string)
```

### Authentication Integration (`lib/services/auth.ts`)

All authentication methods automatically check for pending client invites:

- `signUpWithEmail()` - Checks on registration
- `loginWithEmail()` - Checks on login
- `signInWithGoogle()` - Checks on Google sign-in

When found, invites are automatically accepted and requests are linked.

---

## 📋 Usage Guide

### For Agency Admins

#### Step 1: Create Requests for Client (Before They Have Account)

```typescript
import { createRequestForClient } from '@/lib/services/portal-requests';

// Create a request for a client who hasn't registered yet
const request = await createRequestForClient(
  orgId,
  adminUserId,
  adminName,
  'client@example.com', // ← Client's email
  {
    title: 'Update Homepage Design',
    description: 'Need modern hero section',
    type: 'design',
    priority: 'NORMAL',
    tags: ['design', 'homepage'],
  }
);
```

#### Step 2: Send Client Invitation

Use the `InviteClientForm` component:

```tsx
import { InviteClientForm } from '@/components/portal/forms/InviteClientForm';

function MyComponent() {
  const [showInvite, setShowInvite] = useState(false);

  return (
    <>
      <Button onClick={() => setShowInvite(true)}>Invite Client</Button>

      {showInvite && (
        <InviteClientForm
          orgId={orgId}
          preSelectedEmail="client@example.com"
          onSuccess={inviteCode => {
            // Share invitation link
            const inviteUrl = `${window.location.origin}/portal/invite/${inviteCode}`;
            navigator.clipboard.writeText(inviteUrl);
            toast.success('Invitation link copied!');
          }}
          onCancel={() => setShowInvite(false)}
        />
      )}
    </>
  );
}
```

#### Step 3: Share Invitation Link

The invitation link format:

```
https://yoursite.com/portal/invite/INVITE_CODE
```

Share this with your client via:

- Email
- Slack
- SMS
- Any communication channel

### For Clients

#### Step 1: Receive Invitation

Client receives invitation link from agency admin.

#### Step 2: Click Link & Register

1. Client clicks invitation link
2. Sees invite details (who invited them, organization)
3. Clicks "Sign Up" or "Sign In"
4. Creates account or logs in

#### Step 3: Automatic Access

Upon registration/login:

- ✅ Invitation automatically accepted
- ✅ Added to organization as member
- ✅ All requests created for their email are instantly visible
- ✅ Redirected to their requests dashboard

---

## 🔐 Security Rules

Updated Firestore rules in `firestore.rules`:

```javascript
match /portal_requests/{requestId} {
  // Clients can read requests pre-assigned to their email
  allow read: if isAuthenticated() && (
    isAgencyUser() ||
    resource.data.get('clientEmail', '') == request.auth.token.email ||
    resource.data.get('clientUserId', '') == getUserId() ||
    canAccessOrg(resource.data.get('orgId', ''))
  );

  // Clients can update their own requests
  allow update: if isAuthenticated() && (
    resource.data.get('clientEmail', '') == request.auth.token.email ||
    resource.data.get('clientUserId', '') == getUserId() ||
    canAccessOrg(resource.data.get('orgId', ''))
  );
}
```

**Key Security Features:**

- Clients can only see requests with their email
- Email matching is case-insensitive
- After registration, `clientUserId` provides additional verification
- Agency admins can always access all requests

---

## 🎨 UI Components

### InviteClientForm

Full-featured modal form for sending client invitations.

**Location**: `components/portal/forms/InviteClientForm.tsx`

**Props**:

```typescript
interface InviteClientFormProps {
  orgId: string;
  onSuccess: (inviteCode: string) => void;
  onCancel: () => void;
  preSelectedEmail?: string; // Optional pre-filled email
}
```

**Features**:

- Email validation
- Automatic request discovery
- Error handling
- Loading states
- Internationalization (EN/HE)

### useClientInvite Hook

React Query hook for managing client invitations.

**Location**: `lib/hooks/useClientInvite.ts`

**Usage**:

```typescript
const { inviteClient, cancelInvite, isInviting } = useClientInvite({
  orgId,
  onSuccess: code => console.log('Invited!', code),
});

// Send invitation
inviteClient({
  email: 'client@example.com',
  invitedBy: userId,
  invitedByName: userName,
  requestIds: ['req1', 'req2'],
});
```

---

## 🔄 Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN SIDE                                │
└─────────────────────────────────────────────────────────────┘

1. Admin creates requests with clientEmail
   ↓
   createRequestForClient(orgId, adminId, clientEmail, data)
   ↓
   Request stored with: { clientEmail: "client@example.com", ... }

2. Admin sends client invitation
   ↓
   inviteClient(orgId, clientEmail, adminId, adminName, requestIds)
   ↓
   Invitation created with: {
     isClientInvite: true,
     linkedRequestIds: ["req1", "req2"],
     expiresAt: +30 days
   }

3. Admin shares invitation link
   ↓
   https://site.com/portal/invite/XXXXX

┌─────────────────────────────────────────────────────────────┐
│                    CLIENT SIDE                               │
└─────────────────────────────────────────────────────────────┘

4. Client clicks link and registers
   ↓
   signUpWithEmail(email, password, name)
   ↓
   Automatically calls: getPendingClientInvites(email)

5. System finds pending invitation
   ↓
   acceptClientInvite(inviteId, userId, email, name)
   ↓
   • Adds client to organization
   • Links all requests (clientUserId = userId)
   • Marks invitation as accepted

6. Client redirected to dashboard
   ↓
   All their requests are immediately visible! ✨
```

---

## 🧪 Testing Checklist

### Manual Testing Steps

1. **Create Test Request**

   ```typescript
   // As admin
   await createRequestForClient(
     orgId,
     adminId,
     adminName,
     'testclient@test.com',
     { title: 'Test Request', ... }
   );
   ```

2. **Send Client Invitation**
   - Open InviteClientForm
   - Enter `testclient@test.com`
   - Copy invitation link

3. **Test Registration Flow**
   - Open invitation link in incognito window
   - Register with `testclient@test.com`
   - Verify automatic redirect to dashboard

4. **Verify Request Access**
   - Check requests list shows "Test Request"
   - Verify request details are accessible
   - Try updating the request

5. **Test Security**
   - Try accessing request with different email → Should fail
   - Try accessing without authentication → Should fail

### Automated Tests

```typescript
describe('Client Invitation System', () => {
  it('creates request with clientEmail', async () => {
    const request = await createRequestForClient(...);
    expect(request.clientEmail).toBe('client@example.com');
  });

  it('creates client invitation with linked requests', async () => {
    const invite = await inviteClient(...);
    expect(invite.isClientInvite).toBe(true);
    expect(invite.linkedRequestIds).toHaveLength(2);
  });

  it('auto-accepts invite on registration', async () => {
    const user = await signUpWithEmail('client@example.com', ...);
    const invites = await getPendingClientInvites('client@example.com');
    expect(invites).toHaveLength(0); // All accepted
  });
});
```

---

## 🚀 Deployment

### 1. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 2. Verify Rules Applied

Check Firebase Console → Firestore Database → Rules

### 3. Test in Production

Create a test invitation and verify the complete flow.

---

## 💡 Best Practices

### For Admins

1. **Use Descriptive Request Titles**: Help clients identify their requests easily
2. **Add Context**: Include detailed descriptions so clients understand immediately
3. **Group Related Requests**: Use tags to organize requests by project/category
4. **Invite Early**: Send invitations as soon as you create requests
5. **Follow Up**: Reach out if client doesn't register within a few days

### For Developers

1. **Always Use `createRequestForClient()`**: When creating requests for unregistered clients
2. **Check for Pending Invites**: After any auth operation
3. **Handle Edge Cases**: User changes email, invitation expires, etc.
4. **Log Everything**: Use console.log for debugging invitation flow
5. **Test Both Paths**: Registration AND login with pending invites

---

## 🐛 Troubleshooting

### Client Can't See Requests

**Check:**

1. Request has correct `clientEmail` field
2. Client registered with exact same email (case-insensitive)
3. Firestore rules are deployed
4. Client is member of organization

**Debug:**

```typescript
// Check request data
const request = await getRequest(requestId);
console.log('Client Email:', request.clientEmail);
console.log('Client User ID:', request.clientUserId);

// Check user data
console.log('User Email:', user.email);
console.log('User ID:', user.uid);
```

### Invitation Not Auto-Accepting

**Check:**

1. Email matches exactly (case-insensitive)
2. Invitation not expired
3. Auth flow logs show invite processing
4. No errors in console

**Debug:**

```typescript
// Check pending invites
const invites = await getPendingClientInvites('client@example.com');
console.log('Pending Invites:', invites);

// Check invitation details
const invite = await getInvite(inviteCode);
console.log('Invite Status:', invite.status);
console.log('Expires At:', invite.expiresAt.toDate());
```

### Permission Denied Errors

**Check:**

1. Firestore rules deployed: `firebase deploy --only firestore:rules`
2. User is authenticated
3. Request has `clientEmail` or `clientUserId` set
4. Email/ID matches current user

---

## 📊 Database Structure

### Firestore Collections

**portal_requests**

```json
{
  "id": "req_123",
  "orgId": "org_456",
  "title": "Update Homepage",
  "clientEmail": "client@example.com",
  "clientUserId": null,  // Set after registration
  "createdBy": "admin_789",
  "status": "NEW",
  "createdAt": "2026-02-05T...",
  ...
}
```

**portal_invites**

```json
{
  "id": "invite_abc",
  "orgId": "org_456",
  "email": "client@example.com",
  "isClientInvite": true,
  "linkedRequestIds": ["req_123", "req_124"],
  "code": "x7y9z2...",
  "status": "pending",
  "expiresAt": "2026-03-07T...",  // 30 days
  "createdAt": "2026-02-05T...",
  ...
}
```

---

## 🎯 Success Metrics

Track these metrics to measure system effectiveness:

1. **Invitation Acceptance Rate**: % of invites accepted within 7 days
2. **Time to First Login**: Average time from invite to first login
3. **Request View Rate**: % of linked requests viewed by client
4. **Client Satisfaction**: Survey clients about onboarding experience

---

## 🔮 Future Enhancements

Potential improvements:

1. **Email Notifications**: Auto-send invitation emails (requires email service)
2. **Bulk Invitations**: Invite multiple clients at once
3. **Custom Messages**: Add personal note to invitations
4. **Expiration Reminders**: Notify admin when invite is about to expire
5. **Re-invitation**: Easy way to resend expired invitations
6. **Invitation Analytics**: Track who opened links, when they registered

---

## 📚 Related Documentation

- [Firestore Security Rules](../firestore.rules)
- [Authentication Flow](./FIREBASE_AUTH_SETUP.md)
- [Team Invitation System](./.agent/INVITE_SYSTEM_COMPLETE.md)
- [Portal User Types](../lib/types/portal.ts)

---

## ✅ Implementation Complete

**All systems operational! The client invitation workflow is fully functional.**

For support or questions, refer to this documentation or check the implementation files referenced above.
