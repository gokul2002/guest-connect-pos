-- Add print copy count columns to restaurant_settings
ALTER TABLE public.restaurant_settings
  ADD COLUMN dine_in_copies INTEGER DEFAULT 1,
  ADD COLUMN take_away_copies INTEGER DEFAULT 1,
  ADD COLUMN cash_copies INTEGER DEFAULT 1,
  ADD COLUMN kot_copies INTEGER DEFAULT 1;