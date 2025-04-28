-- supabase/migrations/<TIMESTAMP>_add_currency_to_hunters.sql

ALTER TABLE public.hunters
ADD COLUMN gold INTEGER NOT NULL DEFAULT 0 CHECK (gold >= 0),
ADD COLUMN diamonds INTEGER NOT NULL DEFAULT 0 CHECK (diamonds >= 0);

COMMENT ON COLUMN public.hunters.gold IS 'The amount of standard in-game currency the hunter possesses.';
COMMENT ON COLUMN public.hunters.diamonds IS 'The amount of premium currency the hunter possesses.';

-- Optional: Update existing hunters if needed, though default 0 is likely fine.
-- UPDATE public.hunters SET gold = 0 WHERE gold IS NULL;
-- UPDATE public.hunters SET diamonds = 0 WHERE diamonds IS NULL;

-- We might also want to update the updated_at timestamp when currency changes.
-- If the updated_at trigger isn't already on the hunters table, add it.

-- Assuming the function exists from previous migrations:
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create or Replace the trigger for the hunters table
DROP TRIGGER IF EXISTS update_hunters_updated_at ON public.hunters;
CREATE TRIGGER update_hunters_updated_at
BEFORE UPDATE ON public.hunters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column(); 