-- Durable account recovery and course-history reporting.
-- Recovery groups let admins link historical login emails to a current account
-- without editing edge-function code or redeploying the app.

CREATE TABLE IF NOT EXISTS public.account_recovery_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.account_recovery_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.account_recovery_groups(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT account_recovery_email_lowercase CHECK (email = lower(trim(email)))
);

CREATE UNIQUE INDEX IF NOT EXISTS account_recovery_emails_email_key
  ON public.account_recovery_emails (email);

CREATE INDEX IF NOT EXISTS account_recovery_emails_group_id_idx
  ON public.account_recovery_emails (group_id);

DROP TRIGGER IF EXISTS update_account_recovery_groups_updated_at ON public.account_recovery_groups;
CREATE TRIGGER update_account_recovery_groups_updated_at
BEFORE UPDATE ON public.account_recovery_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_account_recovery_emails_updated_at ON public.account_recovery_emails;
CREATE TRIGGER update_account_recovery_emails_updated_at
BEFORE UPDATE ON public.account_recovery_emails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.account_recovery_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_recovery_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view account recovery groups" ON public.account_recovery_groups;
CREATE POLICY "Admins can view account recovery groups"
ON public.account_recovery_groups
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)
  )
);

DROP POLICY IF EXISTS "Admins can manage account recovery groups" ON public.account_recovery_groups;
CREATE POLICY "Admins can manage account recovery groups"
ON public.account_recovery_groups
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)
  )
);

DROP POLICY IF EXISTS "Admins can view account recovery emails" ON public.account_recovery_emails;
CREATE POLICY "Admins can view account recovery emails"
ON public.account_recovery_emails
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)
  )
);

DROP POLICY IF EXISTS "Admins can manage account recovery emails" ON public.account_recovery_emails;
CREATE POLICY "Admins can manage account recovery emails"
ON public.account_recovery_emails
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_recovery_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_recovery_emails TO authenticated;
GRANT ALL ON public.account_recovery_groups TO service_role;
GRANT ALL ON public.account_recovery_emails TO service_role;

-- Seed the known historical Rose/Kairos account mappings that were previously hardcoded.
WITH recovery_group AS (
  INSERT INTO public.account_recovery_groups (label, notes)
  SELECT 'Rose/Kairos historical logins', 'Migrated from edge-function accountRecoveryEmails fallback.'
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.account_recovery_emails
    WHERE email IN (
      'rrosee12390@gmail.com',
      'rrosee12328@gmail.com',
      'swiftskillnow@gmail.com',
      'rickylrose@yahoo.com'
    )
  )
  RETURNING id
),
existing_group AS (
  SELECT group_id AS id
  FROM public.account_recovery_emails
  WHERE email IN (
    'rrosee12390@gmail.com',
    'rrosee12328@gmail.com',
    'swiftskillnow@gmail.com',
    'rickylrose@yahoo.com'
  )
  LIMIT 1
),
selected_group AS (
  SELECT id FROM recovery_group
  UNION ALL
  SELECT id FROM existing_group
  LIMIT 1
)
INSERT INTO public.account_recovery_emails (group_id, email, is_primary, notes)
SELECT
  selected_group.id,
  seed.email,
  seed.is_primary,
  'Initial recovery mapping'
FROM selected_group
CROSS JOIN (
  VALUES
    ('rrosee12390@gmail.com', true),
    ('rrosee12328@gmail.com', false),
    ('swiftskillnow@gmail.com', false),
    ('rickylrose@yahoo.com', false)
) AS seed(email, is_primary)
ON CONFLICT (email) DO UPDATE
SET
  group_id = EXCLUDED.group_id,
  is_primary = account_recovery_emails.is_primary OR EXCLUDED.is_primary,
  updated_at = now();

CREATE OR REPLACE VIEW public.student_course_history
WITH (security_invoker = true) AS
WITH course_sources AS (
  SELECT
    COALESCE(NULLIF(lower(trim(e.email)), ''), lower(trim(p.email))) AS email,
    e.user_id,
    CASE
      WHEN e.course_type = 'level-4' THEN 'level4'
      WHEN e.course_type = 'pepper_spray' THEN 'pepper-spray'
      ELSE e.course_type
    END AS course_type,
    true AS has_enrollment,
    e.enrollment_status,
    false AS has_progress,
    false AS has_completion,
    null::boolean AS passed,
    null::numeric AS best_percentage,
    false AS has_certificate,
    null::text AS registration_numbers
  FROM public.enrollments e
  LEFT JOIN public.profiles p ON p.id = e.user_id

  UNION ALL

  SELECT
    lower(trim(p.email)) AS email,
    cp.user_id,
    CASE
      WHEN cp.course_type = 'level-4' THEN 'level4'
      WHEN cp.course_type = 'pepper_spray' THEN 'pepper-spray'
      ELSE cp.course_type
    END AS course_type,
    false,
    null::text,
    true,
    false,
    null::boolean,
    null::numeric,
    false,
    null::text
  FROM public.course_progress cp
  LEFT JOIN public.profiles p ON p.id = cp.user_id

  UNION ALL

  SELECT
    lower(trim(p.email)) AS email,
    cc.user_id,
    CASE
      WHEN cc.course_type = 'level-4' THEN 'level4'
      WHEN cc.course_type = 'pepper_spray' THEN 'pepper-spray'
      ELSE cc.course_type
    END AS course_type,
    false,
    null::text,
    false,
    true,
    cc.passed,
    cc.percentage::numeric,
    false,
    null::text
  FROM public.course_completions cc
  LEFT JOIN public.profiles p ON p.id = cc.user_id

  UNION ALL

  SELECT
    lower(trim(p.email)) AS email,
    c.user_id,
    CASE
      WHEN c.course_type = 'level-4' THEN 'level4'
      WHEN c.course_type = 'pepper_spray' THEN 'pepper-spray'
      ELSE c.course_type
    END AS course_type,
    false,
    null::text,
    false,
    false,
    null::boolean,
    null::numeric,
    true,
    c.registration_number
  FROM public.certificates c
  LEFT JOIN public.profiles p ON p.id = c.user_id
)
SELECT
  email,
  course_type,
  array_remove(array_agg(DISTINCT user_id), null) AS user_ids,
  bool_or(has_enrollment) AS has_enrollment,
  array_remove(array_agg(DISTINCT enrollment_status), null) AS enrollment_statuses,
  bool_or(has_progress) AS has_progress,
  bool_or(has_completion) AS has_completion,
  bool_or(passed IS true) AS has_passing_completion,
  max(best_percentage) AS best_percentage,
  bool_or(has_certificate) AS has_certificate,
  array_remove(array_agg(DISTINCT registration_numbers), null) AS registration_numbers,
  bool_or(has_enrollment)
    OR bool_or(has_progress)
    OR bool_or(has_completion)
    OR bool_or(has_certificate) AS should_have_access
FROM course_sources
WHERE email IS NOT NULL
  AND email <> ''
  AND course_type IS NOT NULL
GROUP BY email, course_type;

GRANT SELECT ON public.student_course_history TO authenticated;
GRANT SELECT ON public.student_course_history TO service_role;
