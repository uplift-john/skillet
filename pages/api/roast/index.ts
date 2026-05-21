import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { getSupabase } from "../../../lib/supabase";
import { getAnonymousRateLimiter } from "../../../lib/rate-limit";
import { ensureUser, canRevealFullRoast } from "../../../lib/usage";

/**
 * POST /api/roast
 *
 * Called after the client computes a verdict. Handles:
 * 1. Anonymous IP rate limiting (10/hr via Upstash)
 * 2. Logging the roast to Supabase
 * 3. Returning access permissions for layers 2/3
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Char doesn't know that move.",
    });
  }

  try {
    const {
      inputText,
      structuredAnswers,
      foolishnessScore,
      verdictLevel,
      verdictText,
      matchedScenario,
      anonymousSessionId,
    } = req.body;

    if (!inputText || !structuredAnswers) {
      return res.status(400).json({
        error: "Char got a weird order. Try that again.",
      });
    }

    // --- Auth check (wrapped — getAuth can throw on malformed/expired tokens) ---
    let clerkUserId: string | null = null;
    try {
      const auth = getAuth(req);
      clerkUserId = auth.userId;
    } catch (authError) {
      console.error("Clerk getAuth threw:", authError);
      // Malformed or expired token — treat as anonymous
    }

    const ip = getClientIp(req);

    // --- Rate limit anonymous users ---
    if (!clerkUserId) {
      try {
        const limiter = getAnonymousRateLimiter();
        const { success, remaining, reset } = await limiter.limit(
          ip || "unknown"
        );

        if (!success) {
          return res.status(429).json({
            rateLimited: true,
            message:
              "10 ideas in an hour is a lot of bad ideas. Come back in a bit. Or sign in if you're serious about this.",
            remaining: 0,
            resetAt: reset,
          });
        }
      } catch (rateLimitError) {
        // Upstash is down — let the request through.
        // Failing open: brief unmetered access beats blocking all users.
        console.error("Rate limit check failed (Upstash may be down):", rateLimitError);
      }
    }

    // --- Resolve user ---
    let supabaseUserId: string | null = null;
    let plan = "free";

    if (clerkUserId) {
      try {
        const user = await ensureUser(clerkUserId);
        supabaseUserId = user.id;
        plan = user.plan;
      } catch (userError) {
        console.error("User sync failed:", userError);
        // Supabase is down or user creation failed.
        // Still serve the roast — we'll create the user next time.
      }
    }

    // --- Log roast to Supabase ---
    let roastId: string | null = null;

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("roasts")
        .insert({
          user_id: supabaseUserId,
          anonymous_session_id: anonymousSessionId || null,
          ip_address: ip,
          input_text: inputText,
          structured_answers: structuredAnswers,
          foolishness_score: foolishnessScore,
          verdict_level: verdictLevel,
          verdict_text: verdictText,
          layers_revealed: 1,
          matched_scenario: matchedScenario || null,
        })
        .select("id")
        .single();

      if (error) throw error;
      roastId = data.id;
    } catch (logError) {
      console.error("Roast logging failed (Supabase may be down):", logError);
      // Fallback ID so the UI still works. Log is lost but roast is served.
      roastId = `local_${Date.now().toString(36)}`;
    }

    // --- Access check for layers 2/3 ---
    let access = { canRevealFull: false, used: 0, limit: 3 };

    if (supabaseUserId) {
      try {
        const usage = await canRevealFullRoast(supabaseUserId, plan);
        access = {
          canRevealFull: usage.allowed,
          used: usage.used,
          limit: usage.limit,
        };
      } catch (usageError) {
        console.error("Usage check failed:", usageError);
        // Default to allowing — the reveal endpoint double-checks.
        access = { canRevealFull: true, used: 0, limit: 3 };
      }
    }

    return res.status(200).json({
      roastId,
      access,
      isAuthenticated: !!clerkUserId,
    });
  } catch (error) {
    console.error("Roast endpoint error:", error);
    return res.status(500).json({
      error: "Char's having a moment. Try again in a sec.",
    });
  }
}

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0];
  return req.socket?.remoteAddress || "unknown";
}
