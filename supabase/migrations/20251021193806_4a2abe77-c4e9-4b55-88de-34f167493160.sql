-- Manually create enrollment for staylor@kairossecurity.com who paid for Level 2
-- This is a one-time fix for a missed webhook enrollment

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
  'b698732e-e161-420b-baa6-cae1de3b0ae4',
  'staylor@kairossecurity.com',
  'Stephen',
  'Taylor',
  '0000000000',
  'ssn',
  '000000',
  'level2',
  'enrolled'
)
ON CONFLICT DO NOTHING;