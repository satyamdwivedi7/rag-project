/** Accepted prefix for all Gemini Files API URIs. Validated server-side before any Gemini call. */
export const GEMINI_FILE_URI_PREFIX = "https://generativelanguage.googleapis.com/";

/** Maximum PDF upload size (50 MB). Enforced before buffering to prevent OOM on Vercel. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
