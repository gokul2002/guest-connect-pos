-- Add printer configuration columns to restaurant_settings
ALTER TABLE public.restaurant_settings
ADD COLUMN kitchen_printer_name TEXT DEFAULT 'Kitchen Printer',
ADD COLUMN cash_printer_name TEXT DEFAULT 'Cash Printer';