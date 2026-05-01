import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Inline icon components (replaces lucide-react to avoid bundling/named-export issues)
const Copy = ({ size = 16, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);
const Check = ({ size = 16, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const Flame = ({ size = 16, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// BRAND TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const COLORS = {
  charBlack: "#1A1A1A",
  hotPink: "#FF2E6E",
  emberOrange: "#FF6B1A",
  infernoBlue: "#2E7BFF",
  cream: "#F5EDE0",
  greaseGold: "#E8B84E",
  dimEmber: "#8A4A2A",
};

// Inject Google Fonts once
const FontLoader = () => {
  useEffect(() => {
    if (document.getElementById("skillet-fonts")) return;
    const link = document.createElement("link");
    link.id = "skillet-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.id = "skillet-base";
    style.textContent = `
      .font-display { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; letter-spacing: -0.03em; line-height: 0.95; }
      .font-body { font-family: 'Inter', sans-serif; }
      .font-mono { font-family: 'JetBrains Mono', monospace; }
      .skillet-root *::selection { background: ${COLORS.hotPink}; color: ${COLORS.cream}; }
      .skillet-root { -webkit-font-smoothing: antialiased; }
      .ticket-edge {
        --c: ${COLORS.charBlack};
        background-image:
          radial-gradient(circle at 6px 6px, transparent 4px, ${COLORS.cream} 4px);
        background-size: 12px 12px;
        background-position: 0 -6px;
      }
      @keyframes sizzleRise {
        0% { transform: translateY(0) scaleY(0.6); opacity: 0; }
        20% { opacity: 1; }
        100% { transform: translateY(-80px) scaleY(1.4); opacity: 0; }
      }
      .sizzle-line { animation: sizzleRise 1.6s ease-out infinite; }
      @keyframes flickerSway {
        0%, 100% { transform: translateX(-50%) rotate(-1.5deg); }
        50% { transform: translateX(-50%) rotate(1.5deg); }
      }
    `;
    document.head.appendChild(style);
  }, []);
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// CHAR — the mascot. SVG flame with two eyes, no mouth.
// Color and shape ARE the expression.
// ─────────────────────────────────────────────────────────────────────────────
const CHAR_MOODS = {
  idle: { color: COLORS.hotPink, glow: COLORS.hotPink, scale: 1, eyeOffset: 0, jagged: 0 },
  listening: { color: COLORS.emberOrange, glow: COLORS.emberOrange, scale: 1.08, eyeOffset: 2, jagged: 0 },
  thinking: { color: COLORS.emberOrange, glow: COLORS.hotPink, scale: 1.18, eyeOffset: 0, jagged: 0.3 },
  approving: { color: COLORS.greaseGold, glow: COLORS.greaseGold, scale: 1.05, eyeOffset: -1, jagged: 0 },
  disappointed: { color: COLORS.dimEmber, glow: COLORS.dimEmber, scale: 0.85, eyeOffset: 3, jagged: 0 },
  furious: { color: COLORS.infernoBlue, glow: COLORS.infernoBlue, scale: 1.35, eyeOffset: -2, jagged: 0.7 },
};

function Char({ mood = "idle", size = 96, withSkillet = true, sparks = false }) {
  const m = CHAR_MOODS[mood] || CHAR_MOODS.idle;
  const flickerDuration = mood === "furious" ? 0.35 : mood === "thinking" ? 0.6 : 1.4;

  // Two flame paths we morph between for natural flicker
  const calmPath =
    "M50 95 C 22 95, 14 70, 22 52 C 28 38, 34 42, 36 30 C 38 18, 46 12, 50 5 C 54 12, 62 18, 64 30 C 66 42, 72 38, 78 52 C 86 70, 78 95, 50 95 Z";
  const tallPath =
    "M50 96 C 20 96, 10 68, 20 46 C 28 30, 32 36, 34 22 C 36 10, 46 4, 50 -2 C 54 4, 64 10, 66 22 C 68 36, 72 30, 80 46 C 90 68, 80 96, 50 96 Z";
  const jaggedPath =
    "M50 96 C 18 96, 8 70, 18 48 C 24 34, 30 44, 30 28 C 34 22, 36 12, 42 6 C 46 14, 50 0, 54 8 C 58 14, 62 4, 66 22 C 68 36, 76 32, 82 48 C 92 70, 82 96, 50 96 Z";

  const innerColor = mood === "furious" ? "#9DC4FF" : mood === "approving" ? "#FFE9A8" : "#FFD4A8";

  // State-driven path swap (avoids Framer Motion v11 + Next.js issue with animated d attr)
  const [pathFrame, setPathFrame] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setPathFrame((f) => f + 1), flickerDuration * 650);
    return () => clearInterval(interval);
  }, [flickerDuration]);

  // Layout: flame floats ABOVE the skillet with a small gap. Total height = flame + gap + skillet.
  const skilletH = withSkillet ? Math.round(size * 0.22) : 0;
  const gap = withSkillet ? Math.round(size * 0.04) : 0;
  const flameH = Math.round(size * 1.15);
  const wrapperH = flameH + gap + skilletH;

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: wrapperH, lineHeight: 0 }}
    >
      {/* FLAME LAYER — floats above the skillet */}
      <div className="absolute" style={{ left: 0, top: 0, width: size, height: flameH }}>
        {/* sparks burst */}
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

        {/* glow halo */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 55%, ${m.glow}55 0%, transparent 60%)`,
            filter: "blur(8px)",
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: flickerDuration * 1.5, repeat: Infinity }}
        />

        {/* the flame body */}
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
          {/* eyes */}
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

      {/* SKILLET — separate, sitting BELOW the flame with a small gap */}
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
          {/* handle */}
          <rect x="116" y="11" width="48" height="6" rx="3" fill="#0E0E0E" />
          <rect x="156" y="9" width="10" height="10" rx="2" fill="#0E0E0E" />
          {/* pan body */}
          <ellipse cx="60" cy="14" rx="58" ry="10" fill="#0E0E0E" />
          <ellipse cx="60" cy="11" rx="52" ry="6" fill="#222" opacity="0.6" />
          {/* shine */}
          <ellipse cx="42" cy="9" rx="14" ry="1.6" fill="#3a3a3a" opacity="0.7" />
        </svg>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIOS — the 5 hardcoded scenarios with full content
// ─────────────────────────────────────────────────────────────────────────────
const SCENARIOS = {
  customerSupport: {
    keywords: ["customer support", "support ticket", "tickets", "saas", "draft response", "draft replies", "draft reply"],
    level: 1,
    mood: "approving",
    verdict: "Order up, chef.",
    roast:
      "Well, look who finally read the manual. High volume, structured output, human in the loop on every reply — this is a textbook use case and you stumbled into it like a man finding his glasses on his own face. Take the W. I'm not handing them out twice.",
    revealCta: "Reveal the scorecard",
    layer3Cta: "Show me how to actually do this",
    overall: 8.2,
    overallWord: "Cook it.",
    scorecard: [
      { name: "Task Fit", score: 9, note: "Drafting structured replies from a knowledge base is the LLM's whole personality. You picked the lane it was built for." },
      { name: "Cost at Scale", score: 8, note: "~800 tokens in / 400 out per ticket on Sonnet ≈ $0.0072 per ticket. 200/week = $1.44/week, $75/year. You spend more on coffee in a single morning." },
      { name: "Hallucination Risk", score: 7, note: "Real risk of inventing policies that don't exist — but you have a human reviewing every one, so the blast radius is contained. Don't get lazy and skip review. The day you skip review is the day this bites." },
      { name: "Human-in-the-Loop Need", score: 9, note: "You already designed for this. Gold star. Don't ruin it by getting cocky in month three." },
      { name: "Time-to-Value", score: 8, note: "Two days to set up a decent prompt + your top 20 macros. Pays for itself in week one." },
    ],
    bullets: [
      "Feed the model your last 100 closed tickets as examples. Don't write a clever prompt from scratch. Your real tickets are the prompt.",
      "Build a tiny knowledge base of your top 20 issues + canonical responses. Have the model retrieve from these instead of inventing policy. This kills 80% of your hallucination risk for one afternoon of work.",
      "Set the draft to land in your reviewer's queue, not the customer's inbox. \"Draft,\" not \"Send.\" Never \"Send\" without a human click. Ever. I will know.",
      "Track the edit distance. If your reviewer is rewriting >50% of every draft, the model isn't helping — it's adding a step. Kill it and try again with a better prompt or better examples.",
      "Use Claude Haiku for the first pass, not Sonnet. It's 5x cheaper and good enough for first drafts. Save Sonnet for the gnarly edge cases. Your $75/year becomes $15/year and your reviewers don't notice the difference.",
    ],
    promptIntro: "Here. Don't make me regret this.",
    prompt: `You are a customer support draft writer for [COMPANY NAME], 
a [ONE-LINE COMPANY DESCRIPTION].

Your job: write a polite, accurate first-draft reply to the 
customer ticket below. A human will review and send.

RULES:
- Use ONLY the information in the knowledge base below. 
  Do not invent policies, prices, refund terms, or features.
- If the ticket asks something not covered by the knowledge 
  base, draft a reply that politely asks the customer for 
  clarification OR escalates to a human teammate. Do not guess.
- Match our tone: [warm/professional/casual — pick one and 
  paste 2 example replies showing it].
- Keep it under 150 words unless the issue genuinely requires more.
- End with: "— [Reviewer will sign]"

KNOWLEDGE BASE:
[paste your top 20 issues + canonical responses here]

EXAMPLE GOOD REPLIES (from our actual past tickets):
[paste 3-5 real closed tickets, anonymized]

CUSTOMER TICKET:
[ticket content]

Draft reply:`,
  },

  linkedinBirthday: {
    keywords: ["linkedin", "birthday", "birthdays", "connections"],
    level: 5,
    mood: "furious",
    verdict: "This is the dumbest thing I've heard all week, and it's Tuesday.",
    roast:
      "You want the silicon to do the one part of human connection that's supposed to be human, so you can fake caring about people you already barely know. Touch grass. Hug a person. Reconsider the choices that brought you to this exact moment.",
    revealCta: "Show me the damage",
    layer3Cta: "Tell me what to do instead",
    overall: 3.0,
    overallWord: "Sent back. With prejudice.",
    scorecard: [
      { name: "Task Fit", score: 3, note: "LLMs can do this. They shouldn't. The whole point of a birthday message is that a human spent thirty seconds thinking about you. You are removing the entire payload and shipping the empty box." },
      { name: "Cost at Scale", score: 5, note: "~300 tokens out per message on Sonnet ≈ $0.005 each. 5/day = $9/year. The money isn't the problem. The soul is the problem." },
      { name: "Hallucination Risk", score: 4, note: "The model will absolutely invent a shared memory you don't have. \"Happy birthday Karen, still thinking about that conference in Denver!\" Karen has never been to Denver. Karen knows. Karen tells her friends. Karen's friends are also your connections." },
      { name: "Human-in-the-Loop Need", score: 1, note: "You said you'd send these direct. Without review. To real humans. With names. I need a moment." },
      { name: "Time-to-Value", score: 2, note: "Setup time exceeds the time to just... not do this. Or to write three real ones to people you actually like. The math is not mathing." },
    ],
    bullets: [
      "Pick 10 people you actually care about. Write them real birthday messages, by hand, when their birthday comes up. Done. Free. Better. Revolutionary, even.",
      "If \"maintaining your network\" is the real goal, do it on purpose. Block 30 minutes a month, scroll through LinkedIn, leave 10 thoughtful comments on posts. That builds relationships. Birthday spam does not. Birthday spam builds suspicion.",
      "If you must automate something: automate the reminder, not the message. A calendar prompt that says \"Hey, today is Karen's birthday — write her something real if you want to\" gets you the prompt without the lie.",
      "Consider what you're optimizing for. If the answer is \"appearing thoughtful with no thought,\" the universe is going to bill you for that eventually. Usually with interest. Usually at the worst possible time.",
    ],
    promptIntro: "Fine. If you absolutely must, here. But know that I'm watching you.",
    prompt: `I need to remember important dates for the people who actually 
matter to me — not all 800 of my LinkedIn connections.

Below is a list of names. For each one, ask me ONE question:
"What's one specific thing you genuinely admire about this 
person, or one real memory you share?"

If I can't answer in under 30 seconds with something specific 
and true, that person doesn't make the list. Help me build a 
shortlist of 10-20 people whose birthdays I should actually 
acknowledge — personally, in my own words, on the day.

Names:
[paste list]

Start with the first name and wait for my answer before 
moving to the next.`,
  },

  meetingDigest: {
    keywords: ["meeting", "transcript", "transcripts", "digest", "summarize meeting", "summaries"],
    level: 3,
    mood: "listening",
    verdict: "Hard maybe.",
    roast:
      "The idea is reasonable. The execution will determine whether this saves you 30 minutes a day or quietly poisons your judgment for six months without you noticing. You're not asking me because you want my opinion. You're asking me because you already sense the catch. Pay attention.",
    revealCta: "Show me the math",
    layer3Cta: "Show me how to do this without poisoning my own judgment",
    overall: 5.4,
    overallWord: "Cook with caution.",
    scorecard: [
      { name: "Task Fit", score: 7, note: "Summarization is a core LLM strength. Cross-meeting synthesis (\"what themes emerged today?\") is harder and where most setups quietly fail without telling you." },
      { name: "Cost at Scale", score: 6, note: "15 meetings/day × ~8K input tokens (avg 30-min transcript) + 500 out per summary, plus a meta-summary across all 15 ≈ $0.45/day on Sonnet ≈ $165/year. Reasonable. Not nothing." },
      { name: "Hallucination Risk", score: 4, note: "This is the killer. The model will confidently misrepresent who said what, smooth over disagreements, and invent decisions that weren't made. You'll think you know what's happening and be subtly wrong. This is worse than not knowing — it's knowing wrong." },
      { name: "Human-in-the-Loop Need", score: 5, note: "You said \"just me, scanning.\" That's not review. That's vibes. If the only check is your skim at 7am with coffee, the bad summaries become your reality." },
      { name: "Time-to-Value", score: 5, note: "A week to set up well. Three months to learn whether it's actually making you a better leader or just a more confident wrong one." },
    ],
    bullets: [
      "Make every summary link back to the source. Every claim in the digest should have a timestamp + transcript link. If you can't verify in one click, you can't trust it. This single design choice prevents 90% of the slow-poison problem.",
      "Have it flag uncertainty, not hide it. Prompt the model to mark anything it's <80% confident about with a \"verify\" tag. Trust the tags more than the prose. The model is better at knowing what it doesn't know than at knowing what it does.",
      "Don't summarize across meetings on day one. Get single-meeting summaries working first. Cross-meeting synthesis is much harder and is where the hallucinations get expensive.",
      "Sanity-check weekly: pick one summary at random, read the full transcript, see how wrong it was. If it's significantly wrong more than 1 in 10, kill the project and just go to more meetings. I am serious about this.",
      "Sensitive data warning: If your transcripts include personnel discussions, comp, or legal stuff, you need an enterprise/zero-retention setup, not a hobbyist API call. Talk to whoever owns security at your company before you start piping HR conversations into a third-party API.",
    ],
    promptIntro: "This one's good. Use it. And actually do the weekly sanity check.",
    prompt: `You are summarizing a meeting transcript for [USER NAME], 
a [ROLE] at [COMPANY].

Produce a summary in this exact structure:

## TL;DR (2 sentences max)

## Key Decisions Made
- [decision] — [who decided] — [timestamp]
- (If no decisions were actually made, write "No decisions made.")

## Action Items  
- [item] — [owner] — [due date if mentioned] — [timestamp]

## Open Questions / Disagreements
- [question or unresolved point] — [timestamp]

## Things I'm Less Sure About
- [Anything you inferred rather than heard directly. Be 
  honest. If you're <80% confident, flag it here.]

RULES:
- Quote directly when attributing decisions or commitments 
  to specific people. Never paraphrase a commitment.
- If two people disagreed, say so. Do not smooth it over.
- Include timestamps for every item so [USER] can verify.
- If the transcript is unclear or you can't tell who said 
  what, say so explicitly under "Things I'm Less Sure About."

TRANSCRIPT:
[paste transcript]`,
  },

  weddingVows: {
    keywords: ["wedding", "vows", "vow"],
    level: 2,
    mood: "listening",
    verdict: "Workable. With adult supervision.",
    roast:
      "Three weeks at a blank page. I want you to sit with that. Three weeks. Of staring. At nothing. Okay — I'll help, but listen carefully: the machine is a thinking partner, not a ghostwriter. The moment you let it write the actual vows, your fiancée knows. They always know. Humans can smell ChatGPT on a wedding day the way dogs smell fear at the vet. Don't be the dog, chef.",
    revealCta: "Reveal the scorecard",
    layer3Cta: "Show me how to actually do this",
    overall: 8.2,
    overallWord: "Cook, carefully.",
    scorecard: [
      { name: "Task Fit", score: 6, note: "Brainstorming, structuring, finding the right metaphor — yes. Generating the final words — absolutely not. The medium is the message and the message is \"I personally wrote this for you.\"" },
      { name: "Cost at Scale", score: 10, note: "It's one document. Pennies. Don't worry about cost. Worry about whether you're going to cry at the altar for the right reasons." },
      { name: "Hallucination Risk", score: 7, note: "The model will make up specific shared memories you don't have. \"Remember our trip to Lisbon?\" You've never been to Lisbon. You're not getting married in Lisbon. Watch for this with violence." },
      { name: "Human-in-the-Loop Need", score: 10, note: "Every word in the final draft should be yours. Use the model to draft, react, refine — but type the final version with your own hands. The act of writing changes what you say. That change is the point." },
      { name: "Time-to-Value", score: 8, note: "Done in an evening if you use it as a brainstorming partner. Done in three months if you keep trying to \"perfect the prompt.\" You've already done three weeks. Don't do three more." },
    ],
    bullets: [
      "Don't ask for vows. Ask the model to interview you. \"Ask me 15 questions about my partner that will help me write my vows.\" Answer them out loud, voice-to-text. Now you have raw material that's yours.",
      "Use the model to find structure, not words. \"Here are my answers. What are the three themes that keep coming up?\" Then you write to those themes. The model finds the shape; you fill it.",
      "Ask it to mark anything it might have invented. Every time it references a memory or detail, prompt: \"Did I tell you that, or did you fill it in?\" The model will tell you the truth if you ask. It usually doesn't volunteer.",
      "Read the draft out loud before the wedding. If a single sentence sounds like a chatbot wrote it, cut it. Your voice or no voice. There is no third option.",
      "Reality check: The best vows in the world have typos and pauses and awkward true sentences. Don't optimize for \"really good.\" Optimize for \"really yours.\" The crying is automatic if you get the second one right.",
    ],
    promptIntro: "Do not skip the interview step. Do not ask it to write the vows. Do as I say, chef.",
    prompt: `I'm writing wedding vows for my partner, [PARTNER'S NAME]. 
I am NOT asking you to write the vows. I'm asking you to be 
my interviewer.

Step 1: Ask me 15 specific, thoughtful questions about my 
partner and our relationship that will help me write vows 
that sound like me. Ask them ONE AT A TIME. Wait for my 
answer before asking the next.

Good question examples:
- "What's a small moment that made you realize you wanted to 
   marry them?"
- "What's something they do that drives you crazy that you've 
   come to love anyway?"
- "What is a promise you've already silently made to them?"

Bad question examples (do NOT ask these):
- "How did you meet?" (too generic)
- "What do you love about them?" (too broad)

Step 2: After 15 questions, identify the 3 themes that came up 
most often in my answers. Show them to me. Do NOT draft vows.

Step 3: For each theme, surface the 2-3 most powerful specific 
moments or details from MY answers — quote me back to myself. 
This is my raw material.

I will write the actual vows. Your job ends at giving me the 
themes and the quotes. Do not draft. Do not "polish." Do not 
suggest phrases. Understood? Begin with question 1.`,
  },

  invoiceExtract: {
    keywords: ["invoice", "invoices", "vendor", "extract", "accounting", "line items"],
    level: 2,
    mood: "listening",
    verdict: "Yeah, sure, fine.",
    roast:
      "This is what the machine is for, but you picked the boring valid use case so I can't even have fun with you. You walked into a comedy club and ordered a salad. Fine. Let's cook.",
    revealCta: "Show me the scorecard",
    layer3Cta: "Show me how to actually do this",
    overall: 5.0,
    overallWord: "Cook with a human watching.",
    scorecard: [
      { name: "Task Fit", score: 8, note: "Structured extraction from semi-structured documents is the LLM's bread and butter. But — this is also what dedicated OCR + extraction tools (Rossum, Docparser, Mindee) do for 1/5 the cost. The LLM is the flashy choice; the boring tool might be the right one. Boring is allowed to win sometimes." },
      { name: "Cost at Scale", score: 5, note: "~3K input tokens per invoice (image + prompt) + 500 out on Sonnet ≈ $0.012/invoice. 500/month = $6/month, $72/year. Cheap. But dedicated extraction is ~$0.002-0.005/invoice. At 5,000/month it matters; at 500/month, it's a coffee budget." },
      { name: "Hallucination Risk", score: 3, note: "This is the issue. LLMs occasionally just... make up an amount. \"$1,247.83\" becomes \"$1,427.83.\" If that goes straight into your books, you have a problem the auditors will find before you do. They always find it before you do." },
      { name: "Human-in-the-Loop Need", score: 2, note: "You said \"considering automating fully.\" No. Absolutely not. Anything financial that touches the books needs a human gate. Not negotiable. This is a hill I will die on, in your kitchen, on your time." },
      { name: "Time-to-Value", score: 7, note: "Quick to prototype. Takes longer than you think to harden it for the gnarly invoices (handwritten, multi-page, weird layouts, foreign currency, the one vendor who still faxes)." },
    ],
    bullets: [
      "First, evaluate dedicated extraction tools (Rossum, Docparser, Mindee, Veryfi). They're cheaper, more accurate on this exact task, and built for compliance. If you must use an LLM, use it as a fallback for invoices the dedicated tool fails on. Use the right knife.",
      "Never auto-post to the GL. Extract → land in a review queue → human approves → post. The \"human approves\" can be 5 seconds of clicking, but it has to exist. Audit trail, fraud prevention, your sanity.",
      "Add a confidence score per field. Have the model return a confidence per extracted field. Anything below 0.9 routes to manual review automatically. The model is honest about its doubt if you make it.",
      "Sanity-check with deterministic math. Does sum of line items == invoice total? If no, flag for review. This catches 80% of LLM extraction errors for free with one if-statement.",
      "Don't ship this without your finance lead's sign-off. If something goes wrong, this is the kind of thing that becomes a board-level conversation. Get the buy-in before you build, not after. After is a much worse meeting.",
    ],
    promptIntro: "This works. The confidence scores are doing the heavy lifting. Don't remove them.",
    prompt: `You are an invoice data extraction tool. You will be given 
an image of an invoice. Extract the following fields and 
return ONLY a valid JSON object — no commentary, no markdown, 
no explanation.

For each field, include a confidence score from 0.0 to 1.0 
representing how certain you are of the extracted value.

Required schema:
{
  "vendor_name": { "value": "...", "confidence": 0.0 },
  "vendor_address": { "value": "...", "confidence": 0.0 },
  "invoice_number": { "value": "...", "confidence": 0.0 },
  "invoice_date": { "value": "YYYY-MM-DD", "confidence": 0.0 },
  "due_date": { "value": "YYYY-MM-DD", "confidence": 0.0 },
  "currency": { "value": "USD/EUR/etc", "confidence": 0.0 },
  "subtotal": { "value": 0.00, "confidence": 0.0 },
  "tax": { "value": 0.00, "confidence": 0.0 },
  "total": { "value": 0.00, "confidence": 0.0 },
  "line_items": [
    {
      "description": "...",
      "quantity": 0,
      "unit_price": 0.00,
      "line_total": 0.00,
      "confidence": 0.0
    }
  ],
  "extraction_notes": "Anything unusual, illegible, or 
                      ambiguous about this invoice."
}

CRITICAL RULES:
- If a field is not visible or unclear, set value to null 
  and confidence to 0.0. Do NOT guess.
- If confidence on the total is below 0.95, flag in 
  extraction_notes.
- Verify: sum of line_item line_totals should equal subtotal. 
  If not, note the discrepancy in extraction_notes.
- Return ONLY the JSON object. No prose. No "Here is the 
  extracted data." Just JSON.

INVOICE:
[image]`,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// VERDICT LIBRARY by meanness level (for non-matching inputs)
// ─────────────────────────────────────────────────────────────────────────────
const VERDICT_LIBRARY = {
  1: {
    mood: "approving",
    options: [
      {
        verdict: "Surprisingly... yes.",
        roast: "You walked in here with a real one. Don't let it go to your head — the next idea is statistically going to be worse.",
      },
      {
        verdict: "Order up, chef.",
        roast: "Well, look who finally read the manual. Take the W. I'm not handing them out twice.",
      },
    ],
  },
  2: {
    mood: "listening",
    options: [
      {
        verdict: "Workable, with caveats.",
        roast: "The idea has bones. The execution will determine whether you eat or whether you're explaining yourself to your boss in three weeks.",
      },
      {
        verdict: "Yeah, sure, fine.",
        roast: "It'll work. It won't be magical. Calibrate your expectations to 'fine' and you'll be a happier person.",
      },
      {
        verdict: "Plating now. Hold the optimism.",
        roast: "This is a B-minus use case. Acceptable. Forgettable. Shippable. Three out of three of those are wins, technically.",
      },
    ],
  },
  3: {
    mood: "listening",
    options: [
      {
        verdict: "Hard maybe.",
        roast: "You're using a chainsaw to butter toast. It'll work. Your toast will look concerning. I'm watching.",
      },
      {
        verdict: "Sent back to the kitchen.",
        roast: "The juice is not worth the squeeze. The squeeze is not worth the juice. Whatever this is, it's not worth anything, and I'm trying to tell you that gently.",
      },
      {
        verdict: "This idea has notes of 'I read one tweet about agents.'",
        roast: "Go read two tweets. Then go talk to a person who has actually built one. Then come back. I'll wait.",
      },
    ],
  },
  4: {
    mood: "disappointed",
    options: [
      {
        verdict: "No. Sit down.",
        roast: "You're trying to automate a problem you haven't even defined yet. The robots can't help you find your own keys, chef. Define the problem first. Then we'll talk.",
      },
      {
        verdict: "Absolutely not, chef.",
        roast: "This is what interns are for. Or a spreadsheet. Or — and I cannot stress this enough — thinking for ninety seconds before opening a chat window. Try it. You might like it.",
      },
    ],
  },
  5: {
    mood: "furious",
    options: [
      {
        verdict: "This is the dumbest thing I've heard all week, and it's Tuesday.",
        roast: "You want the silicon to do the one part of your job that's actually fun. Touch grass. Hug a person. Reconsider the choices that brought you here.",
      },
      {
        verdict: "I refuse.",
        roast: "I have been cooking for eighty years. I have seen kitchens burn down. I have seen souffles fall. I have never — never — seen anything as ill-considered as what you just brought me. Get out of my kitchen.",
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SCORING LOGIC
// ─────────────────────────────────────────────────────────────────────────────
const FREQ_OPTIONS = [
  { label: "Once. Just this one time.", score: 10, key: "once" },
  { label: "A handful of times — it's an experiment.", score: 5, key: "handful" },
  { label: "Regularly. Daily-ish.", score: 0, key: "regular" },
  { label: "Constantly. It's a workflow.", score: -5, key: "constant" },
];
const STAKES_OPTIONS = [
  { label: "Nobody notices. Maybe me.", score: 0, key: "nobody" },
  { label: "A little embarrassing. Recoverable.", score: 5, key: "embarrassing" },
  { label: "Costs money or time to fix.", score: 15, key: "costs" },
  { label: "Someone gets fired or sued.", score: 25, key: "fired" },
];
const SENSITIVE_OPTIONS = [
  { label: "Nope. All public stuff.", score: 0, key: "public" },
  { label: "Internal company info, but nothing wild.", score: 5, key: "internal" },
  { label: "Customer data, financials, the spicy stuff.", score: 15, key: "customer" },
  { label: "I refuse to answer that question.", score: 20, key: "refuse" },
];
const REVIEW_OPTIONS = [
  { label: "Me, every single output.", score: -15, key: "every" },
  { label: "Me, occasionally, when I remember.", score: 5, key: "occasional" },
  { label: "Nobody. Send it.", score: 25, key: "nobody" },
  { label: "I was hoping the robot would check itself.", score: 30, key: "self" },
];

const QUESTIONS = [
  { id: "freq", text: "How often are you going to do this thing?", options: FREQ_OPTIONS },
  { id: "stakes", text: "If the robot screws this up, how bad is it?", options: STAKES_OPTIONS },
  { id: "sensitive", text: "Are you about to feed it anything you wouldn't want on a billboard?", options: SENSITIVE_OPTIONS },
  { id: "review", text: "Who's checking the robot's homework?", options: REVIEW_OPTIONS },
];

const KEYWORD_MODIFIERS = [
  { words: ["birthday", "wedding", "vows", "personal", "thank you note", "condolence", "apology"], delta: 20 },
  { words: ["fully automate", "no review", "send direct", "auto-post", "auto post"], delta: 15 },
  { words: ["summarize meeting", "extract from", "draft", "review queue"], delta: -15 },
  { words: ["agent", "agentic", "multi-agent", "multiagent"], delta: 10 },
];

function computeFoolishness(answers, freeText) {
  let score = 0;
  if (answers.freq) score += FREQ_OPTIONS.find((o) => o.key === answers.freq).score;
  if (answers.stakes) score += STAKES_OPTIONS.find((o) => o.key === answers.stakes).score;
  if (answers.sensitive) score += SENSITIVE_OPTIONS.find((o) => o.key === answers.sensitive).score;
  if (answers.review) score += REVIEW_OPTIONS.find((o) => o.key === answers.review).score;
  const lower = (freeText || "").toLowerCase();
  KEYWORD_MODIFIERS.forEach(({ words, delta }) => {
    if (words.some((w) => lower.includes(w))) score += delta;
  });
  return score;
}

function levelFromScore(s) {
  if (s <= 20) return 1;
  if (s <= 40) return 2;
  if (s <= 60) return 3;
  if (s <= 80) return 4;
  return 5;
}

function matchScenario(text) {
  const lower = (text || "").toLowerCase();
  let best = null;
  let bestCount = 0;
  for (const [key, sc] of Object.entries(SCENARIOS)) {
    const count = sc.keywords.filter((kw) => lower.includes(kw)).length;
    if (count > bestCount) {
      bestCount = count;
      best = key;
    }
  }
  return bestCount > 0 ? best : null;
}

// Procedural scorecard for unmatched inputs
function buildGenericScorecard(answers) {
  const freq = FREQ_OPTIONS.find((o) => o.key === answers.freq);
  const stakes = STAKES_OPTIONS.find((o) => o.key === answers.stakes);
  const sensitive = SENSITIVE_OPTIONS.find((o) => o.key === answers.sensitive);
  const review = REVIEW_OPTIONS.find((o) => o.key === answers.review);

  // Map each dimension to a 1-10 score based on answers
  const taskFit = {
    name: "Task Fit",
    score: freq.key === "constant" ? 8 : freq.key === "regular" ? 7 : freq.key === "handful" ? 5 : 4,
    note: freq.key === "once"
      ? "One-off jobs are usually a sign you should just... do the thing yourself. The setup tax never amortizes."
      : freq.key === "constant"
      ? "Workflow-grade volume is where the robots earn their keep. Good instinct."
      : "Volume's middling. Robot might help. Might be a wash. Test it before committing.",
  };
  const cost = {
    name: "Cost at Scale",
    score: freq.key === "constant" ? 5 : freq.key === "regular" ? 7 : 9,
    note: "Without your exact token counts I can't price this. But unless you're chewing through a million tokens a day, the model bill is rounding error compared to your time.",
  };
  const halluc = {
    name: "Hallucination Risk",
    score: stakes.key === "fired" ? 2 : stakes.key === "costs" ? 4 : stakes.key === "embarrassing" ? 6 : 7,
    note: stakes.key === "fired"
      ? "Stakes this high + a hallucinating model is the recipe for a very bad week. Engineer for failure."
      : stakes.key === "nobody"
      ? "Low stakes means you can afford the model being wrong sometimes. Lucky you."
      : "Real consequences if the model fabricates. Don't let it touch the final output without a human gate.",
  };
  const hitl = {
    name: "Human-in-the-Loop Need",
    score: review.key === "every" ? 9 : review.key === "occasional" ? 5 : review.key === "nobody" ? 1 : 0,
    note: review.key === "self"
      ? "Asking the robot to grade its own homework is how you get a robot with straight A's and zero competence. No."
      : review.key === "nobody"
      ? "Nobody reviewing means the model's mistakes become your reality. Not a great reality to live in."
      : review.key === "every"
      ? "Reviewing every output is what separates this from a lawsuit. Keep doing it."
      : "Occasional review is better than none. It's also worse than every. You're in the muddy middle.",
  };
  const ttv = {
    name: "Time-to-Value",
    score: 6,
    note: "I don't know your exact use case yet, so I'm splitting the difference. Most things take longer to set up than you think and pay off slower than you hope.",
  };

  const all = [taskFit, cost, halluc, hitl, ttv];
  const overall = (all.reduce((s, c) => s + c.score, 0) / all.length).toFixed(1);
  let word = "Cook with caution.";
  if (overall >= 8) word = "Cook it.";
  else if (overall >= 6) word = "Cook, but watch it.";
  else if (overall >= 4) word = "Cook with a human watching.";
  else word = "Sent back to the kitchen.";

  return { scorecard: all, overall: parseFloat(overall), overallWord: word };
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCEDURAL LAYER 3 GENERATOR
// Detects patterns in the free-text input + structured answers, then composes
// custom-feeling bullets and a sample prompt. Not real intelligence — pattern
// matching with attitude. The Stage 3 LLM port replaces this entirely.
// ─────────────────────────────────────────────────────────────────────────────

// Pattern detectors: each returns either a tag string or null
function detectPatterns(text) {
  const t = (text || "").toLowerCase();
  const tags = new Set();

  // Task type — stems use no trailing \b so "summarizes", "extraction", "classifies" all match
  if (/\b(draft|write|writing|writes|compose|composes|generate|generates|author)/i.test(t)) tags.add("task:writing");
  if (/\b(summari[sz]|recap|tldr|digest)/i.test(t)) tags.add("task:summarize");
  if (/\b(extract|parse|scrape|capture|pull out)/i.test(t)) tags.add("task:extract");
  if (/\b(classif|categori|sort|route|triage)/i.test(t)) tags.add("task:classify");
  if (/\b(translat)/i.test(t)) tags.add("task:translate");
  if (/\b(analy[sz]|evaluat|score|grade|review)/i.test(t)) tags.add("task:analyze");
  if (/\b(brainstorm|ideat|come up with|think of)/i.test(t)) tags.add("task:brainstorm");
  if (/\b(code|coding|program|programming|debug|refactor|script)/i.test(t)) tags.add("task:code");
  if (/\b(decision|decide|choose|pick|recommend)/i.test(t)) tags.add("task:decide");
  if (/\b(search|find|lookup|research)/i.test(t)) tags.add("task:search");

  // Channel/medium
  if (/\b(email|emails|gmail|inbox|outlook)/i.test(t)) tags.add("channel:email");
  if (/\b(slack|teams|discord|chat)/i.test(t)) tags.add("channel:chat");
  if (/\b(linkedin|twitter|x\.com|instagram|tiktok|facebook|social media)/i.test(t)) tags.add("channel:social");
  if (/\b(blog|article|newsletter|substack|medium\.com|long.?form)/i.test(t)) tags.add("channel:longform");
  if (/\b(report|deck|presentation|slides|powerpoint|google docs|google sheets|spreadsheet)/i.test(t)) tags.add("channel:doc");
  if (/\b(github|pull request|pull requests|\bpr\b|prs|commit)/i.test(t)) tags.add("channel:code");

  // Audience signal
  if (/\b(customer|customers|client|clients|user|users|prospect|prospects|lead|leads)/i.test(t)) tags.add("audience:external");
  if (/\b(team|coworker|colleague|employee|staff|internal|boss|manager|direct report)/i.test(t)) tags.add("audience:internal");
  if (/\b(public|audience|followers|community)/i.test(t)) tags.add("audience:public");
  if (/\b(everyone|all my|all of|all the|mass|bulk|each|every)/i.test(t) || /\b\d{2,}\b/.test(t)) tags.add("audience:scale");

  // Risk tells
  if (/\b(legal|lawyer|contract|contracts|compliance|hipaa|gdpr|pii|sox)/i.test(t)) tags.add("risk:legal");
  if (/\b(financ|invoice|invoices|billing|payment|payments|money|revenue|p&l|\bgl\b|accounting|expense|expenses)/i.test(t)) tags.add("risk:financial");
  if (/\b(medical|health|patient|diagnos|prescription|clinical)/i.test(t)) tags.add("risk:medical");
  if (/\b(personal|intimate|private|confidential|sensitive)/i.test(t)) tags.add("risk:personal");

  // Automation tells
  if (/(fully automate|no review|send direct|auto-?post|auto-?send|auto-?reply|hands-?off|no human|without review)/i.test(t)) tags.add("auto:full");
  if (/\b(workflow|pipeline|automation|cron|trigger|webhook|zapier|n8n)/i.test(t)) tags.add("auto:pipeline");
  if (/\b(agent|agents|agentic|multi-?agent|autonomous|self-driving)/i.test(t)) tags.add("auto:agentic");

  // Output type
  if (/\b(json|csv|xml|structured|schema|api response)/i.test(t)) tags.add("output:structured");
  if (/\b(creative|original|unique|novel)/i.test(t)) tags.add("output:creative");

  // Volume hints
  if (/\b\d{2,}\b/.test(t)) tags.add("volume:specific");
  if (/\b(daily|weekly|monthly|every day|each week|every week|per day|per week|per month)/i.test(t)) tags.add("volume:recurring");

  return tags;
}

// Pull a short noun phrase to refer back to in copy ("your invoice thing", "this email thing")
function getTopicLabel(text, tags) {
  const t = (text || "").toLowerCase();
  // Order matters — first match wins
  if (tags.has("channel:email")) return "this email play";
  if (tags.has("channel:social")) return "this social posting plan";
  if (tags.has("channel:doc")) return "this document workflow";
  if (tags.has("channel:code")) return "this code task";
  if (tags.has("channel:longform")) return "this writing project";
  if (tags.has("task:summarize")) return "this summarization play";
  if (tags.has("task:extract")) return "this extraction job";
  if (tags.has("task:classify")) return "this sorting job";
  if (tags.has("task:writing")) return "this writing task";
  if (tags.has("task:analyze")) return "this analysis job";
  if (tags.has("task:brainstorm")) return "this brainstorm";
  if (tags.has("task:code")) return "this coding task";
  return "this thing you brought me";
}

// Bullet library — each bullet is { tags: [...], text: "..." }
// `tags` is the set of detected tags this bullet wants to see; we score & pick top 4-5.
const BULLET_LIBRARY = [
  // Writing tasks
  {
    requires: ["task:writing"],
    text: "Don't write a clever prompt from scratch. Find 5-10 examples of writing you actually like — yours, ideally — and paste them in as the model's reference. Examples beat instructions every time. The model is a mimic, not an author. Give it something good to mimic.",
  },
  {
    requires: ["task:writing", "channel:email"],
    text: "Email is high-stakes-per-word. Have the model produce three drafts at three lengths — terse, normal, and explanatory — and pick from there. Picking is faster than editing, and you'll often find the terse version was right.",
  },
  {
    requires: ["task:writing", "audience:external"],
    text: "Anything going to a real human outside your company gets a human read before it leaves the building. Non-negotiable. \"Drafts ready in your inbox\" is a feature; \"AI-generated message landed in a customer's lap\" is a postmortem.",
  },

  // Summarization
  {
    requires: ["task:summarize"],
    text: "Make the model link every claim back to a source — line number, timestamp, paragraph. If you can't verify a sentence in one click, you can't trust the summary. This single design choice prevents 90% of the slow-poison problem.",
  },
  {
    requires: ["task:summarize"],
    text: "Tell the model to flag what it's <80% sure about with a \"verify\" tag. The model is honest about its doubt if you make it. Trust the tags more than the prose.",
  },

  // Extraction
  {
    requires: ["task:extract"],
    text: "Make the model return a confidence score per field. Anything below 0.9 routes to a human review queue automatically. The model is a good narc on itself when prompted right.",
  },
  {
    requires: ["task:extract", "output:structured"],
    text: "Force structured JSON output with a strict schema. Validate the output before doing anything with it. If the JSON doesn't parse, kick it back. \"It usually parses\" is how you wake up to a corrupted database.",
  },
  {
    requires: ["task:extract"],
    text: "Before reaching for the LLM, check if a dedicated tool already does this — Rossum, Docparser, Mindee for documents; spaCy, Hugging Face for NER. Boring purpose-built tools are often cheaper and more accurate. Boring is allowed to win.",
  },

  // Classification
  {
    requires: ["task:classify"],
    text: "Hand-label 50 examples first. Use them as your eval set. If the model's accuracy on those 50 is below 90%, fix the prompt before you ship — not after. The cost of being wrong on classification compounds fast when it's piped into a workflow.",
  },

  // Code
  {
    requires: ["task:code"],
    text: "Never let the model push code without a human-reviewed PR. Even with tests passing. Especially with tests passing. Tests catch regressions, not bad architecture decisions made at 2am by silicon.",
  },

  // Brainstorm
  {
    requires: ["task:brainstorm"],
    text: "Brainstorming is one of the things the model is genuinely good at because there's no wrong answer — just material. Ask for 20 ideas, expect 17 to be garbage, mine the 3 that aren't. Don't ask for \"the best 5.\" Ask for many; pick yourself.",
  },

  // Decision
  {
    requires: ["task:decide"],
    text: "Don't ask the model to decide for you. Ask it to lay out the tradeoffs and the questions you should be asking yourself. The decision is yours. Outsourcing it sounds like efficiency and feels like efficiency right up until the bill arrives.",
  },

  // Search
  {
    requires: ["task:search"],
    text: "If you need facts, use a model with web search built in. Otherwise it'll cheerfully invent the answer in a confident voice. Hallucination on factual lookups is the most expensive kind of wrong: you sound right and you are wrong.",
  },

  // Audience risks
  {
    requires: ["audience:external"],
    text: "Anything customer-facing needs a tone document and example replies showing what \"on-brand\" looks like for you. The model defaults to mid-Atlantic SaaS-speak unless you teach it otherwise. Mid-Atlantic SaaS-speak is recognizable. Recognizable means \"clearly AI.\" Clearly AI means \"they don't actually care about me.\"",
  },
  {
    requires: ["audience:scale"],
    text: "Scale + automation + no review = the recipe for one bad message reaching ten thousand people. Pick two of those three. The third one will hurt you.",
  },

  // Risk-driven (sensitive data answer)
  {
    requires: ["answer:sensitive:customer"],
    text: "You're feeding it customer data — that means you need a vendor with zero-data-retention guarantees, not a hobbyist API key. Anthropic, OpenAI, and Google all offer enterprise tiers with no training on your data. Use them. Read the terms. Save the screenshot.",
  },
  {
    requires: ["answer:sensitive:refuse"],
    text: "If you wouldn't tell me what you're feeding it, you definitely shouldn't be feeding it to a third-party model on a hobbyist plan. Talk to whoever owns security at your company before you build anything. \"After I shipped\" is the worst time to discover a data policy.",
  },
  {
    requires: ["risk:financial"],
    text: "Anything that touches money or the books needs a human approval gate before posting. Audit trail, fraud prevention, your sanity. \"Human approves\" can be five seconds of clicking — but it has to exist. This is a hill I will die on.",
  },
  {
    requires: ["risk:legal"],
    text: "If lawyers or compliance touch this domain, talk to them before you build, not after. \"After\" is a much worse meeting. The model will confidently state legal opinions that are wrong, and \"the AI told me\" is not a defense any judge has accepted yet.",
  },
  {
    requires: ["risk:medical"],
    text: "Medical context means you're playing in a regulated sandbox. HIPAA, BAA agreements, the works. A consumer LLM API is the wrong tool. Get a healthcare-grade vendor or don't ship this — there is no middle path that doesn't end in a fine.",
  },
  {
    requires: ["risk:personal"],
    text: "If this is something a human is supposed to find meaningful — a vow, a condolence, an apology — the model should help you think, not write the thing. The recipient can tell. They always can. The whole point of meaning is that a person made it.",
  },

  // Review-driven (structured answer)
  {
    requires: ["answer:review:nobody"],
    text: "Nobody reviewing means the model's mistakes silently become your reality. For at least the first 100 outputs, review every single one. Track what it gets wrong. Then design the review process around those failure modes — not \"do I have time today.\"",
  },
  {
    requires: ["answer:review:self"],
    text: "Asking the model to grade its own homework is how you get a model with straight A's and zero competence. Self-eval is theater. Use a different model or a structured rubric or — wild idea — a human.",
  },
  {
    requires: ["answer:review:every"],
    text: "Reviewing every output is the right call now, but watch the edit distance over time. If you're rewriting >50% of every draft after a month, the model isn't helping — it's adding a step. Kill it and try again with better examples or a tighter prompt.",
  },

  // Stakes-driven
  {
    requires: ["answer:stakes:fired"],
    text: "Stakes this high mean you need a kill switch, an audit log, and a tested rollback plan before you ship. Build the off-ramp before you build the feature. The day you need it, you'll need it instantly.",
  },

  // Automation tells
  {
    requires: ["auto:full"],
    text: "\"Fully automate, no human in the loop\" is the phrase that precedes most AI disasters. Always have a queue. Always have a kill switch. Always have a sample-rate review (look at 1 in 50, picked at random, weekly). Always.",
  },
  {
    requires: ["auto:agentic"],
    text: "Agents are extra-credit difficulty. Get a single-prompt version working end-to-end first. Track its failure rate. Then — and only then — add the second hop. Most \"agentic\" projects fail because step one wasn't reliable enough to chain.",
  },
  {
    requires: ["auto:pipeline"],
    text: "Treat this like a real pipeline: monitoring, alerting, dead-letter queue for failed runs, log of every input + output for at least 30 days. \"It's just a prompt\" is how you get paged at 3am because a model update changed the output format silently.",
  },

  // Volume
  {
    requires: ["volume:specific", "volume:recurring"],
    text: "You gave me a real volume number — that means you can actually do the unit economics. Compute cost per output × outputs per month. If it's more than a coffee budget, switch to a cheaper model (Haiku, GPT-4o-mini) for the first pass and save the smart model for edge cases.",
  },

  // Output
  {
    requires: ["output:creative"],
    text: "If you want \"original,\" don't ask for original — ask for unexpected constraints. \"Write this in the style of a pirate's logbook\" gets you somewhere. \"Be creative\" gets you LinkedIn fortune-cookie content. The model needs friction to make anything interesting.",
  },

  // GENERAL HYGIENE BULLETS — used to fill remaining slots if pattern-driven bullets don't reach 4
  {
    requires: ["general"],
    text: "Write the eval before the prompt. Pick 10 examples of what \"good output\" looks like for you. If you can't list them, you don't actually know what you want — and the model definitely won't.",
  },
  {
    requires: ["general"],
    text: "Use Claude Haiku, GPT-4o-mini, or Gemini Flash for the first pass. They're 5-10x cheaper than the flagship models and good enough for 80% of jobs. Save the expensive models for the gnarly edge cases. Your bill will thank you. So will I.",
  },
  {
    requires: ["general"],
    text: "Time-box the build. Two days max for a v1. If it isn't working at \"good enough\" by hour 16, the prompt isn't the problem — the use case is. Walk away. Pick a different battle. The robots are not the answer to every question.",
  },
  {
    requires: ["general"],
    text: "Show your output to one person who didn't help build it. Watch them react in real time. The way they pause, frown, or skim tells you more than any eval suite. Their face is the truth. Trust the face.",
  },
];

function pickBullets(tags, answers, freeText, maxBullets = 5) {
  // Build the full tag set including answer-derived tags
  const fullTags = new Set(tags);
  if (answers.review) fullTags.add(`answer:review:${answers.review}`);
  if (answers.sensitive) fullTags.add(`answer:sensitive:${answers.sensitive}`);
  if (answers.stakes) fullTags.add(`answer:stakes:${answers.stakes}`);
  if (answers.freq) fullTags.add(`answer:freq:${answers.freq}`);

  // Score each bullet by how many of its required tags are present
  const scored = BULLET_LIBRARY.map((b) => {
    if (b.requires.includes("general")) return { ...b, score: 0.5, isGeneral: true };
    const matches = b.requires.filter((r) => fullTags.has(r)).length;
    const allMatch = matches === b.requires.length;
    return {
      ...b,
      // Only consider the bullet if ALL its required tags are present
      score: allMatch ? matches + 1 : 0,
      isGeneral: false,
    };
  });

  // Sort by score desc, then prefer specific over general
  scored.sort((a, b) => b.score - a.score);

  // Take pattern-matched bullets first
  const matched = scored.filter((b) => b.score > 0 && !b.isGeneral);
  const generals = scored.filter((b) => b.isGeneral);

  const picked = [];
  const seen = new Set();
  for (const b of matched) {
    if (picked.length >= maxBullets) break;
    if (seen.has(b.text)) continue;
    picked.push(b.text);
    seen.add(b.text);
  }
  // Fill remaining slots with general hygiene bullets, randomized so two runs differ
  const shuffledGenerals = [...generals].sort(() => Math.random() - 0.5);
  for (const b of shuffledGenerals) {
    if (picked.length >= Math.max(4, maxBullets - 1)) break;
    if (seen.has(b.text)) continue;
    picked.push(b.text);
    seen.add(b.text);
  }
  return picked;
}

// Compose a sample prompt tailored to detected pattern
function composePrompt(tags, answers, freeText) {
  const userTask = (freeText || "").trim();
  const userTaskQuoted = userTask.length > 240 ? userTask.slice(0, 237) + "..." : userTask;

  // Detect primary task to pick a template
  let role = "an experienced assistant";
  let outputFormat = "Plain text response.";
  let extras = [];

  if (tags.has("task:summarize")) {
    role = "an experienced summarizer";
    outputFormat = `Output in this exact structure:

## TL;DR (2 sentences max)

## Key Points
- [point] — [source/timestamp/paragraph reference]

## Action Items (if any)
- [item] — [owner if mentioned]

## Things I'm Less Sure About
- [Anything you inferred rather than read directly. Be honest.]`;
    extras.push("- Quote directly when attributing claims to specific people. Never paraphrase a commitment.");
    extras.push("- If something is unclear, say so explicitly under \"Things I'm Less Sure About.\"");
  } else if (tags.has("task:extract")) {
    role = "a structured data extraction tool";
    outputFormat = `Return ONLY a valid JSON object — no commentary, no markdown, no explanation.

For each field, include a confidence score from 0.0 to 1.0:
{
  "field_name": { "value": "...", "confidence": 0.0 },
  ...
  "extraction_notes": "Anything unusual, illegible, or ambiguous."
}`;
    extras.push("- If a field is not visible or unclear, set value to null and confidence to 0.0. Do NOT guess.");
    extras.push("- Flag any field with confidence < 0.9 in extraction_notes.");
  } else if (tags.has("task:writing") && tags.has("channel:email")) {
    role = "a draft email writer";
    outputFormat = "Produce three versions: TERSE (1-2 sentences), NORMAL (3-5 sentences), and EXPLANATORY (1 short paragraph). Label them clearly.";
    extras.push("- Match the tone shown in EXAMPLES below. Do not invent a new voice.");
    extras.push("- Do not invent facts, dates, names, or commitments not given in the input.");
  } else if (tags.has("task:writing")) {
    role = "a writing assistant";
    outputFormat = "Produce a draft. Mark anything you inferred (rather than were told) with [INFERRED].";
    extras.push("- Match the tone shown in EXAMPLES below. Do not improvise voice.");
    extras.push("- Do not fabricate names, statistics, dates, or quotes.");
  } else if (tags.has("task:classify")) {
    role = "a classifier";
    outputFormat = `Return JSON: { "category": "...", "confidence": 0.0, "reasoning": "one sentence" }`;
    extras.push("- Use ONLY the categories listed in CATEGORIES below. Do not invent new ones.");
    extras.push("- If confidence is below 0.8, use \"category\": \"NEEDS_REVIEW\" and explain why.");
  } else if (tags.has("task:brainstorm")) {
    role = "a brainstorming partner";
    outputFormat = "Generate 20 distinct options. Number them. Do not rank or recommend — just list. I'll pick.";
    extras.push("- Push past the obvious 5. The interesting answers are 11-20.");
    extras.push("- Each option should be one sentence. No essays.");
  } else if (tags.has("task:code")) {
    role = "a coding assistant";
    outputFormat = "Return the code in a single fenced block, then a short explanation of what changed and why.";
    extras.push("- If the request is ambiguous, ask 1-3 clarifying questions BEFORE writing code.");
    extras.push("- Do not invent libraries, APIs, or function signatures. If unsure, say so.");
  } else if (tags.has("task:analyze")) {
    role = "an analyst";
    outputFormat = `Output in this structure:

## What I Saw (the data, no interpretation)
## What I Think It Means (interpretation, marked clearly)
## What I'm Not Sure About
## Questions That Would Sharpen This Analysis`;
    extras.push("- Separate observation from interpretation cleanly. Do not blend them.");
    extras.push("- Quantify uncertainty where you can.");
  }

  // Sensitivity warnings
  if (answers.sensitive === "customer" || answers.sensitive === "refuse") {
    extras.push("- This input may contain sensitive data. Do not store, log, or repeat any personal identifiers in your output unless directly required by the task.");
  }
  if (answers.review === "nobody" || answers.review === "self") {
    extras.push("- Output will be used WITHOUT human review. If you are <90% confident in any part of your response, refuse and explain why instead of guessing.");
  }

  const extraBlock = extras.length ? extras.join("\n") : "- Be precise. Do not pad. Do not add disclaimers.";

  return `You are ${role} helping with the following task:

TASK:
${userTaskQuoted}

CONTEXT:
[Add 2-3 sentences about your company, your audience, or the 
specific situation. Generic prompts get generic outputs.]

EXAMPLES OF GOOD OUTPUT:
[Paste 3-5 real examples of what "good" looks like for this 
task. Examples beat instructions every time. If you don't have 
examples, you don't actually know what you want yet.]

RULES:
${extraBlock}

OUTPUT FORMAT:
${outputFormat}

INPUT:
[paste the actual thing you want processed]`;
}

