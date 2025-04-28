-- Migration: create_currency_transactions_table
-- Description: Adds a table to log all gold and diamond transactions for hunters.

-- Create the currency_transactions table
CREATE TABLE public.currency_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hunter_id uuid NOT NULL REFERENCES public.hunters(id) ON DELETE CASCADE,
    transaction_time timestamp with time zone NOT NULL DEFAULT now(),
    currency_type text NOT NULL CHECK (currency_type IN ('gold', 'diamond')),
    amount_change integer NOT NULL CHECK (amount_change != 0),
    new_balance integer NOT NULL CHECK (new_balance >= 0), -- Ensure balance doesn't go negative
    source text NOT NULL,
    source_details jsonb NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now() -- Keep track of record creation too
);

-- Add comments to columns for clarity
COMMENT ON COLUMN public.currency_transactions.id IS 'Unique identifier for the transaction record.';
COMMENT ON COLUMN public.currency_transactions.hunter_id IS 'Foreign key referencing the hunter involved.';
COMMENT ON COLUMN public.currency_transactions.transaction_time IS 'Timestamp when the currency change occurred.';
COMMENT ON COLUMN public.currency_transactions.currency_type IS 'Type of currency affected (''''gold'''' or ''''diamond'''').';
COMMENT ON COLUMN public.currency_transactions.amount_change IS 'The amount the currency changed by (positive for gain, negative for loss).';
COMMENT ON COLUMN public.currency_transactions.new_balance IS 'The hunter''''s balance of this currency AFTER the transaction.';
COMMENT ON COLUMN public.currency_transactions.source IS 'The origin or reason for the transaction (e.g., ''''shop_purchase'''', ''''dungeon_reward'''').';
COMMENT ON COLUMN public.currency_transactions.source_details IS 'Optional JSON blob for additional context (e.g., item_id, dungeon_id).';
COMMENT ON COLUMN public.currency_transactions.created_at IS 'Timestamp when the transaction record was created.';

-- Create indexes for efficient querying
CREATE INDEX idx_currency_transactions_hunter_id ON public.currency_transactions(hunter_id);
CREATE INDEX idx_currency_transactions_hunter_time ON public.currency_transactions(hunter_id, transaction_time DESC);
CREATE INDEX idx_currency_transactions_hunter_currency ON public.currency_transactions(hunter_id, currency_type);

-- Enable Row Level Security (RLS) - IMPORTANT for Supabase
ALTER TABLE public.currency_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Policy 1: Allow users to read their own transactions
CREATE POLICY "Allow users to read their own transactions"
ON public.currency_transactions
FOR SELECT
USING (auth.uid() = (SELECT user_id FROM public.hunters WHERE id = hunter_id));

-- Policy 2: Disallow direct inserts/updates/deletes by users (should happen via trusted functions/backend)
-- No explicit INSERT/UPDATE/DELETE policies for users means they are disallowed by default RLS.
-- If inserts *must* happen from client (not recommended), a specific policy with checks would be needed. 