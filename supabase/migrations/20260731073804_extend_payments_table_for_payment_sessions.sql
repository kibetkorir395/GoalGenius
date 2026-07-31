/*
# Extend payments table for full payment-session persistence

1. Purpose
The existing `payments` table tracks basic payment metadata but does not store the
fields required to fully replicate the flutter-payment API's in-memory payment
sessions (channel, currency, Flutterwave merchant/transaction IDs, error code,
retry count, completion timestamp). This migration adds those columns so the
Supabase edge function can persist every payment session in the database instead
of relying on the original service's in-memory Map (which is lost across requests
and instances).

2. Modified Tables
- `payments` — adds the following nullable columns (NO existing columns are
  dropped, renamed, or retyped; existing rows keep working):
  - `currency` (text, default 'KES') — payment currency code
  - `fullname` (text) — customer full name passed to Flutterwave
  - `channel` (text) — payment channel: 'mpesa', 'card', 'bank_transfer', 'kora'
  - `merchant_request_id` (bigint) — Flutterwave `data.id` returned at initiation
  - `transaction_id` (bigint) — Flutterwave transaction id set on completion
  - `error_code` (text) — failure/timeout reason code
  - `retry_count` (integer, default 0) — number of status updates received
  - `completed_at` (timestamptz) — when the session reached a terminal state

3. Constraints
- Adds a CHECK constraint `payments_status_check` restricting `status` to the
  values used by the payment flow: 'pending', 'awaiting_otp', 'completed',
  'failed', 'timeout', 'success', 'not_found'. (The 'success'/'not_found' values
  are included only to keep existing app code that reads raw status strings
  tolerant; the function normalizes to the canonical set on write.)

4. Security
- RLS already enabled on `payments` with anon+authenticated CRUD policies from
  the previous migration. No policy changes needed — the table remains
  intentionally writable by the anon-key frontend during checkout init, and
  the edge function uses the service role to update rows server-side.

5. Indexes
- Adds `idx_payments_tx_ref_unique` enforcement is NOT added (kept as a plain
  non-unique index already exists). Adds `idx_payments_status_created` to
  speed up cleanup/timeout scans.

6. Idempotency
- Column additions are wrapped in a DO block that checks information_schema
  before adding, so re-running is safe.
- Constraint addition is guarded by a pg_constraint lookup.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'payments' AND column_name = 'currency') THEN
    ALTER TABLE payments ADD COLUMN currency text NOT NULL DEFAULT 'KES';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'payments' AND column_name = 'fullname') THEN
    ALTER TABLE payments ADD COLUMN fullname text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'payments' AND column_name = 'channel') THEN
    ALTER TABLE payments ADD COLUMN channel text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'payments' AND column_name = 'merchant_request_id') THEN
    ALTER TABLE payments ADD COLUMN merchant_request_id bigint;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'payments' AND column_name = 'transaction_id') THEN
    ALTER TABLE payments ADD COLUMN transaction_id bigint;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'payments' AND column_name = 'error_code') THEN
    ALTER TABLE payments ADD COLUMN error_code text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'payments' AND column_name = 'retry_count') THEN
    ALTER TABLE payments ADD COLUMN retry_count integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'payments' AND column_name = 'completed_at') THEN
    ALTER TABLE payments ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_status_check') THEN
    ALTER TABLE payments
      ADD CONSTRAINT payments_status_check
      CHECK (status IN ('pending','awaiting_otp','completed','failed','timeout','success','not_found'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payments_status_created
  ON payments(status, created_at);
