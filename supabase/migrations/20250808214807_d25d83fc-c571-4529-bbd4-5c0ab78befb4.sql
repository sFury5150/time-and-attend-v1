-- Add recurring invoice support
ALTER TABLE public.invoices ADD COLUMN is_recurring BOOLEAN DEFAULT false;
ALTER TABLE public.invoices ADD COLUMN recurring_frequency TEXT; -- 'monthly', 'quarterly', 'yearly'
ALTER TABLE public.invoices ADD COLUMN recurring_start_date TIMESTAMPTZ;
ALTER TABLE public.invoices ADD COLUMN recurring_end_date TIMESTAMPTZ;
ALTER TABLE public.invoices ADD COLUMN next_invoice_date TIMESTAMPTZ;
ALTER TABLE public.invoices ADD COLUMN parent_invoice_id UUID REFERENCES public.invoices(id);

-- Add payment reminder tracking
CREATE TABLE public.payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL, -- 'first', 'second', 'final'
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email_sent_to TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

-- Create policies for payment reminders
CREATE POLICY "Users can view their payment reminders" 
ON public.payment_reminders FOR SELECT 
USING (
  invoice_id IN (
    SELECT id FROM public.invoices WHERE created_by = auth.uid()
  )
);

CREATE POLICY "System can insert payment reminders" 
ON public.payment_reminders FOR INSERT 
WITH CHECK (true);

-- Add invoice analytics table
CREATE TABLE public.invoice_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  total_invoices INTEGER DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  outstanding_amount DECIMAL(10,2) DEFAULT 0,
  average_days_to_payment DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- Enable RLS
ALTER TABLE public.invoice_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics
CREATE POLICY "Users can view their analytics" 
ON public.invoice_analytics FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their analytics" 
ON public.invoice_analytics FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their analytics" 
ON public.invoice_analytics FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Create function to update analytics
CREATE OR REPLACE FUNCTION update_invoice_analytics()
RETURNS TRIGGER AS $$
DECLARE
  current_month TEXT;
  creator_uuid UUID;
BEGIN
  -- Get created_by (user_id) and current month
  creator_uuid := COALESCE(NEW.created_by, OLD.created_by);
  current_month := TO_CHAR(COALESCE(NEW.created_at, OLD.created_at), 'YYYY-MM');
  
  -- Update or insert analytics
  INSERT INTO public.invoice_analytics (user_id, month_year, total_invoices, total_amount, paid_amount, outstanding_amount)
  SELECT 
    creator_uuid,
    current_month,
    COUNT(*),
    COALESCE(SUM(total_amount), 0),
    COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status != 'paid' THEN total_amount ELSE 0 END), 0)
  FROM public.invoices 
  WHERE created_by = creator_uuid 
    AND TO_CHAR(created_at, 'YYYY-MM') = current_month
  ON CONFLICT (user_id, month_year) 
  DO UPDATE SET
    total_invoices = EXCLUDED.total_invoices,
    total_amount = EXCLUDED.total_amount,
    paid_amount = EXCLUDED.paid_amount,
    outstanding_amount = EXCLUDED.outstanding_amount,
    updated_at = now();
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for analytics updates
CREATE TRIGGER update_analytics_on_invoice_change
  AFTER INSERT OR UPDATE OR DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_invoice_analytics();

-- Add reminder preferences to profiles
ALTER TABLE public.profiles ADD COLUMN reminder_preferences JSONB DEFAULT '{"first_reminder": 7, "second_reminder": 14, "final_reminder": 30}'::jsonb;