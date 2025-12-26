-- Create order_sources table for delivery platforms and takeaway
CREATE TABLE public.order_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'package',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_sources ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view order sources"
ON public.order_sources
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage order sources"
ON public.order_sources
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_order_sources_updated_at
BEFORE UPDATE ON public.order_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default order sources
INSERT INTO public.order_sources (name, icon, sort_order) VALUES
('Take Away', 'shopping-bag', 1),
('Swiggy', 'bike', 2),
('Zomato', 'utensils', 3),
('Zaroz', 'truck', 4);

-- Add order_source_id to orders table (nullable for dine-in orders with table_number)
ALTER TABLE public.orders ADD COLUMN order_source_id UUID REFERENCES public.order_sources(id);

-- Make table_number nullable for delivery/takeaway orders
ALTER TABLE public.orders ALTER COLUMN table_number DROP NOT NULL;