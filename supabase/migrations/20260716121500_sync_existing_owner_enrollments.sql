-- Link existing purchased enrollments for owner/admin emails to their auth users.
-- This does not create new course purchases; it only makes existing enrollments visible again.
WITH accounts(email) AS (
  VALUES
    ('info@vektiss.com'),
    ('trysocialmediahelp@gmail.com')
),
target_users AS (
  SELECT
    accounts.email,
    auth.users.id AS user_id
  FROM accounts
  LEFT JOIN auth.users ON lower(auth.users.email) = lower(accounts.email)
)
UPDATE public.enrollments
SET
  user_id = COALESCE(target_users.user_id, public.enrollments.user_id),
  email = target_users.email,
  enrollment_status = 'enrolled',
  updated_at = now()
FROM target_users
WHERE lower(public.enrollments.email) = lower(target_users.email);
