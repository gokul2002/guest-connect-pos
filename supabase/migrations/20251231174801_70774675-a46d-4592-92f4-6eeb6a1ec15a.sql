-- Add printed_at column to orders to support auto-print tracking
ALTER TABLE public.orders
  ADD COLUMN printed_at TIMESTAMP WITH TIME ZONE NULL;