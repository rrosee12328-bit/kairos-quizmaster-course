-- Fix search_path security issue for generate_registration_number function
CREATE OR REPLACE FUNCTION public.generate_registration_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_reg_number TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Format: KTA-L3-YYYYMMDD-XXXXX (e.g., KTA-L3-20250108-12345)
    new_reg_number := 'KTA-L3-' || 
                      to_char(now(), 'YYYYMMDD') || '-' || 
                      lpad(floor(random() * 99999)::text, 5, '0');
    
    -- Check if this number already exists
    SELECT EXISTS(
      SELECT 1 FROM public.certificates WHERE registration_number = new_reg_number
    ) INTO exists_check;
    
    -- Exit loop if unique number found
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN new_reg_number;
END;
$$;