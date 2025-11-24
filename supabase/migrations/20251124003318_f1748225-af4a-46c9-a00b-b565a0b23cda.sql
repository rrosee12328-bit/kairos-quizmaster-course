-- Add Level 3 enrollment for swiftskillnow@gmail.com
INSERT INTO enrollments (
  user_id,
  course_type,
  first_name,
  last_name,
  email,
  phone_number,
  identification_type,
  last_six_digits,
  enrollment_status
)
SELECT 
  id,
  'level3',
  'Ricky',
  'Rose',
  email,
  '555-0000',
  'driver_license',
  '123456',
  'enrolled'
FROM auth.users
WHERE email = 'swiftskillnow@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM enrollments
    WHERE user_id = auth.users.id
      AND course_type = 'level3'
  );