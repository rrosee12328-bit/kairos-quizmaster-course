import { supabase } from "@/integrations/supabase/client";
import { syncEnrollmentsForCurrentSession } from "@/lib/enrollmentSync";

export type CourseAccessId = "level2" | "level3" | "level4" | "level-4" | "pepper-spray" | "pepper_spray";

export const ACTIVE_ENROLLMENT_STATUSES = ["enrolled", "approved", "completed", "active", "paid", "pending"];

const COURSE_ALIASES: Record<string, string[]> = {
  level2: ["level2"],
  level3: ["level3"],
  level4: ["level4", "level-4"],
  "level-4": ["level4", "level-4"],
  "pepper-spray": ["pepper-spray", "pepper_spray"],
  pepper_spray: ["pepper-spray", "pepper_spray"],
};

export interface EnrollmentSummary {
  id: string;
  user_id: string | null;
  email: string;
  course_type: string;
  enrollment_status: string;
}

export const getCourseAliases = (courseId: CourseAccessId | string) => COURSE_ALIASES[courseId] ?? [courseId];

export const normalizeCourseType = (courseId: CourseAccessId | string) => {
  if (courseId === "level-4") return "level4";
  if (courseId === "pepper_spray") return "pepper-spray";
  return courseId;
};

export const getCourseRoute = (courseId: CourseAccessId | string) => {
  const normalized = normalizeCourseType(courseId);
  return normalized === "pepper-spray" ? "/course/pepper-spray" : `/course/${normalized}`;
};

export const getCourseTitle = (courseId: CourseAccessId | string) => {
  const normalized = normalizeCourseType(courseId);
  if (normalized === "level2") return "Level 2 Security Officer Certification";
  if (normalized === "level3") return "Level 3 Security Officer Certification (Part 1)";
  if (normalized === "level4") return "Level 4 Personal Protection Officer (Part 1)";
  if (normalized === "pepper-spray") return "Pepper Spray Training Course";
  return courseId;
};

export const fetchMyActiveEnrollments = async (userId: string): Promise<EnrollmentSummary[]> => {
  await syncEnrollmentsForCurrentSession();

  const { data, error } = await supabase
    .from("enrollments")
    .select("id, user_id, email, course_type, enrollment_status")
    .eq("user_id", userId)
    .in("enrollment_status", ACTIVE_ENROLLMENT_STATUSES)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
};

export const checkCourseAccess = async (userId: string, courseId: CourseAccessId | string) => {
  await syncEnrollmentsForCurrentSession();

  const courseAliases = getCourseAliases(courseId);
  const [enrollmentResult, progressResult, completionResult] = await Promise.all([
    supabase
      .from("enrollments")
      .select("id, enrollment_status, course_type")
      .eq("user_id", userId)
      .in("course_type", courseAliases)
      .in("enrollment_status", ACTIVE_ENROLLMENT_STATUSES)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("course_progress")
      .select("id")
      .eq("user_id", userId)
      .in("course_type", courseAliases)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("course_completions")
      .select("id, passed")
      .eq("user_id", userId)
      .in("course_type", courseAliases)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    enrollment: enrollmentResult.data,
    progress: progressResult.data,
    completion: completionResult.data,
    errors: {
      enrollment: enrollmentResult.error,
      progress: progressResult.error,
      completion: completionResult.error,
    },
    hasAccess: !!(enrollmentResult.data || progressResult.data || completionResult.data),
  };
};