import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { ensureUser, joinWaitlist } from "../../lib/usage";

/**
 * POST /api/waitlist
 *
 * Called when a logged-in free user hits the paywall and submits
 * their intent to join Skillet Pro.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      message: "Char doesn't know that move.",
    });
  }

  try {
    let clerkUserId: string | null = null;
    try {
      const auth = getAuth(req);
      clerkUserId = auth.userId;
    } catch (authError) {
      console.error("Clerk getAuth threw on waitlist:", authError);
    }

    if (!clerkUserId) {
      return res.status(401).json({
        ok: false,
        message: "Sign in first, chef.",
      });
    }

    const user = await ensureUser(clerkUserId);
    await joinWaitlist(user.id);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Waitlist endpoint error:", error);
    return res.status(500).json({
      ok: false,
      message: "Something's smoking back here. Refresh and try again.",
    });
  }
}
