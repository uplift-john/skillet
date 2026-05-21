import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COLORS, Char, ChunkyButton } from "./brand";

/**
 * Paywall — shown when a logged-in free user exhausts their 3/month Layer 2/3 reveals.
 * Three states: gate (default), submitting, success.
 *
 * Props:
 *   used: number — how many full roasts used this month
 *   onJoinWaitlist: () => Promise<void> — calls /api/waitlist
 *   onBack: () => void — "Back to the kitchen" action
 */
export default function Paywall({ used = 3, onJoinWaitlist, onBack }) {
  const [state, setState] = useState("gate"); // gate | submitting | success | error

  const handleSubmit = async () => {
    setState("submitting");
    try {
      await onJoinWaitlist();
      setState("success");
    } catch {
      setState("error");
      setTimeout(() => setState("gate"), 3000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mt-10 pt-8"
      style={{ borderTop: `2px dashed ${COLORS.cream}33` }}
    >
      <div className="flex flex-col items-center text-center px-4">
        <AnimatePresence mode="wait">
          {/* ─── GATE STATE ─── */}
          {(state === "gate" || state === "submitting" || state === "error") && (
            <motion.div
              key="gate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              {/* Char — furious, Inferno Blue */}
              <div className="mb-6">
                <Char mood="furious" size={110} withSkillet={false} />
              </div>

              <h2
                className="font-display mb-4"
                style={{
                  fontSize: "clamp(28px, 6vw, 42px)",
                  lineHeight: 0.95,
                  color: COLORS.infernoBlue,
                }}
              >
                "You've roasted {used} ideas this month."
              </h2>

              <p
                className="font-display text-lg sm:text-xl mb-8 max-w-md mx-auto"
                style={{ color: COLORS.cream, opacity: 0.9, lineHeight: 1.2 }}
              >
                That's the free tier, chef. I have a mortgage. The robots aren't
                cheap. Either wait until next month or get on the list for
                Skillet Pro.
              </p>

              <ChunkyButton
                onClick={handleSubmit}
                color={COLORS.hotPink}
                size="lg"
                disabled={state === "submitting"}
              >
                {state === "submitting"
                  ? "Joining..."
                  : state === "error"
                  ? "Something broke — try again"
                  : "Tell me when Pro lands"}
              </ChunkyButton>

              <p
                className="font-body text-sm mt-5 max-w-sm mx-auto"
                style={{ color: COLORS.cream, opacity: 0.5, lineHeight: 1.4 }}
              >
                Pro is $5/mo. Unlimited roasts. Char's full attention. Coming
                soon.
              </p>
            </motion.div>
          )}

          {/* ─── SUCCESS STATE ─── */}
          {state === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex flex-col items-center"
            >
              {/* Char — approving, Grease Gold */}
              <div className="mb-6">
                <Char mood="approving" size={100} withSkillet={false} />
              </div>

              <h2
                className="font-display mb-4"
                style={{
                  fontSize: "clamp(32px, 7vw, 48px)",
                  lineHeight: 0.95,
                  color: COLORS.greaseGold,
                }}
              >
                "You're on the list."
              </h2>

              <p
                className="font-display text-lg sm:text-xl mb-8 max-w-md mx-auto"
                style={{ color: COLORS.cream, opacity: 0.9, lineHeight: 1.2 }}
              >
                I'll have the robots send you a note when Pro is open. Try not
                to do anything stupid in the meantime.
              </p>

              <ChunkyButton
                onClick={onBack}
                color={COLORS.greaseGold}
                textColor={COLORS.charBlack}
                size="lg"
              >
                Back to the kitchen
              </ChunkyButton>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back link — always visible in gate state */}
        {state !== "success" && onBack && (
          <button
            onClick={onBack}
            className="mt-6 font-mono text-xs uppercase tracking-widest opacity-40 hover:opacity-70 transition-opacity cursor-pointer"
            style={{ color: COLORS.cream }}
          >
            [ back to verdict ]
          </button>
        )}
      </div>
    </motion.div>
  );
}
