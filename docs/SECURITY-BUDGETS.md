# Request budgets

- Login: shared database counters allow 10 requests per network/account pair, 20 per account and 60 per network within a five-minute window. Existing authenticated sessions and logout are unaffected. Supabase's own limits remain in force.
- Identifiers are HMAC-SHA-256 digests using the existing server-only secret and separate contexts. Only Vercel's trusted ingress IP header is eligible. Other deployments share an unresolved-network bucket until a trusted ingress is implemented.
- PDF registration: Premium required, maximum five verifications per ten minutes per user, one active verification per user, and the existing 100-document quota checked before external work. A 90-second lease recovers from interrupted requests. Final inserts also serialize their quota check. All URL, byte and timeout restrictions remain intact.
- Database errors fail closed before login or PDF verification. Technical tables have RLS and no browser access; only the new service-role RPCs can reserve/release a budget.

## Deployment and rollback

Apply `20261024143000_security_request_budgets.sql` before publishing the application. Existing application versions remain compatible. No credentials or existing business data are migrated.

Validate with `node --test tests/security-budgets.test.mjs` and `node scripts/test-security-budgets-sql.mjs` (isolated fixtures inside a rolled-back transaction). Before applying the migration, append `--candidate` to the SQL test command.

Rollback the application deployment first if necessary. Leave the additive tables and RPCs in place; the old application does not call them. Do not drop them while any new application instance can still receive traffic. Reverting the security change restores the previous lack of application-level limits.

These limits reduce abuse, but cannot eliminate distributed attacks or replace hosted WAF, authentication and account-security settings. Account throttling can temporarily affect a legitimate account targeted by repeated attempts; the window is limited to five minutes.
