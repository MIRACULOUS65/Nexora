// Sent to the chat when the model provider is overloaded or rate limited, so the panel can offer a retry.
export const MODEL_BUSY_ERROR = "MODEL_BUSY";

// Any other failure that happens while the answer is streaming.
export const AGENT_FAILED_ERROR = "AGENT_FAILED";

// HTTP statuses where trying again a moment later is likely to work.
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

// The text that goes to the browser for an error thrown mid-stream. Only these fixed codes are sent,
// so provider details (keys, request bodies) never reach the client.
export function toStreamErrorMessage(error: unknown): string {
    const { statusCode, isRetryable } = (error ?? {}) as { statusCode?: number; isRetryable?: boolean };
    const busy = (statusCode !== undefined && RETRYABLE_STATUSES.has(statusCode)) || isRetryable === true;
    return busy ? MODEL_BUSY_ERROR : AGENT_FAILED_ERROR;
}
