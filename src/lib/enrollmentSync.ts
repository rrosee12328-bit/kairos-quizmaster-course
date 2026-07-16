import { supabase } from "@/integrations/supabase/client";

export const syncEnrollmentsForCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return null;
  }

  const { data, error } = await supabase.functions.invoke('sync-enrollment', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    console.warn('[enrollmentSync] Failed to sync enrollments:', error);
    return null;
  }

  return data;
};
