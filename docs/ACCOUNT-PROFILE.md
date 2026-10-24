# Minha conta

Verified accounts, including the Free plan, may edit their private nickname, profile photo and reduced-motion preference. Study and Premium entitlements are unchanged. Nicknames are display names, not unique public handles, and do not affect login/email.

Profile data lives in `private.account_profiles`, protected by RLS and service-role-only RPCs. The server derives ownership from the verified session. The browser cannot specify a user ID. Avatar reads are authenticated and `private, no-store`; original files and filenames are not retained.

Uploads accept JPEG, PNG or WebP up to 2 MB and 16 megapixels. The server validates the bytes, rejects animations/SVG, strips metadata and produces a 256×256 WebP capped at 128 KB. The existing Sharp dependency is now explicit. Writes are limited to 20 per ten minutes per account, before image decoding. The image is bounded private database data, included in existing encrypted backups; no public storage bucket is created.

The reduced-motion preference is stored in the account and synchronized to the browser when the account panel loads. Its device copy applies across pages and tabs; operating-system reduced motion remains respected.

Apply `20261024160000_private_account_profiles.sql` before publishing. To roll back, deploy the previous application first and leave additive profile data/RPCs intact while any newer instance may still use them. No existing auth, study or payment data is migrated.

Validation: `node --test tests/account.test.mjs tests/login-offer.test.mjs`; `node scripts/test-account-profiles-sql.mjs --candidate` before applying, without `--candidate` after. SQL fixtures are rolled back. `node --env-file=.env.local scripts/test-account-profiles-http.mjs --browser` uses disposable marked accounts, no email or payment calls, with automatic cleanup.
