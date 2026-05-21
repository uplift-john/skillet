import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SignInButton } from "@clerk/nextjs";
import { COLORS, Char, ChunkyButton } from "./brand";

/**
 * LoginWall — shown when an anonymous user clicks to reveal Layer 2/3.
 * Char in disappointed-but-hopeful state, smaller and looking up.
 * Uses Clerk's modal sign-in to preserve app state.
 */
export default function LoginWall({ onClose }) {
  const [showWhy, setShowWhy] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mt-10 pt-8"
      style={{ borderTop: `2px dashed ${COLORS.cream}33` }}
    >
      <div className="flex flex-col items-center text-center px-4">
        {/* Char — disappointed but hopeful, smaller */}
        <div className="mb-6">
          <Char mood="disappointed" size={80} withSkillet={false} />
        </div>

        <h2
          className="font-display mb-4"
          style={{
            fontSize: "clamp(32px, 7vw, 48px)",
            lineHeight: 0.95,
            color: COLORS.cream,
          }}
        >
          "Sign in to see the damage."
        </h2>

        <p
          className="font-display text-lg sm:text-xl mb-8 max-w-md mx-auto"
          style={{ color: COLORS.cream, opacity: 0.9, lineHeight: 1.2 }}
        >
          Layer 1 was the appetizer, chef. The scorecard is where I actually do
          the math you should have done.
        </p>

        {/* Sign in button — Clerk modal keeps app state intact */}
        <SignInButton mode="modal">
          <ChunkyButton color={COLORS.hotPink} size="lg">
            Sign in with Google
          </ChunkyButton>
        </SignInButton>

        {/* Why link */}
        <button
          onClick={() => setShowWhy(!showWhy)}
          className="mt-5 font-body text-sm underline underline-offset-4 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
          style={{ color: COLORS.cream }}
        >
          Why do you need my email? →
        </button>

        <AnimatePresence>
          {showWhy && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="font-body text-sm mt-3 max-w-sm mx-auto overflow-hidden"
              style={{ color: COLORS.cream, opacity: 0.7, lineHeight: 1.5 }}
            >
              Because I'm not your free entertainment, chef. Free for 3 a month.
              Pay for more if you're cooking a lot.
            </motion.p>
          )}
        </AnimatePresence>

        {/* Back button */}
        {onClose && (
          <button
            onClick={onClose}
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
