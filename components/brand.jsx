import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// BRAND TOKENS
// ─────────────────────────────────────────────────────────────────────────────
export const COLORS = {
  charBlack: "#1A1A1A",
  hotPink: "#FF2E6E",
  emberOrange: "#FF6B1A",
  infernoBlue: "#2E7BFF",
  cream: "#F5EDE0",
  greaseGold: "#E8B84E",
  dimEmber: "#8A4A2A",
};

// ─────────────────────────────────────────────────────────────────────────────
// CHAR — the mascot. SVG flame with two eyes, no mouth.
// Color and shape ARE the expression.
// ─────────────────────────────────────────────────────────────────────────────
export const CHAR_MOODS = {
  idle: { color: COLORS.hotPink, glow: COLORS.hotPink, scale: 1, eyeOffset: 0, jagged: 0 },
  listening: { color: COLORS.emberOrange, glow: COLORS.emberOrange, scale: 1.08, eyeOffset: 2, jagged: 0 },
  thinking: { color: COLORS.emberOrange, glow: COLORS.hotPink, scale: 1.18, eyeOffset: 0, jagged: 0.3 },
  approving: { color: COLORS.greaseGold, glow: COLORS.greaseGold, scale: 1.05, eyeOffset: -1, jagged: 0 },
  disappointed: { color: COLORS.dimEmber, glow: COLORS.dimEmber, scale: 0.85, eyeOffset: 3, jagged: 0 },
  furious: { color: COLORS.infernoBlue, glow: COLORS.infernoBlue, scale: 1.35, eyeOffset: -2, jagged: 0.7 },
};