// Char's intro line above the prompt block, keyed to meanness level
const PROMPT_INTRO_BY_LEVEL = {
  1: "Here. You earned it.",
  2: "Here. Don't make me regret this.",
  3: "Here. Read it before you paste it. The brackets are doing the heavy lifting.",
  4: "Here. Against my better judgment. Fill in the brackets like your job depends on it. It might.",
  5: "Fine. Here. But I want you to know that handing this to you is the part of my job I like least.",
};

// Char's intro paragraph above the bullets, keyed to meanness level
const BULLETS_INTRO_BY_LEVEL = {
  1: "You're already on the right track. Don't trip over your own feet.",
  2: "Workable. Here's what separates the version that ships from the version that haunts you.",
  3: "Read these slowly. Each one corresponds to a way this goes sideways that I've watched a thousand times.",
  4: "I don't think you're going to listen. But on the off chance you do — here's what would make this less of a disaster.",
  5: "I'm helping under protest. If you do this anyway, at least do it with the guardrails. Don't make me come down there.",
};

function buildGenericLayer3(answers, freeText, level) {
  const tags = detectPatterns(freeText);
  const topic = getTopicLabel(freeText, tags);
  const bullets = pickBullets(tags, answers, freeText, 5);
  const prompt = composePrompt(tags, answers, freeText);
  const promptIntro = PROMPT_INTRO_BY_LEVEL[level] || PROMPT_INTRO_BY_LEVEL[3];
  const bulletsIntro = BULLETS_INTRO_BY_LEVEL[level] || BULLETS_INTRO_BY_LEVEL[3];
  return { bullets, prompt, promptIntro, bulletsIntro, topic };
}

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function ChunkyButton({ children, onClick, color = COLORS.hotPink, textColor = COLORS.cream, full = false, size = "lg", disabled }) {
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

function ProgressFlames({ current, total = 4 }) {
  return (
    <div className="flex gap-2 justify-center mb-6">
      {[...Array(total)].map((_, i) => {
        const lit = i < current;
        const active = i === current;
        return (
          <motion.div
            key={i}
            animate={{ scale: active ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.6, repeat: active ? Infinity : 0 }}
            style={{ width: 28, height: 32 }}
          >
            <svg viewBox="0 0 100 115" className="w-full h-full">
              <path
                d="M50 110 C 22 110, 14 80, 22 60 C 28 46, 34 50, 36 36 C 38 22, 46 16, 50 8 C 54 16, 62 22, 64 36 C 66 50, 72 46, 78 60 C 86 80, 78 110, 50 110 Z"
                fill={lit ? COLORS.hotPink : "transparent"}
                stroke={lit ? COLORS.hotPink : COLORS.cream + "55"}
                strokeWidth="4"
              />
            </svg>
          </motion.div>
        );
      })}
    </div>
  );
}

// Heat map color for a 0-10 score
function heatColor(score) {
  if (score <= 3) return COLORS.infernoBlue;
  if (score <= 5) return COLORS.emberOrange;
  if (score <= 7) return COLORS.hotPink;
  return COLORS.greaseGold;
}

function KitchenTicket({ name, score, note, delay = 0 }) {
  const fillPct = (score / 10) * 100;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: Math.random() * 1.5 - 0.75 }}
      transition={{ delay, type: "spring", stiffness: 200, damping: 18 }}
      className="relative"
      style={{
        background: COLORS.cream,
        color: COLORS.charBlack,
        border: `2px solid ${COLORS.charBlack}`,
        borderRadius: 6,
        padding: "16px 18px 18px 18px",
        boxShadow: `4px 4px 0 ${COLORS.charBlack}`,
      }}
    >
      {/* perforated top */}
      <div
        className="absolute -top-[6px] left-0 right-0 h-3"
        style={{
          backgroundImage: `radial-gradient(circle, ${COLORS.charBlack} 2px, transparent 2.5px)`,
          backgroundSize: "10px 10px",
          backgroundPosition: "0 0",
        }}
      />
      <div className="flex items-baseline justify-between mb-2">
        <div className="font-display text-lg uppercase tracking-tight" style={{ letterSpacing: "-0.01em" }}>
          {name}
        </div>
        <div className="font-mono font-bold text-2xl" style={{ color: heatColor(score) }}>
          {score}<span className="text-sm opacity-50">/10</span>
        </div>
      </div>
      {/* heat bar */}
      <div className="w-full h-2 rounded-full mb-3" style={{ background: COLORS.charBlack + "15" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${fillPct}%` }}
          transition={{ delay: delay + 0.2, duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: heatColor(score) }}
        />
      </div>
      <div className="font-body text-sm leading-snug" style={{ color: COLORS.charBlack + "dd" }}>
        {note}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function Skillet() {
  const [stage, setStage] = useState("landing"); // landing | question | thinking | verdict
  const [freeText, setFreeText] = useState("");
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [verdict, setVerdict] = useState(null);
  const [revealLayer, setRevealLayer] = useState(1); // 1 = verdict only, 2 = + scorecard, 3 = + recommendation
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [emptyShake, setEmptyShake] = useState(false);
  const [verdictId, setVerdictId] = useState(null);
  const [sparkBurst, setSparkBurst] = useState(false);
  const [landingFocused, setLandingFocused] = useState(false); // drives Char color shift on input focus

  const scorecardRef = useRef(null);
  const layer3Ref = useRef(null);

  // Loading messages cycling
  useEffect(() => {
    if (stage !== "thinking") return;
    const messages = [
      "Tasting the idea...",
      "Consulting the ancestors...",
      "Doing the math you should have done...",
      "Plating now.",
    ];
    const interval = setInterval(() => {
      setLoadingMsg((i) => Math.min(i + 1, messages.length - 1));
    }, 1100);
    return () => clearInterval(interval);
  }, [stage]);

  // Compute & finalize verdict
  useEffect(() => {
    if (stage !== "thinking") return;
    const timer = setTimeout(() => {
      const matched = matchScenario(freeText);
      const score = computeFoolishness(answers, freeText);
      const level = levelFromScore(score);
      const id = `v_${Date.now().toString(36)}_${matched || "generic"}`;

      if (matched) {
        const sc = SCENARIOS[matched];
        setVerdict({
          isMatched: true,
          key: matched,
          mood: sc.mood,
          level: sc.level,
          verdict: sc.verdict,
          roast: sc.roast,
          revealCta: sc.revealCta,
          layer3Cta: sc.layer3Cta,
          scorecard: sc.scorecard,
          overall: sc.overall,
          overallWord: sc.overallWord,
          bullets: sc.bullets,
          promptIntro: sc.promptIntro,
          prompt: sc.prompt,
        });
      } else {
        const lib = VERDICT_LIBRARY[level];
        const pick = lib.options[Math.floor(Math.random() * lib.options.length)];
        const generic = buildGenericScorecard(answers);
        const layer3 = buildGenericLayer3(answers, freeText, level);
        setVerdict({
          isMatched: false,
          key: "generic",
          mood: lib.mood,
          level,
          verdict: pick.verdict,
          roast: pick.roast,
          revealCta: "Show me the scorecard",
          layer3Cta: "Show me what to actually do",
          scorecard: generic.scorecard,
          overall: generic.overall,
          overallWord: generic.overallWord,
          bullets: layer3.bullets,
          promptIntro: layer3.promptIntro,
          prompt: layer3.prompt,
          bulletsIntro: layer3.bulletsIntro,
          topic: layer3.topic,
        });
      }
      setVerdictId(id);
      setStage("verdict");
      setSparkBurst(true);
      setTimeout(() => setSparkBurst(false), 700);
    }, 3400);
    return () => clearTimeout(timer);
  }, [stage, answers, freeText]);

  // Auto-scroll on layer reveal
  useEffect(() => {
    if (revealLayer === 2 && scorecardRef.current) {
      setTimeout(() => scorecardRef.current.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
    if (revealLayer === 3 && layer3Ref.current) {
      setTimeout(() => layer3Ref.current.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [revealLayer]);

  const charMood = useMemo(() => {
    if (stage === "landing") return "idle";
    if (stage === "question") return "listening";
    if (stage === "thinking") return "thinking";
    if (stage === "verdict" && verdict) return verdict.mood;
    return "idle";
  }, [stage, verdict]);

  const handleSubmit = () => {
    if (!freeText.trim()) {
      setEmptyShake(true);
      setTimeout(() => setEmptyShake(false), 600);
      return;
    }
    setStage("question");
    setQuestionIdx(0);
  };

  const handleAnswer = (questionId, optionKey) => {
    const newAnswers = { ...answers, [questionId]: optionKey };
    setAnswers(newAnswers);
    if (questionIdx < QUESTIONS.length - 1) {
      setTimeout(() => setQuestionIdx(questionIdx + 1), 350);
    } else {
      setTimeout(() => {
        setStage("thinking");
        setLoadingMsg(0);
      }, 350);
    }
  };

  const handleRestart = () => {
    setStage("landing");
    setFreeText("");
    setQuestionIdx(0);
    setAnswers({});
    setVerdict(null);
    setRevealLayer(1);
    setLoadingMsg(0);
    setVerdictId(null);
  };

  const handleCopyPrompt = () => {
    if (verdict?.prompt) {
      navigator.clipboard.writeText(verdict.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    if (!verdict) return;
    const shareText = `Char roasted my idea so you don't have to:\n\n"${verdict.verdict}"\n\n${verdict.roast}\n\n— Skillet (verdict ${verdictId})`;
    navigator.clipboard.writeText(shareText);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  return (
    <div
      className="skillet-root min-h-screen w-full font-body relative overflow-x-hidden"
      style={{
        background: COLORS.charBlack,
        color: COLORS.cream,
        backgroundImage: `radial-gradient(circle at 20% 0%, ${COLORS.hotPink}08 0%, transparent 50%), radial-gradient(circle at 80% 100%, ${COLORS.emberOrange}06 0%, transparent 50%)`,
      }}
    >
      <FontLoader />

      {/* Subtle grain overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E\")",
        }}
      />

      {/* Top bar with brand */}
      <div className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        <div className="flex items-center gap-3">
          <div style={{ width: 36, height: 42 }}>
            <Char mood="idle" size={36} withSkillet={false} />
          </div>
          <div className="font-display text-2xl sm:text-3xl tracking-tight" style={{ color: COLORS.cream }}>
            SKILLET
          </div>
        </div>
        {stage !== "landing" && (
          <button
            onClick={handleRestart}
            className="font-mono text-xs uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
          >
            [ start over ]
          </button>
        )}
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-5 sm:px-8 pb-32">
        <AnimatePresence mode="wait">

          {/* ───── LANDING ───── */}
          {stage === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="pt-4 sm:pt-12"
            >
              {/* Char hero — mood shifts to "listening" (ember orange) the moment user focuses input */}
              <div className="flex justify-center mb-8 sm:mb-10">
                <Char mood={landingFocused || freeText.length > 0 ? "listening" : "idle"} size={150} />
              </div>

              <h1
                className="font-display text-center mb-4 mx-auto"
                style={{
                  fontSize: "clamp(40px, 9vw, 72px)",
                  lineHeight: 0.92,
                  letterSpacing: "-0.035em",
                  maxWidth: 720,
                  textWrap: "balance",
                }}
              >
                What are you trying to use the robots for, <span style={{ color: COLORS.hotPink }}>chef?</span>
              </h1>
              <p
                className="font-body text-center mb-8 mx-auto"
                style={{ color: "#C9C0B0", fontSize: 15, maxWidth: 460, lineHeight: 1.5 }}
              >
                Tell me what you're thinking. I'll tell you if you're cooking or just making a mess.
              </p>

              <motion.div animate={emptyShake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}} transition={{ duration: 0.5 }}>
                <textarea
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  onFocus={() => setLandingFocused(true)}
                  onBlur={() => setLandingFocused(false)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit();
                  }}
                  placeholder="e.g. I want AI to draft my customer support replies…"
                  rows={4}
                  className="w-full p-5 rounded-xl font-body text-base resize-none focus:outline-none"
                  style={{
                    background: COLORS.cream,
                    color: COLORS.charBlack,
                    border: `4px solid ${emptyShake ? COLORS.emberOrange : COLORS.hotPink}`,
                    boxShadow: `0 4px 0 #0E0E0E`,
                    transition: "border-color 0.18s",
                  }}
                />
              </motion.div>
              {emptyShake && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-display mt-3 text-center"
                  style={{ color: COLORS.emberOrange, fontSize: 15, fontWeight: 800 }}
                >
                  I can't roast nothing, chef. Type something.
                </motion.p>
              )}

              <div className="mt-6 flex justify-center">
                <ChunkyButton onClick={handleSubmit} color={COLORS.hotPink}>
                  Roast it →
                </ChunkyButton>
              </div>

              <p className="font-body italic text-center mt-10 mx-auto" style={{ color: "#7A6F60", fontSize: 12, maxWidth: 320 }}>
                Char has been cooking for 80 years. He's not impressed easily.
              </p>
            </motion.div>
          )}

          {/* ───── QUESTIONS ───── */}
          {stage === "question" && (
            <motion.div
              key="question"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-4 sm:pt-8"
            >
              <ProgressFlames current={questionIdx} total={4} />

              <div className="flex justify-center mb-6">
                <Char mood="listening" size={88} />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={questionIdx}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className="font-mono text-center mb-2"
                    style={{
                      color: COLORS.emberOrange,
                      fontSize: 11,
                      letterSpacing: "0.22em",
                      fontWeight: 700,
                    }}
                  >
                    QUESTION {questionIdx + 1} OF 4
                  </div>
                  <h2
                    className="font-display text-center mb-8 px-2 mx-auto"
                    style={{
                      fontSize: "clamp(28px, 6.4vw, 42px)",
                      lineHeight: 1.0,
                      letterSpacing: "-0.025em",
                      maxWidth: 560,
                      textWrap: "balance",
                    }}
                  >
                    {QUESTIONS[questionIdx].text}
                  </h2>

                  <div className="space-y-3">
                    {QUESTIONS[questionIdx].options.map((opt, i) => (
                      <motion.button
                        key={opt.key}
                        onClick={() => handleAnswer(QUESTIONS[questionIdx].id, opt.key)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -2, x: 0 }}
                        whileTap={{ y: 4, scale: 0.98 }}
                        className="w-full text-left p-5 rounded-xl font-body text-base sm:text-lg cursor-pointer"
                        style={{
                          background: COLORS.cream,
                          color: COLORS.charBlack,
                          border: `2px solid ${COLORS.charBlack}`,
                          boxShadow: `4px 4px 0 ${COLORS.charBlack}`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = COLORS.hotPink;
                          e.currentTarget.style.color = COLORS.cream;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = COLORS.cream;
                          e.currentTarget.style.color = COLORS.charBlack;
                        }}
                      >
                        {opt.label}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          {/* ───── THINKING ───── */}
          {stage === "thinking" && (
            <motion.div
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-12 sm:pt-20 flex flex-col items-center"
            >
              {/* sizzle lines rising behind Char */}
              <div className="relative" style={{ width: 240, height: 280 }}>
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="sizzle-line absolute rounded-full"
                    style={{
                      left: `${30 + i * 30}px`,
                      bottom: 50,
                      width: 3,
                      height: 50,
                      background: `linear-gradient(to top, ${COLORS.emberOrange}00, ${COLORS.emberOrange}cc, ${COLORS.hotPink}00)`,
                      animationDelay: `${i * 0.25}s`,
                    }}
                  />
                ))}
                <div className="absolute inset-0 flex items-end justify-center pb-2">
                  <Char mood="thinking" size={180} />
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingMsg}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="font-display text-2xl sm:text-3xl text-center mt-8"
                  style={{ color: COLORS.cream }}
                >
                  {[
                    "Tasting the idea...",
                    "Consulting the ancestors...",
                    "Doing the math you should have done...",
                    "Plating now.",
                  ][loadingMsg]}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          )}

          {/* ───── VERDICT ───── */}
          {stage === "verdict" && verdict && (
            <motion.div
              key="verdict"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-2"
            >
              {/* Char with reveal sparks */}
              <div className="flex justify-center mb-6">
                <Char mood={verdict.mood} size={130} sparks={sparkBurst} />
              </div>

              {/* LAYER 1 — VERDICT */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0, rotate: -3 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.1 }}
              >
                <h1
                  className="font-display text-center mb-5"
                  style={{
                    fontSize: verdict.verdict.length > 50 ? "clamp(36px, 7vw, 56px)" : "clamp(48px, 9vw, 88px)",
                    lineHeight: 0.92,
                    color: verdict.mood === "approving"
                      ? COLORS.greaseGold
                      : verdict.mood === "furious"
                      ? COLORS.infernoBlue
                      : verdict.mood === "disappointed"
                      ? COLORS.emberOrange
                      : COLORS.hotPink,
                  }}
                >
                  "{verdict.verdict}"
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="font-display text-xl sm:text-2xl text-center mb-8 px-2 opacity-95"
                style={{ lineHeight: 1.15, fontWeight: 800 }}
              >
                {verdict.roast}
              </motion.p>

              {revealLayer === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="flex flex-col items-center gap-3"
                >
                  <ChunkyButton onClick={() => setRevealLayer(2)} color={COLORS.hotPink}>
                    {verdict.revealCta} →
                  </ChunkyButton>
                  {/* ghost outline hint */}
                  <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mt-4 w-full max-w-sm h-20 rounded-lg"
                    style={{
                      border: `2px dashed ${COLORS.cream}33`,
                    }}
                  />
                  <p className="font-mono text-xs uppercase tracking-widest opacity-40">
                    [ there's more below ]
                  </p>
                </motion.div>
              )}

              {/* LAYER 2 — SCORECARD */}
              <AnimatePresence>
                {revealLayer >= 2 && (
                  <motion.div
                    ref={scorecardRef}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.6 }}
                    className="mt-10 mb-6 pt-8"
                    style={{ borderTop: `2px dashed ${COLORS.cream}33` }}
                  >
                    <div className="text-center mb-6">
                      <div
                        className="font-mono mb-2"
                        style={{
                          color: COLORS.emberOrange,
                          fontSize: 11,
                          letterSpacing: "0.22em",
                          fontWeight: 700,
                        }}
                      >
                        ━━ KITCHEN TICKET ━━
                      </div>
                      <h2
                        className="font-display"
                        style={{
                          fontSize: "clamp(28px, 7vw, 44px)",
                          letterSpacing: "-0.03em",
                          lineHeight: 0.95,
                        }}
                      >
                        The Scorecard
                      </h2>
                    </div>

                    <div className="space-y-5">
                      {verdict.scorecard.map((card, i) => (
                        <KitchenTicket
                          key={card.name}
                          name={card.name}
                          score={card.score}
                          note={card.note}
                          delay={i * 0.1}
                        />
                      ))}
                    </div>

                    {/* Overall */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: verdict.scorecard.length * 0.1 + 0.2 }}
                      className="mt-6 text-center p-5 rounded-xl"
                      style={{
                        background: COLORS.charBlack,
                        border: `3px solid ${COLORS.cream}`,
                      }}
                    >
                      <div className="font-mono text-xs uppercase tracking-widest opacity-60 mb-1">
                        Overall
                      </div>
                      <div className="font-mono font-bold text-5xl sm:text-6xl mb-2" style={{ color: heatColor(verdict.overall) }}>
                        {verdict.overall.toFixed(1)}<span className="text-2xl opacity-50">/10</span>
                      </div>
                      <div className="font-display text-2xl sm:text-3xl">
                        {verdict.overallWord}
                      </div>
                    </motion.div>

                    {revealLayer === 2 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: verdict.scorecard.length * 0.1 + 0.5 }}
                        className="flex justify-center mt-7"
                      >
                        <ChunkyButton onClick={() => setRevealLayer(3)} color={COLORS.emberOrange}>
                          {verdict.layer3Cta} →
                        </ChunkyButton>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* LAYER 3 — RECOMMENDATION */}
              <AnimatePresence>
                {revealLayer >= 3 && (
                  <motion.div
                    ref={layer3Ref}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.6 }}
                    className="mt-10 pt-8"
                    style={{ borderTop: `2px dashed ${COLORS.cream}33` }}
                  >
                    <div className="text-center mb-6">
                      <div
                        className="font-mono mb-2"
                        style={{
                          color: COLORS.greaseGold,
                          fontSize: 11,
                          letterSpacing: "0.22em",
                          fontWeight: 700,
                        }}
                      >
                        ━━ THE MOVE ━━
                      </div>
                      <h2
                        className="font-display"
                        style={{
                          fontSize: "clamp(28px, 7vw, 44px)",
                          letterSpacing: "-0.03em",
                          lineHeight: 0.95,
                        }}
                      >
                        {verdict.isMatched ? "How to actually do this" : "What to actually do"}
                      </h2>
                    </div>

                    {verdict.bulletsIntro && (
                      <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="font-display text-xl sm:text-2xl text-center mb-6 px-2"
                        style={{ color: COLORS.cream, lineHeight: 1.15 }}
                      >
                        {verdict.bulletsIntro}
                      </motion.p>
                    )}

                    <div className="space-y-3 mb-8">
                      {verdict.bullets.map((b, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="flex gap-3 p-4 rounded-lg"
                          style={{ background: COLORS.cream + "08", border: `1px solid ${COLORS.cream}15` }}
                        >
                          <Flame
                            size={20}
                            className="flex-shrink-0 mt-0.5"
                            style={{ color: COLORS.emberOrange, fill: COLORS.emberOrange }}
                          />
                          <p className="font-body text-sm sm:text-base leading-relaxed" style={{ color: COLORS.cream }}>
                            {b}
                          </p>
                        </motion.div>
                      ))}
                    </div>

                    {verdict.prompt && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: verdict.bullets.length * 0.08 + 0.2 }}
                        className="mt-6"
                      >
                        <div className="font-display text-lg sm:text-xl mb-3 px-1" style={{ color: COLORS.hotPink }}>
                          🪄 The prompt you actually want
                        </div>
                        <div className="flex items-start gap-3 mb-3 px-1">
                          <div className="flex-shrink-0" style={{ marginTop: 2 }}>
                            <Char mood="approving" size={36} withSkillet={false} />
                          </div>
                          <p className="font-body italic text-sm sm:text-base opacity-90 pt-1" style={{ color: COLORS.greaseGold }}>
                            {verdict.promptIntro}
                          </p>
                        </div>
                        <div
                          className="relative rounded-xl overflow-hidden"
                          style={{
                            background: COLORS.cream,
                            color: COLORS.charBlack,
                            border: `2px solid ${COLORS.charBlack}`,
                            boxShadow: `4px 4px 0 ${COLORS.charBlack}`,
                          }}
                        >
                          <button
                            onClick={handleCopyPrompt}
                            className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider transition-all"
                            style={{
                              background: copied ? COLORS.greaseGold : COLORS.hotPink,
                              color: COLORS.cream,
                              border: `2px solid ${COLORS.charBlack}`,
                            }}
                          >
                            {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                          </button>
                          <pre
                            className="font-mono text-xs sm:text-[13px] p-4 pt-12 overflow-x-auto whitespace-pre-wrap leading-relaxed"
                            style={{ color: COLORS.charBlack }}
                          >
                            {verdict.prompt}
                          </pre>
                        </div>
                      </motion.div>
                    )}

                    {/* SHARE / RESTART */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="mt-12 pt-8 border-t-2 border-dashed flex flex-col sm:flex-row gap-3 items-center justify-center"
                      style={{ borderColor: COLORS.cream + "30" }}
                    >
                      <ChunkyButton onClick={handleRestart} color={COLORS.hotPink}>
                        Roast another idea
                      </ChunkyButton>
                      <ChunkyButton onClick={handleShare} color={COLORS.emberOrange}>
                        {shareCopied ? "Copied to clipboard ✓" : "Share this verdict"}
                      </ChunkyButton>
                    </motion.div>

                    <p
                      className="font-mono text-center mt-6"
                      style={{
                        color: "#5A4530",
                        fontSize: 10,
                        letterSpacing: "0.18em",
                        fontWeight: 700,
                      }}
                    >
                      VERDICT ID — {verdictId}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
