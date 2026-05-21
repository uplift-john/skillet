import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabase } from "../../lib/supabase";

/**
 * POST /api/log-share
 *
 * Marks a roast as shared. Fire-and-forget from the client.
 *
 * Body: { roastId: string }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { roastId } = req.body;

  if (!roastId || typeof roastId !== "string" || roastId.startsWith("local_")) {
    return res.status(200).json({ ok: true });
  }

  try {
    const supabase = getSupabase();
    await supabase
      .from("roasts")
      .update({ shared: true })
      .eq("id", roastId);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Share logging failed:", error);
    // Non-critical — don't bother the user with share-tracking failures
    return res.status(200).json({ ok: true });
  }
}