export function Char({ mood = "idle", size = 96, withSkillet = true, sparks = false }) {
  const m = CHAR_MOODS[mood] || CHAR_MOODS.idle;
  const flickerDuration = mood === "furious" ? 0.35 : mood === "thinking" ? 0.6 : 1.4;

  const calmPath =
    "M50 95 C 22 95, 14 70, 22 52 C 28 38, 34 42, 36 30 C 38 18, 46 12, 50 5 C 54 12, 62 18, 64 30 C 66 42, 72 38, 78 52 C 86 70, 78 95, 50 95 Z";
  const tallPath =
    "M50 96 C 20 96, 10 68, 20 46 C 28 30, 32 36, 34 22 C 36 10, 46 4, 50 -2 C 54 4, 64 10, 66 22 C 68 36, 72 30, 80 46 C 90 68, 80 96, 50 96 Z";
  const jaggedPath =
    "M50 96 C 18 96, 8 70, 18 48 C 24 34, 30 44, 30 28 C 34 22, 36 12, 42 6 C 46 14, 50 0, 54 8 C 58 14, 62 4, 66 22 C 68 36, 76 32, 82 48 C 92 70, 82 96, 50 96 Z";

  const innerColor = mood === "furious" ? "#9DC4FF" : mood === "approving" ? "#FFE9A8" : "#FFD4A8";

  const [pathFrame, setPathFrame] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setPathFrame((f) => f + 1), flickerDuration * 650);
    return () => clearInterval(interval);
  }, [flickerDuration]);

  const skilletH = withSkillet ? Math.round(size * 0.22) : 0;
  const gap = withSkillet ? Math.round(size * 0.04) : 0;
  const flameH = Math.round(size * 1.15);
  const wrapperH = flameH + gap + skilletH;

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: wrapperH, lineHeight: 0 }}
    >
      <div className="absolute" style={{ left: 0, top: 0, width: size, height: flameH }}>
        <AnimatePresence>
          {sparks && (
            <>
              {[...Array(8)].map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                return (
                  <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                      x: Math.cos(angle) * size * 0.9,
                      y: Math.sin(angle) * size * 0.9,
                      opacity: 0,
                      scale: 0.3,
                    }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      left: "50%",
                      top: "40%",
                      width: 6,
                      height: 6,
                      background: COLORS.greaseGold,
                      boxShadow: `0 0 8px ${COLORS.hotPink}`,
                    }}
                  />
                );
              })}
            </>
          )}
        </AnimatePresence>

        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 55%, ${m.glow}55 0%, transparent 60%)`,
            filter: "blur(8px)",
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: flickerDuration * 1.5, repeat: Infinity }}
        />

        <motion.svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full overflow-visible"
          style={{ transformOrigin: "50% 95%" }}
          animate={{
            scale: [m.scale, m.scale * 1.04, m.scale * 0.98, m.scale],
            rotate: mood === "furious" ? [-3, 3, -2, 3, -3] : [-1, 1.2, -0.8, 1, -1],
          }}
          transition={{ duration: flickerDuration, repeat: Infinity, ease: "easeInOut" }}
        >
          <defs>
            <radialGradient id={`flame-${mood}`} cx="50%" cy="70%" r="50%">
              <stop offset="0%" stopColor={innerColor} />
              <stop offset="60%" stopColor={m.color} />
              <stop offset="100%" stopColor={m.color} />
            </radialGradient>
          </defs>
          <path
            fill={`url(#flame-${mood})`}
            d={
              mood === "furious"
                ? (pathFrame % 2 === 0 ? jaggedPath : tallPath)
                : mood === "thinking"
                ? (pathFrame % 2 === 0 ? tallPath : calmPath)
                : mood === "disappointed"
                ? calmPath
                : (pathFrame % 2 === 0 ? calmPath : tallPath)
            }
            style={{ transition: `d ${flickerDuration * 0.65}s ease-in-out` }}
          />
          <g style={{ transform: `translateY(${m.eyeOffset}px)` }}>
            <ellipse cx="40" cy="60" rx="5" ry={mood === "furious" ? 7 : 5.5} fill={COLORS.charBlack} />
            <ellipse cx="60" cy="60" rx="5" ry={mood === "furious" ? 7 : 5.5} fill={COLORS.charBlack} />
            <circle cx="41.5" cy="58" r="1.3" fill={COLORS.cream} />
            <circle cx="61.5" cy="58" r="1.3" fill={COLORS.cream} />
            {(mood === "furious" || mood === "disappointed") && (
              <>
                <path
                  d={mood === "furious" ? "M32 50 L46 56" : "M32 56 L46 52"}
                  stroke={COLORS.charBlack}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d={mood === "furious" ? "M68 50 L54 56" : "M68 56 L54 52"}
                  stroke={COLORS.charBlack}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </>
            )}
          </g>
        </motion.svg>
      </div>

      {withSkillet && (
        <svg
          viewBox="0 0 168 28"
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            left: -size * 0.2,
            bottom: 0,
            width: size * 1.4,
            height: skilletH,
          }}
        >
          <rect x="116" y="11" width="48" height="6" rx="3" fill="#0E0E0E" />
          <rect x="156" y="9" width="10" height="10" rx="2" fill="#0E0E0E" />
          <ellipse cx="60" cy="14" rx="58" ry="10" fill="#0E0E0E" />
          <ellipse cx="60" cy="11" rx="52" ry="6" fill="#222" opacity="0.6" />
          <ellipse cx="42" cy="9" rx="14" ry="1.6" fill="#3a3a3a" opacity="0.7" />
        </svg>
      )}
    </div>
  );
}

export function ChunkyButton({ children, onClick, color = COLORS.hotPink, textColor = COLORS.cream, full = false, size = "lg", disabled }) {
  const padding = size === "lg" ? "px-7 py-4 text-lg" : size === "md" ? "px-5 py-3 text-base" : "px-4 py-2 text-sm";
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { y: 4, boxShadow: `0 0px 0 ${COLORS.charBlack}` }}
      whileHover={disabled ? {} : { y: -1 }}
      transition={{ type: "spring", stiffness: 600, damping: 25 }}
      className={`relative font-display ${padding} rounded-xl border-2 select-none ${full ? "w-full" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      style={{
        background: color,
        color: textColor,
        borderColor: COLORS.charBlack,
        boxShadow: `4px 4px 0 ${COLORS.charBlack}`,
        textShadow: "none",
      }}
    >
      {children}
    </motion.button>
  );
}
