# RecallIQ — Clerk Session Token Template

To ensure the `role` field from Public Metadata is always available in 
the JWT session claims (required for the admin proxy guard), configure 
a custom session token template in your Clerk dashboard:

## Steps

1. Go to: https://dashboard.clerk.com
2. Select your RecallIQ app
3. Navigate to: **Configure → Sessions → Customize session token**
4. Enable "Customize session token"
5. Paste the following JSON template:

```json
{
  "publicMetadata": "{{user.public_metadata}}",
  "role": "{{user.public_metadata.role}}"
}
```

This injects both:
- `sessionClaims.publicMetadata.role` — the full metadata object
- `sessionClaims.role` — a shorthand top-level claim

The proxy.ts middleware checks both paths, so either format works.

## Why This Is Needed

By default, Clerk's JWT only includes: userId, sessionId, iat, exp.
Public Metadata is NOT included unless you configure a template.
Without this, `sessionClaims.publicMetadata` is `undefined` at runtime,
even if the metadata is correctly set in the Clerk dashboard.

## After Saving

Sign out and sign back in. The new token will include the role claim.
The proxy middleware will then correctly allow access to /admin.
