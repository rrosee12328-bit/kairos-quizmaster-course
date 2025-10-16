-- Manually add enrollment for info@socialmediahelp.us who purchased Level 2 course
INSERT INTO public.enrollments (
  user_id, 
  email, 
  first_name, 
  last_name, 
  phone_number, 
  identification_type, 
  last_six_digits, 
  course_type, 
  enrollment_status
)
VALUES (
  'b098625d-9398-4be2-99ee-b9f92be99eaa',
  'info@socialmediahelp.us',
  'User',
  'Account',
  '0000000000',
  'ssn',
  '000000',
  'level2',
  'enrolled'
)
ON CONFLICT (email, course_type) DO UPDATE 
SET enrollment_status = 'enrolled', user_id = 'b098625d-9398-4be2-99ee-b9f92be99eaa';