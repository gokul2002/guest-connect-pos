-- Add kitchen_enabled setting to restaurant_settings
ALTER TABLE public.restaurant_settings 
ADD COLUMN kitchen_enabled boolean NOT NULL DEFAULT true;