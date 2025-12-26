-- Add restaurant details for thermal printing
ALTER TABLE public.restaurant_settings 
ADD COLUMN IF NOT EXISTS restaurant_address TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS restaurant_logo_url TEXT DEFAULT NULL;