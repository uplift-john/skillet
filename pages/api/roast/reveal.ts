import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { getSupabase } from "../../../lib/supabase";
import { ensureUser, canRevealFullRoast, incrementUsage } from "../../../lib/usage";

/**
 * POST /api/roast/reveal
 *
 * Called when a logged-in user clicks to reveal layers 2/3.
 * Checks auth, checks monthly usage, increments counter,
 * updates roast record.
 *
 * Body: {
 *   roastId: string,
 *   layer: 2 | 3,
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      allowed: false,
      message: "Char doesn't know that move.",
    });
  }

  try {
    // --- Auth check (wrapped — getAuth can throw on malformed/expired tokens) ---
    let clerkUserId: string | null = null;
    try {
      const auth = getAuth(req);
      clerkUserId = auth.userId;
    } catch (authError) {
      console.error("Clerk getAuth threw:", authError);
      // Malformed or expired token — treat as unauthenticated
    }

    if (!clerkUserId) {
      return res.status(401).json({
        allowed: false,
        loginRequired: true,
        message: "Sign in to see the damage.",
      });
    }

    const { roastId, layer } = req.body;

    if (!roastId || ![2, 3].includes(layer)) {
      return res.status(400).json({
        allowed: false,
        message: "Char got a weird order. Try that again.",
      });
    }

    // --- Resolve user ---
    let user;
    try {
      user = await ensureUser(clerkUserId);
    } catch (userError) {
      console.error("User sync failed on reveal:", userError);
      return res.status(500).json({
        allowed: false,
        message: "Something's smoking back here. Refresh and try again.",
      });
    }

    // --- Check usage (now wrapped in try/catch) ---
    let usage;
    try {
      usage = await canRevealFullRoast(user.id, user.plan);
    } catch (usageError) {
      console.error("Usage check failed on reveal:", usageError);
      // Supabase is down — can't verify usage.
      // Allow the reveal rather than false-blocking. The increment
      // will catch up when Supabase recovers.
      usage = { allowed: true, used: 0, limit: 3 };
    }

    if (!usage.allowed) {
      return res.status(403).json({
        allowed: false,
        paywall: true,
        used: usage.used,
        limit: usage.limit,
        message: "You've roasted 3 ideas this month. That's the free tier, chef.",
      });
    }

    // --- Increment usage only on first reveal to layer 2 ---
    if (layer === 2) {
      try {
        const newCount = await incrementUsage(user.id);
        usage.used = newCount;
      } catch (incError) {
        console.error("Usage increment failed:", incError);
        // If we can't increment, still allow — better than false-blocking.
      }
    }

    // --- Update roast record ---
    try {
      const supabase = getSupabase();
      if (!roastId.startsWith("local_")) {
        await supabase
          .from("roasts")
          .update({ layers_revealed: layer })
          .eq("id", roastId)
          .lt("layers_revealed", layer);
      }
    } catch (updateError) {
      console.error("Roast layer update failed:", updateError);
      // Non-critical tracking — roast still works
    }

    return res.status(200).json({
      allowed: true,
      used: usage.used,
      limit: usage.limit,
    });
  } catch (error) {
    console.error("Reveal endpoint error:", error);
    return res.status(500).json({
      allowed: false,
      message: "Char's notebook is on fire. Try again in a minute.",
    });
  }
}
