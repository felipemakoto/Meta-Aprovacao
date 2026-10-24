# Minha conta

Verified accounts, including the Free plan, may edit their private nickname, profile photo and reduced-motion preference. Study and Premium entitlements are unchanged. Nicknames are display names, not unique public handles, and do not affect login/email.

Profile data lives in `private.account_profiles`, protected by RLS and service-role-only RPCs. The server derives ownership from the verified session. The browser cannot specify a user ID. Avatar reads are authenticated and `private, no-store`; original files and filenames are not retained.

Uploads accept JPEG, PNG or WebP up to 2 MB and 16 megapixels. The server validates the bytes, rejects animations/SVG, strips metadata and produces a 256×256 WebP capped at 128 KB. The existing Sharp dependency is now explicit. Writes are limited to 20 per ten minutes per account, before image decoding. The image is bounded private database data, included in existing encrypted backups; no public storage bucket is created.

The reduced-motion preference is stored in the account and synchronized to the browser when the account panel loads. Its device copy applies across pages and tabs; operating-system reduced motion remains respected.

Apply `20261024160000_private_account_profiles.sql` before publishing. To roll back, deploy the previous application first and leave additive profile data/RPCs intact while any newer instance may still use them. No existing auth, study or payment data is migrated.

Validation: `node --test tests/account.test.mjs tests/login-offer.test.mjs`; `node scripts/test-account-profiles-sql.mjs --candidate` before applying, without `--candidate` after. SQL fixtures are rolled back. `node --env-file=.env.local scripts/test-account-profiles-http.mjs --browser` uses disposable marked accounts, no email or payment calls, with automatic cleanup.

## Settings menu and appearance

A circular gear opens a native modal with keyboard/focus handling, read-only server-confirmed plan, nickname, light/dark/system theme, reduced motion, password reset and cookie preferences. A failed plan lookup never implies Premium.

Theme is saved privately in the account; its browser copy applies before hydration and follows OS changes in system mode. Existing profile clients remain compatible and preserve saved theme. Apply 20261024180000_account_theme.sql before the new app; rollback app first and retain additive data/RPCs. Validate with tests/theme.test.mjs and SQL --candidate-theme before applying, without flags afterward.

## Registration name

The UI calls the existing private nickname field Nome (no duplicate column). Email registration validates and stores the name as Auth display metadata. On the first profile read, a verified user with name/full_name metadata initializes a private profile once; existing profile edits are never overwritten. Google supplies its display name through the existing OAuth scope. Metadata never controls entitlements. Apply 20261024190000_account_signup_name.sql before publishing; SQL --candidate-name tests initialization from email/Google metadata and preservation of edits. Names remain editable in account settings. Photo actions are grouped in the settings menu, without an upload success notice. Cookie preferences remain available in the footer.

A small pencil beside the display name opens the name/photo editor. The gear also retains the photo section; both entry points reuse the same photo controls and private API.
