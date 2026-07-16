-- Ensure these purchased students have Level 2 access and link enrollments to auth users when present.
WITH students(email, first_name, last_name) AS (
  VALUES
    ('kaschgresham81@gmail.com', 'Kasch', 'Gresham'),
    ('kordaigresham4@gmail.com', 'Kordai', 'Gresham')
),
target_users AS (
  SELECT
    students.email,
    students.first_name,
    students.last_name,
    auth.users.id AS user_id
  FROM students
  LEFT JOIN auth.users ON lower(auth.users.email) = lower(students.email)
)
UPDATE public.enrollments
SET
  user_id = COALESCE(target_users.user_id, public.enrollments.user_id),
  email = target_users.email,
  enrollment_status = 'enrolled',
  updated_at = now()
FROM target_users
WHERE lower(public.enrollments.email) = lower(target_users.email)
  AND public.enrollments.course_type = 'level2';

WITH students(email, first_name, last_name) AS (
  VALUES
    ('kaschgresham81@gmail.com', 'Kasch', 'Gresham'),
    ('kordaigresham4@gmail.com', 'Kordai', 'Gresham')
),
target_users AS (
  SELECT
    students.email,
    students.first_name,
    students.last_name,
    auth.users.id AS user_id
  FROM students
  LEFT JOIN auth.users ON lower(auth.users.email) = lower(students.email)
)
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
SELECT
  target_users.user_id,
  target_users.email,
  target_users.first_name,
  target_users.last_name,
  '0000000000',
  'driver_license',
  '0000',
  'level2',
  'enrolled'
FROM target_users
WHERE target_users.user_id IS NOT NULL
  AND NOT EXISTS (
  SELECT 1
  FROM public.enrollments
  WHERE lower(email) = lower(target_users.email)
    AND course_type = 'level2'
);
