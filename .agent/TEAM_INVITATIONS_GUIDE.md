# Team Invitation System - Implementation Guide

## Current Status ✅

The team invitation functionality now includes:

- ✅ Creates invite records in Firestore
- ✅ Validates that the user isn't already a member
- ✅ Prevents duplicate invites
- ✅ Sets 7-day expiration
- ✅ **Automatic email sending via Resend**
- ✅ Copy link button for manual sharing

## Email System (Resend)

The email system uses **Resend** for transactional emails. When an invite is created in `portal_invites`, a Cloud Function automatically sends an invitation email.

### Setup Required

1. **Get Resend API Key:**
   - Sign up at https://resend.com (free tier: 3,000 emails/month)
   - Create an API key in the dashboard

2. **Add to Firebase Secrets:**

   ```bash
   firebase functions:secrets:set RESEND_API_KEY
   # Paste your API key when prompted
   ```

3. **Verify Domain (Recommended for Production):**
   - Add your domain in Resend dashboard
   - Configure DNS records
   - Update `from` address in `functions/emails/email-service.js`

### Email Templates

Templates are located in `functions/emails/`:

- `base.html` - Base layout wrapper
- `team_invite.html` - Team invitation
- `new_request.html` - New request notification
- `status_update.html` - Status change notification
- `quote_received.html` - Quote received
- `payment_receipt.html` - Payment confirmation
- `milestone_completed.html` - Milestone completion
- `new_comment.html` - New comment notification

### How It Works

1. When an invite is created in Firestore (`portal_invites` collection)
2. The `onTeamInviteCreated` Cloud Function triggers
3. It builds the email using the `team_invite.html` template
4. Sends via Resend API with retry logic
5. Logs failures to `email_failures` collection

### Testing

To test emails:

1. Create an invite from the Team page
2. Check Resend dashboard for delivery status
3. Check `email_failures` collection for any errors

## Architecture

```
User invites team member
        ↓
Firestore: portal_invites (create)
        ↓
Cloud Function: onTeamInviteCreated
        ↓
email-service.js → Resend API
        ↓
Email delivered to recipient
```

## Fallback: Manual Sharing

If Resend is not configured, invites still work via manual link sharing:

- Copy link button is always available
- User can share via any channel (Slack, WhatsApp, etc.)
- System logs `no_api_key` when email is skipped
