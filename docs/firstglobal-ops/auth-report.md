# Staff authentication implementation

T02 server boundary lives in `libs/server/src/auth`. `createAuthRouter(config)`
mounts at `/api/v1/auth` after the JSON size limiter. Config requires environment,
exact allowed origins, web/mobile callback and exchange URLs, three independent
32-byte keys (encryption, CSRF, rate limit), provider/store and `resolveUser(jwt)`.
The latter must use the staff JWT to read current internal roles, including a
profile with no roles; Supabase metadata never grants permissions.

Factories `createSupabaseAuthProvider(url, publicKey, serviceKey)` and
`createSupabaseAuthStore(url, serviceKey)` use stateless SDK clients and fixed
service-only RPCs. Email, OTP, human POST link confirmation, PKCE exchange,
refresh, logout and CSRF routes return the common envelope and no-store.
Web refresh tokens only appear in Secure/HttpOnly/SameSite=Lax/Path=/ cookies.
Explicit development permits the documented non-Secure unprefixed cookie.

Login attempts expire in ten minutes. Tickets use 256-bit randomness, SHA-256
storage, sixty-second expiry and atomic consume after matching PKCE. Temporary
token pairs use AES-256-GCM with ticket hash as authenticated context. SQL
rate counters are atomic; keys are HMACs rather than raw email/IP values.
Run `store.cleanup()` through the server worker every minute to remove expired
attempts, ciphertext and counters. No persistent timer is installed here.

Verification: `NX_DAEMON=false npm exec -- nx run server:test --runInBand`
passed all three suites / sixteen tests on 2026-09-22. Ten authentication tests
exercise real Express HTTP with injected synthetic provider/persistence, checking
PKCE, wrong-email link, encrypted exchange, replay, expiry, CSRF/Origin, cookie
flags, no-role identity, ambiguous refresh credentials, generic rate failure,
late refresh failure and logout without a session. This is not live SQL/RLS,
SMTP, cross-tab browser or native callback verification.

Provisioning still required: organization's Supabase project URL/keys; independent
server keys; HTTPS origins and verified mobile App/Universal Links; custom SMTP,
verified sender/DNS, email template and redirect allowlist; JWT expiry 900 seconds;
worker schedule for cleanup. Template must render `{{ .RedirectTo }}#token_hash={{ .TokenHash }}`
and `{{ .Token }}`; RedirectTo contains the generated attemptId. Callback reads
and clears fragment, and posts only after human confirmation. Do not log callback
query/fragment, bodies, cookies, JWTs or RPC secrets. A different-device link
cannot exchange without original verifier; offer code on original device or restart.

Official SDK behavior checked against [verifyOtp](https://supabase.com/docs/reference/javascript/auth-verifyotp)
and [local sign-out](https://supabase.com/docs/reference/javascript/auth-admin-signout).
Revocation enforcement in protected operations remains the SQL active-session
helper's responsibility. Failed refresh never clears a potentially newer cookie.
