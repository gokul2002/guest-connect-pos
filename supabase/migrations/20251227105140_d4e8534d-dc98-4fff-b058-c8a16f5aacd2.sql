-- Add parcel_charges column to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS parcel_charges numeric DEFAULT 0 NOT NULL;