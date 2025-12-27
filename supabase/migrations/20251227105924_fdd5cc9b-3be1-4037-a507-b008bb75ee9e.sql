-- Add order_number and order_source_name to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_source_name text;