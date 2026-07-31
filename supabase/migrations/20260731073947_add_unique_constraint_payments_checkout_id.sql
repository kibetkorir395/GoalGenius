/*
# Add unique constraint on payments.checkout_id

1. Purpose
The payment edge function upserts session rows with
`onConflict: "checkout_id"`. Postgres requires a UNIQUE constraint (or
primary key) on the conflict target — a plain index is not sufficient.
This migration adds that constraint so upserts deduplicate correctly across
retries and re-deploys.

2. Modified Tables
- `payments` — adds unique constraint `payments_checkout_id_key` on
  `checkout_id`. Rows where `checkout_id` is NULL are allowed (NULLs are not
  considered equal under SQL semantics), so backfilling legacy rows is not
  blocked.

3. Security
- No RLS / policy changes.

4. Idempotency
- Guarded by a pg_constraint lookup; safe to re-run.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_checkout_id_key') THEN
    ALTER TABLE payments ADD CONSTRAINT payments_checkout_id_key UNIQUE (checkout_id);
  END IF;
END $$;
