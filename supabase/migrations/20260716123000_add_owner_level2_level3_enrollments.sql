-- Ensure owner/admin accounts have their purchased Level 2 and Level 3 enrollments.
WITH accounts(email, first_name, last_name) AS (
  VALUES
    ('info@vektiss.com', 'Vektiss', 'Account'),
    ('trysocialmediahelp@gmail.com', 'Try Social Media', 'Help')
),
courses(course_type) AS (
  VALUES
    ('level2'),
    ('level3')
),
target_enrollments AS (
  SELECT
    accounts.email,
    accounts.first_name,
    accounts.last_name,
    courses.course_type,
    auth.users.id AS user_id
  FROM accounts
  CROSS JOIN courses
  LEFT JOIN auth.users ON lower(auth.users.email) = lower(accounts.email)
)
UPDATE public.enrollments
SET
  user_id = COALESCE(target_enrollments.user_id, public.enrollments.user_id),
  email = target_enrollments.email,
  enrollment_status = 'enrolled',
  updated_at = now()
FROM target_enrollments
WHERE lower(public.enrollments.email) = lower(target_enrollments.email)
  AND public.enrollments.course_type = target_enrollments.course_type;

WITH accounts(email, first_name, last_name) AS (
  VALUES
    ('info@vektiss.com', 'Vektiss', 'Account'),
    ('trysocialmediahelp@gmail.com', 'Try Social Media', 'Help')
),
courses(course_type) AS (
  VALUES
    ('level2'),
    ('level3')
),
target_enrollments AS (
  SELECT
    accounts.email,
    accounts.first_name,
    accounts.last_name,
    courses.course_type,
    auth.users.id AS user_id
  FROM accounts
  CROSS JOIN courses
  LEFT JOIN auth.users ON lower(auth.users.email) = lower(accounts.email)
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
  target_enrollments.user_id,
  target_enrollments.email,
  target_enrollments.first_name,
  target_enrollments.last_name,
  '0000000000',
  'driver_license',
  '0000',
  target_enrollments.course_type,
  'enrolled'
FROM target_enrollments
WHERE target_enrollments.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.enrollments
    WHERE lower(email) = lower(target_enrollments.email)
      AND course_type = target_enrollments.course_type
  );
