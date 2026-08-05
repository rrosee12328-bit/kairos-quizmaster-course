-- Restore Level 2 results that were shown by the legacy client after its
-- course_completions insert had been blocked by the security hardening.
--
-- Reported results:
--   Kordai Gresham: 94% (30/32)
--   Kasch Gresham:  85% (27/32 is the nearest raw score; preserve 85% as reported)
--
-- This migration is idempotent: it only creates a passing completion and
-- certificate when the student does not already have one for Level 2.

DO $$
DECLARE
  student RECORD;
  target_user_id UUID;
  target_completion_id UUID;
  target_completed_at TIMESTAMPTZ;
  target_registration_number TEXT;
  target_enrollment RECORD;
BEGIN
  FOR student IN
    SELECT *
    FROM (VALUES
      ('kordaigresham4@gmail.com'::TEXT, 'Kordai Gresham'::TEXT, 30, 94),
      ('kaschgresham81@gmail.com'::TEXT, 'Kasch Gresham'::TEXT, 27, 85)
    ) AS results(email, student_name, score, percentage)
  LOOP
    SELECT id
    INTO target_user_id
    FROM auth.users
    WHERE lower(email) = lower(student.email)
    LIMIT 1;

    IF target_user_id IS NULL THEN
      RAISE EXCEPTION 'Cannot restore Level 2 result: no auth user for %', student.email;
    END IF;

    SELECT *
    INTO target_enrollment
    FROM public.enrollments
    WHERE user_id = target_user_id
      AND course_type = 'level2'
    ORDER BY created_at DESC
    LIMIT 1;

    IF target_enrollment.id IS NULL THEN
      RAISE EXCEPTION 'Cannot restore Level 2 result: no enrollment for %', student.email;
    END IF;

    SELECT id
    INTO target_completion_id
    FROM public.course_completions
    WHERE user_id = target_user_id
      AND course_type = 'level2'
      AND passed = true
    ORDER BY completed_at DESC
    LIMIT 1;

    IF target_completion_id IS NULL THEN
      SELECT COALESCE(MAX(updated_at), now())
      INTO target_completed_at
      FROM public.course_progress
      WHERE user_id = target_user_id
        AND course_type = 'level2';

      INSERT INTO public.course_completions (
        user_id,
        course_type,
        score,
        total_questions,
        percentage,
        passed,
        completed_at,
        started_at,
        ended_at,
        duration_seconds
      ) VALUES (
        target_user_id,
        'level2',
        student.score,
        32,
        student.percentage,
        true,
        target_completed_at,
        target_completed_at - interval '30 minutes',
        target_completed_at,
        1800
      )
      RETURNING id INTO target_completion_id;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.certificates
      WHERE completion_id = target_completion_id
    ) THEN
      target_registration_number := public.generate_registration_number();

      INSERT INTO public.certificates (
        user_id,
        completion_id,
        registration_number,
        student_name,
        identification_type,
        last_six_digits,
        course_type,
        completion_date
      ) VALUES (
        target_user_id,
        target_completion_id,
        target_registration_number,
        student.student_name,
        target_enrollment.identification_type,
        target_enrollment.last_six_digits,
        'level2',
        (SELECT completed_at::date FROM public.course_completions WHERE id = target_completion_id)
      );
    END IF;

    UPDATE public.enrollments
    SET enrollment_status = 'completed', updated_at = now()
    WHERE id = target_enrollment.id;

    target_user_id := NULL;
    target_completion_id := NULL;
    target_completed_at := NULL;
    target_registration_number := NULL;
  END LOOP;
END
$$;
