/**
 * Anthropic API wrapper with error classification.
 *
 * Not calling the API yet — all scoring is client-side.
 * This module exists so that when LLM generation lands,
 * every failure mode already has a Char-voiced message
 * and the API route just calls `generateRoast()`.
 */

export type AnthropicErrorType =
  | "rate_limited"
  | "spend_cap"
  | "overloaded"
  | "timeout"
  | "auth"
  | "unknown";

export interface AnthropicError {
  type: AnthropicErrorType;
  charMessage: string;
  retryable: boolean;
  retryAfterMs?: number;
}

/**
 * Classify an Anthropic API error into a type with a Char-voiced message.
 * Handles the full range of failure modes from the Anthropic API:
 * - 429: rate limited or spend cap
 * - 529: API overloaded
 * - 401: bad API key
 * - timeout / network errors
 */
export function classifyAnthropicError(error: unknown): AnthropicError {
  // Network / timeout errors (no response object)
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    if (msg.includes("timeout") || msg.includes("timed out") || msg.includes("aborted")) {
      return {
        type: "timeout",
        charMessage: "Char's having a moment. Try again in a sec.",
        retryable: true,
        retryAfterMs: 3000,
      };
    }

    if (msg.includes("fetch failed") || msg.includes("econnrefused") || msg.includes("network")) {
      return {
        type: "unknown",
        charMessage: "Char's having a moment. Try again in a sec.",
        retryable: true,
        retryAfterMs: 5000,
      };
    }
  }

  // HTTP response errors (from Anthropic SDK or raw fetch)
  const status = (error as any)?.status || (error as any)?.statusCode;
  const body = (error as any)?.error || (error as any)?.body || {};
  const errorType = body?.error?.type || "";

  if (status === 429) {
    // Distinguish between rate limit and spend cap.
    // Anthropic returns error.type = "rate_limit_error" for both,
    // but the message differs. Spend cap messages mention "budget" or "spending".
    const message = body?.error?.message || "";
    const isSpendCap =
      message.toLowerCase().includes("budget") ||
      message.toLowerCase().includes("spending") ||
      message.toLowerCase().includes("credit");

    if (isSpendCap) {
      return {
        type: "spend_cap",
        charMessage:
          "Char is having a moment of personal reflection. Come back tomorrow.",
        retryable: false,
      };
    }

    return {
      type: "rate_limited",
      charMessage: "Char's having a moment. Try again in a sec.",
      retryable: true,
      retryAfterMs: 30000,
    };
  }

  if (status === 529 || status === 503) {
    return {
      type: "overloaded",
      charMessage: "Char's having a moment. Try again in a sec.",
      retryable: true,
      retryAfterMs: 10000,
    };
  }

  if (status === 401) {
    return {
      type: "auth",
      charMessage: "Char's having a moment. Try again in a sec.",
      retryable: false,
    };
  }

  // Catch-all
  return {
    type: "unknown",
    charMessage: "Char's having a moment. Try again in a sec.",
    retryable: true,
    retryAfterMs: 5000,
  };
}

/**
 * Placeholder for the actual Anthropic call.
 * When LLM generation lands, this function:
 * 1. Calls the Anthropic API with the user's input
 * 2. Classifies any error with classifyAnthropicError()
 * 3. Returns either the generated content or a typed error
 *
 * Usage in the API route:
 *
 *   const result = await generateRoast(input);
 *   if (result.error) {
 *     return res.status(result.error.retryable ? 503 : 500).json({
 *       error: result.error.charMessage,
 *       retryable: result.error.retryable,
 *     });
 *   }
 *   // use result.data
 */
export async function generateRoast(
  _input: unknown
): Promise<{ data?: unknown; error?: AnthropicError }> {
  // Not implemented yet — scoring is client-side.
  // When this goes live, the implementation goes here.
  return { data: null, error: undefined };
}
