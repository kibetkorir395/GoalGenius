/*
# Relax NOT NULL on payments.plan, billing, user_email

1. Purpose
The payment edge function persists a payment session row at initiation time,
before the app-level subscription metadata (plan/billing) is known — those
fields are only applied in the app after a successful payment. The payment
API contract only carries amount, currency, phone, email, fullname. To allow
the session row to be inserted at initiation and back-filled later, this
migration drops the NOT NULL constraints on `plan`, `billing`, and
`user_email`.

2. Modified Tables
- `payments`
  - `plan`        text NOT NULL -> text (nullable)
  - `billing`     text NOT NULL -> text (nullable)
  - `user_email`  text NOT NULL -> text (nullable)

3. Security
- No RLS / policy changes.

4. Idempotency
- Altering a column to drop NOT NULL is safe to re-run; Postgres no-ops if the
  column is already nullable. Wrapped in a DO block for clarity.
*/

DO $$
BEGIN
  ALTER TABLE payments ALTER COLUMN plan DROP NOT NULL;
  ALTER TABLE payments ALTER COLUMN billing DROP NOT NULL;
  ALTER TABLE payments ALTER COLUMN user_email DROP NOT NULL;
END $$;
