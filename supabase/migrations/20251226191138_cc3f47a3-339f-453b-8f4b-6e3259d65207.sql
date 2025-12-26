-- Add table_count column to restaurant_settings
ALTER TABLE public.restaurant_settings 
ADD COLUMN table_count integer NOT NULL DEFAULT 10;