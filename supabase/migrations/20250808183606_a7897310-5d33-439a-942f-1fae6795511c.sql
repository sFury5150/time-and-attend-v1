-- Create time entries table for tracking employee clock in/out
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  clock_out TIMESTAMP WITH TIME ZONE,
  break_start TIMESTAMP WITH TIME ZONE,
  break_end TIMESTAMP WITH TIME ZONE,
  total_hours DECIMAL(5,2),
  break_duration DECIMAL(5,2),
  status TEXT NOT NULL DEFAULT 'clocked_in' CHECK (status IN ('clocked_in', 'on_break', 'clocked_out')),
  location_data JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for time entries
CREATE POLICY "Users can view their own time entries" 
ON public.time_entries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own time entries" 
ON public.time_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time entries" 
ON public.time_entries 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Managers and supervisors can view all time entries
CREATE POLICY "Managers can view all time entries" 
ON public.time_entries 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('manager', 'supervisor', 'admin')
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate total hours
CREATE OR REPLACE FUNCTION public.calculate_total_hours()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total hours when clocking out
  IF NEW.clock_out IS NOT NULL AND OLD.clock_out IS NULL THEN
    NEW.total_hours = EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 3600.0;
    
    -- Subtract break duration if exists
    IF NEW.break_start IS NOT NULL AND NEW.break_end IS NOT NULL THEN
      NEW.break_duration = EXTRACT(EPOCH FROM (NEW.break_end - NEW.break_start)) / 3600.0;
      NEW.total_hours = NEW.total_hours - NEW.break_duration;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic hour calculation
CREATE TRIGGER calculate_hours_trigger
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_total_hours();

-- Create index for better performance
CREATE INDEX idx_time_entries_user_id ON public.time_entries(user_id);

-- Enable realtime for time entries
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_entries;