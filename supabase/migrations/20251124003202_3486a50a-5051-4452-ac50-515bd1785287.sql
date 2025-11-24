-- Add Level 3 enrollment for test user
INSERT INTO enrollments (user_id, course_type, first_name, last_name, email, phone_number, identification_type, last_six_digits, enrollment_status)
SELECT 
  id, 
  'level3', 
  'Test', 
  'User', 
  email, 
  '555-1234', 
  'driver_license', 
  '123456', 
  'enrolled'
FROM auth.users 
WHERE email = 'rrosee12328@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM enrollments 
  WHERE enrollments.user_id = auth.users.id 
  AND enrollments.course_type = 'level3'
);