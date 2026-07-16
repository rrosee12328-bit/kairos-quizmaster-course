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

export interface CourseEntitlementSummary {
  course_type: string;
  source: "enrollment" | "progress" | "completion";
  enrollment_status?: string;
}

interface ProfileAccessData {
  enrollments?: Array<{ course_type: string; enrollment_status?: string }>;
  completions?: Array<{ course_type: string }>;
  certificates?: Array<{ course_type: string }>;
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

export const checkUserIsAdmin = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "security_admin"])
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("[courseAccess] Admin role lookup failed:", error);
    return false;
  }

  return !!data;
};

const fetchProfileAccessData = async (userId: string): Promise<ProfileAccessData | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase.functions.invoke("get-profile-data", {
    headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
    body: { userId },
  });

  if (error) {
    console.warn("[courseAccess] Profile access fallback failed:", error);
    return null;
  }

  return data ?? null;
};

const addEntitlement = (
  entitlements: Map<string, CourseEntitlementSummary>,
  courseType: string,
  source: CourseEntitlementSummary["source"],
  enrollmentStatus?: string,
) => {
  const normalized = normalizeCourseType(courseType);
  if (!entitlements.has(normalized)) {
    entitlements.set(normalized, {
      course_type: courseType,
      source,
      enrollment_status: enrollmentStatus,
    });
  }
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

export const fetchMyCourseEntitlements = async (userId: string): Promise<CourseEntitlementSummary[]> => {
  await syncEnrollmentsForCurrentSession();

  const profileAccess = await fetchProfileAccessData(userId);
  if (profileAccess) {
    const entitlements = new Map<string, CourseEntitlementSummary>();

    for (const row of profileAccess.enrollments ?? []) {
      if (!row.enrollment_status || ACTIVE_ENROLLMENT_STATUSES.includes(row.enrollment_status)) {
        addEntitlement(entitlements, row.course_type, "enrollment", row.enrollment_status);
      }
    }

    for (const row of profileAccess.completions ?? []) {
      addEntitlement(entitlements, row.course_type, "completion");
    }

    for (const row of profileAccess.certificates ?? []) {
      addEntitlement(entitlements, row.course_type, "completion");
    }

    if (entitlements.size > 0) {
      return Array.from(entitlements.values());
    }
  }

  const [enrollmentResult, progressResult, completionResult] = await Promise.all([
    supabase
      .from("enrollments")
      .select("course_type, enrollment_status")
      .eq("user_id", userId)
      .in("enrollment_status", ACTIVE_ENROLLMENT_STATUSES),
    supabase
      .from("course_progress")
      .select("course_type")
      .eq("user_id", userId),
    supabase
      .from("course_completions")
      .select("course_type")
      .eq("user_id", userId),
  ]);

  const errors = [enrollmentResult.error, progressResult.error, completionResult.error].filter(Boolean);
  if (errors.length > 0) {
    throw errors[0];
  }

  const entitlements = new Map<string, CourseEntitlementSummary>();

  for (const row of enrollmentResult.data ?? []) {
    addEntitlement(entitlements, row.course_type, "enrollment", row.enrollment_status);
  }

  for (const row of progressResult.data ?? []) {
    addEntitlement(entitlements, row.course_type, "progress");
  }

  for (const row of completionResult.data ?? []) {
    addEntitlement(entitlements, row.course_type, "completion");
  }

  return Array.from(entitlements.values());
};

export const checkCourseAccess = async (userId: string, courseId: CourseAccessId | string) => {
  await syncEnrollmentsForCurrentSession();

  const courseAliases = getCourseAliases(courseId);
  const profileAccess = await fetchProfileAccessData(userId);

  if (profileAccess) {
    const enrollment = (profileAccess.enrollments ?? []).find(
      (row) => courseAliases.includes(row.course_type) && (!row.enrollment_status || ACTIVE_ENROLLMENT_STATUSES.includes(row.enrollment_status))
    );
    const completion = (profileAccess.completions ?? []).find((row) => courseAliases.includes(row.course_type));
    const certificate = (profileAccess.certificates ?? []).find((row) => courseAliases.includes(row.course_type));

    if (enrollment || completion || certificate) {
      return {
        enrollment: enrollment ? { id: "profile-recovery", enrollment_status: enrollment.enrollment_status, course_type: enrollment.course_type } : null,
        progress: null,
        completion: completion || certificate ? { id: "profile-recovery", passed: true } : null,
        errors: {
          enrollment: null,
          progress: null,
          completion: null,
        },
        hasAccess: true,
      };
    }
  }

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