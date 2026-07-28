# One-off DB scripts

These are manual scripts run once against the live database (`node src/scripts/<file>.js`
from `backend/`). They are **not executed automatically** on deploy or app startup —
`schema.sql` reflects the intended shape of the DB, but this live database predates it and
was migrated incrementally with scripts like these instead of a migration framework.

Each script below has already been applied to production. They're kept for historical
record and as a reference for writing the next one.

| Script | Purpose | Status |
|--------|---------|--------|
| `add_progress_review_columns.js` | Adds `progress_status` / `progress_review_reason` columns to `users` (progress-update review gate) | Applied |
| `fix_review_reason_column_type.js` | Widens `users.review_reason` from `VARCHAR(20)` to `TEXT` (was truncating admin decline comments) | Applied |
| `unhide_all_users.js` | One-time reset clearing `is_hidden` after the Visibility feature was removed | Applied |
| `check_column_types.js` | Diagnostic — prints column types/lengths for `users` and `progress_log`. Safe to re-run anytime. | Utility |

## Writing a new one

Copy the `pg.Pool` + `dotenv` boilerplate from any script above, write the `ALTER TABLE` /
data-fix query, run it once against production, then update `schema.sql` to match and note
the script here.
