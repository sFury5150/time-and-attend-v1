-- Create schedules table for managing employee work schedules
CREATE TABLE public.schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for schedules
CREATE POLICY "Employees can view their own schedules" 
ON public.schedules 
FOR SELECT 
USING (auth.uid() = employee_id);

CREATE POLICY "Managers can view all schedules" 
ON public.schedules 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('manager', 'supervisor', 'admin')
  )
);

CREATE POLICY "Managers can create schedules" 
ON public.schedules 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('manager', 'supervisor', 'admin')
  )
);

CREATE POLICY "Managers can update schedules" 
ON public.schedules 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('manager', 'supervisor', 'admin')
  )
);

CREATE POLICY "Managers can delete schedules" 
ON public.schedules 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('manager', 'supervisor', 'admin')
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_schedules_employee_id ON public.schedules(employee_id);
CREATE INDEX idx_schedules_start_time ON public.schedules(start_time);
CREATE INDEX idx_schedules_created_by ON public.schedules(created_by);

-- Enable realtime for schedules
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedules;