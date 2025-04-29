-- Migration: create_active_gates_table

-- Create the table to store active gate instances for hunters
CREATE TABLE public.active_gates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hunter_id UUID NOT NULL UNIQUE REFERENCES public.hunters(id) ON DELETE CASCADE,
    gate_type TEXT NOT NULL,
    gate_rank TEXT NOT NULL,
    current_depth INTEGER NOT NULL DEFAULT 1,
    current_room INTEGER NOT NULL DEFAULT 1,
    total_depth INTEGER NOT NULL CHECK (total_depth >= 3 AND total_depth <= 6), -- Enforce range 3-6
    rooms_per_depth INTEGER[] NOT NULL, -- Example: {4, 5, 3} for a 3-depth dungeon
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for common lookups
CREATE INDEX idx_active_gates_hunter_id ON public.active_gates(hunter_id);
CREATE INDEX idx_active_gates_expires_at ON public.active_gates(expires_at);

-- RLS Policy (Example: Only the owning user can see their hunter's active gate)
ALTER TABLE public.active_gates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow owner SELECT" ON public.active_gates
    FOR SELECT
    USING (auth.uid() = (SELECT user_id FROM public.hunters WHERE id = active_gates.hunter_id));

-- Note: INSERT/UPDATE/DELETE policies will be needed for the API routes that modify gates.

-- Add comments for clarity
COMMENT ON TABLE public.active_gates IS 'Stores information about currently active dungeon gates entered by hunters.';
COMMENT ON COLUMN public.active_gates.hunter_id IS 'The hunter currently inside this gate instance.';
COMMENT ON COLUMN public.active_gates.gate_type IS 'The type of dungeon the gate leads to (e.g., Goblin Dungeon).';
COMMENT ON COLUMN public.active_gates.gate_rank IS 'The rank classification of the gate (e.g., E, D).';
COMMENT ON COLUMN public.active_gates.current_depth IS 'The current depth level the hunter is on within the dungeon.';
COMMENT ON COLUMN public.active_gates.current_room IS 'The current room number the hunter is in on the current depth.';
COMMENT ON COLUMN public.active_gates.total_depth IS 'The total number of depth levels in this randomly generated dungeon instance (3-6).';
COMMENT ON COLUMN public.active_gates.rooms_per_depth IS 'An array containing the number of rooms for each depth level.';
COMMENT ON COLUMN public.active_gates.expires_at IS 'Timestamp when the gate instance automatically closes.';
