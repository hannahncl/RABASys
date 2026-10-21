# Security design

## Authentication and passwords

Passwords are stored with bcrypt at cost 12. Passwords, reset tokens, OTP values, and secrets are never written to audit records. Production deployments must set a strong `JWT_SECRET`; the server refuses to use an implicit secret in production.

## Sessions

The API issues a signed JWT containing an account and session ID. A session row stores only the SHA-256 hash of the complete bearer token, never the token itself. Every protected request verifies the JWT, its matching active session row, database expiry, account status, and current role. Sessions expire with `JWT_EXPIRES_IN` (eight hours by default), are revoked on logout, can be revoked individually or all at once, and all are revoked after a password reset.

The current frontend keeps the bearer token in local storage for compatibility with its existing API. For a public production deployment, migrate it to a Secure, HttpOnly, SameSite cookie and add CSRF protection before relying on browser authentication.

## Authorization

Route handlers use `requireAuth` and `allowRoles` for server-side enforcement. The role used for authorization is read from the account database record on each authenticated request so a role change takes effect immediately rather than waiting for an old JWT to expire.

## Password reset

Reset requests return the same response whether or not an email exists. OTPs are random six-digit values, SHA-256 hashed in storage, expire after ten minutes, are single-use, and have a five-attempt limit. Requests are rate-limited per IP/email pair.

## Audit trail

`audit_log` is append-only at the application level. Each mutation records actor account, session, action, affected table and record, before/after values, time, client IP, and user agent. The audit serializer removes fields whose names contain password, token, OTP, or secret. Database credentials should grant the application account INSERT/SELECT access to `audit_log` and deny UPDATE/DELETE privileges to preserve the trail.

## Input handling

Authentication fields are validated with `express-validator`; route-specific business checks validate booking and status values. Database queries use parameterized values. Continue adding strict server-side schemas for every new endpoint and avoid rendering untrusted content as HTML.
