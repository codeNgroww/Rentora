-- ==============================================================================
-- ADD PARKING TO UNITS TYPE CHECK CONSTRAINT
-- ==============================================================================
ALTER TABLE public.units DROP CONSTRAINT IF EXISTS units_type_check;
ALTER TABLE public.units ADD CONSTRAINT units_type_check CHECK (type IN ('residential', 'commercial', 'parking'));
