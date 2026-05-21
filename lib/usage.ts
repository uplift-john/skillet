import { getSupabase } from "./supabase";

/**
 * Ensure a Supabase user row exists for this Clerk user.
 * Lazy creation (option 2): first API call creates the row.
 * Returns the Supabase user row.
 */
export async function ensureUser(clerkUserId: string, email?: string | null) {
  const supabase = getSupabase();

  // Try to find existing user first
  const { data: existing, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (existing) return existing;

  // Create new user — retry once on conflict (race condition from parallel requests)
  const { data: created, error: createError } = await supabase
    .from("users")
    .insert({ clerk_user_id: clerkUserId, email: email || null })
    .select()
    .single();

  if (createError) {
    // Unique constraint violation — another request created the row first
    if (createError.code === "23505") {
      const { data: raceWinner, error: raceError } = await supabase
        .from("users")
        .select("*")
        .eq("clerk_user_id", clerkUserId)
        .single();
      if (raceError) throw raceError;
      return raceWinner;
    }
    throw createError;
  }

  return created;
}

/**
 * Get the current month's full-roast count for a user.
 * Returns 0 if no row exists yet.
 */
export async function getMonthlyUsage(userId: string): Promise<number> {
  const supabase = getSupabase();
  const yearMonth = getCurrentYearMonth();

  const { data, error } = await supabase
    .from("monthly_usage")
    .select("full_roast_count")
    .eq("user_id", userId)
    .eq("year_month", yearMonth)
    .maybeSingle();

  if (error) throw error;
  return data?.full_roast_count ?? 0;
}

/**
 * Increment the monthly full-roast count by 1.
 * Upserts the row if it doesn't exist.
 */
export async function incrementUsage(userId: string): Promise<number> {
  const supabase = getSupabase();
  const yearMonth = getCurrentYearMonth();

  // Upsert: insert or increment
  const { data, error } = await supabase.rpc("increment_monthly_usage", {
    p_user_id: userId,
    p_year_month: yearMonth,
  });

  if (error) throw error;
  return data as number;
}

/**
 * Check if a user has reached their monthly limit.
 * Pro users are unlimited. Free users get 3 per month.
 */
export async function canRevealFullRoast(
  userId: string,
  plan: string
): Promise<{ allowed: boolean; used: number; limit: number }> {
  if (plan === "pro") {
    return { allowed: true, used: 0, limit: Infinity };
  }

  const used = await getMonthlyUsage(userId);
  const limit = 3;
  return { allowed: used < limit, used, limit };
}

/**
 * Join the waitlist — sets waitlist_joined_at if not already set.
 */
export async function joinWaitlist(userId: string): Promise<void> {
  const supabase = getSupabase();

  await supabase
    .from("users")
    .update({ waitlist_joined_at: new Date().toISOString() })
    .eq("id", userId)
    .is("waitlist_joined_at", null);
}

function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
