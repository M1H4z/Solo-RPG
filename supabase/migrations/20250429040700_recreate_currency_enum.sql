-- supabase/migrations/<TIMESTAMP>_recreate_currency_enum.sql

-- Drop dependent objects if they exist (like the column using it)
-- This is safer if the state is uncertain after deleting migrations
ALTER TABLE public.currency_transactions
DROP COLUMN IF EXISTS currency_type;

-- Drop the type if it somehow exists partially (unlikely but safe)
DROP TYPE IF EXISTS public.currency_enum;

-- Create the ENUM type
CREATE TYPE public.currency_enum AS ENUM ('gold', 'diamonds');

-- Add the column back *without* NOT NULL initially
ALTER TABLE public.currency_transactions
ADD COLUMN currency_type public.currency_enum;

-- Set a default value for existing rows
-- Assuming most existing transactions were gold-related test adjustments
UPDATE public.currency_transactions
SET currency_type = 'gold'
WHERE currency_type IS NULL;

-- Now add the NOT NULL constraint
ALTER TABLE public.currency_transactions
ALTER COLUMN currency_type SET NOT NULL;

COMMENT ON COLUMN public.currency_transactions.currency_type IS 'Type of currency involved in the transaction (gold or diamonds).';

-- Optional: Add an index if you expect to query by currency_type frequently
CREATE INDEX IF NOT EXISTS idx_currency_transactions_currency_type ON public.currency_transactions(currency_type); 