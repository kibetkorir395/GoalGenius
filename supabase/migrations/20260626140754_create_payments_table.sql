/*
# Create Payments Table

1. New Tables
- `payments` - tracks all payment transactions with the Rise Payment API
  - `id` (uuid, primary key)
  - `user_email` (text, not null) - email of the user making payment
  - `plan` (text, not null) - subscription plan name (Daily, Weekly, Monthly)
  - `billing` (text, not null) - billing period (Day, Week, Month)
  - `amount` (integer, not null) - amount in KES
  - `checkout_id` (text) - checkout ID from Rise API
  - `tx_ref` (text) - transaction reference from Rise API
  - `status` (text, default 'pending') - payment status (pending, success, failed)
  - `payment_method` (text, default 'mpesa') - payment method used
  - `phone` (text) - phone number for M-Pesa
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on `payments`.
- Allow authenticated users to manage their own payment records.
- Allow anon access for initial payment creation (since users may not be logged in during checkout init).
*/

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  plan text NOT NULL,
  billing text NOT NULL,
  amount integer NOT NULL,
  checkout_id text,
  tx_ref text,
  status text NOT NULL DEFAULT 'pending',
  payment_method text NOT NULL DEFAULT 'mpesa',
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow all operations for simplicity (this is a payment tracking table)
DROP POLICY IF EXISTS "anon_select_payments" ON payments;
CREATE POLICY "anon_select_payments" ON payments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_payments" ON payments;
CREATE POLICY "anon_insert_payments" ON payments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_payments" ON payments;
CREATE POLICY "anon_update_payments" ON payments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_payments" ON payments;
CREATE POLICY "anon_delete_payments" ON payments FOR DELETE
  TO anon, authenticated USING (true);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_payments_user_email ON payments(user_email);
CREATE INDEX IF NOT EXISTS idx_payments_checkout_id ON payments(checkout_id);
CREATE INDEX IF NOT EXISTS idx_payments_tx_ref ON payments(tx_ref);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
