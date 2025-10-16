-- Add Level 2 enrollment for user rrosee12390@gmail.com
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
) VALUES (
  '8f985c1d-f6ee-4bd5-89f3-f066e4f36b5b',
  'rrosee12390@gmail.com',
  'Lee',
  'Rose',
  '0000000000',
  'ssn',
  '000000',
  'level2',
  'enrolled'
);