/**
 * lib/ibmtts.ts
 *
 * IBM Watson Text-to-Speech client.
 *
 * Uses the IBM Watson TTS REST API directly (no SDK dependency — avoids
 * heavy SDK bundle weight). Authentication is IBM IAM Basic auth:
 *   username = "apikey"
 *   password = IBM_TTS_API_KEY
 *
 * Each story mood maps to a different IBM Watson V3 neural voice defined
 * in types/index.ts → MOOD_VOICE_MAP.
 *
 * Lite plan notes:
 *  • 10,000 characters/month free
 *  • All V3 neural voices included
 *  • No history or storage API — audio is synthesized on demand and
 *    returned directly as an ArrayBuffer (MP3). It is NOT stored on IBM's
 *    servers after the request completes.
 *  • Because there is no server-side audio storage, the Library view
 *    cannot replay audio from a saved audioId. Users must re-synthesize
 *    from the story text if they want audio again.
 *
 * Required env vars:
 *   IBM_TTS_API_KEY  — IAM API key from IBM Cloud TTS service credentials
 *   IBM_TTS_URL      — Service URL e.g. https://api.us-south.text-to-speech.watson.cloud.ibm.com
 */

import { StoryMood, MOOD_VOICE_MAP } from '@/types';

const TTS_PATH = '/v1/synthesize';
const AUDIO_FORMAT = 'audio/mp3'; // Widely supported; Watson also supports ogg, wav, etc.
const MAX_CHARS = 5_000;           // Conservative limit (Lite: 10k/month total)

// ─── Config helpers ───────────────────────────────────────────────────────────

function getEnv(): { apiKey: string; serviceUrl: string } {
  const apiKey = process.env.IBM_TTS_API_KEY;
  const serviceUrl = process.env.IBM_TTS_URL;

  if (!apiKey) {
    throw new Error('IBM_TTS_API_KEY environment variable is not set.');
  }
  if (!serviceUrl) {
    throw new Error(
      'IBM_TTS_URL environment variable is not set. ' +
      'Example: https://api.us-south.text-to-speech.watson.cloud.ibm.com'
    );
  }

  // Strip trailing slash to avoid double-slash in URL construction
  return { apiKey, serviceUrl: serviceUrl.replace(/\/$/, '') };
}

/**
 * Builds the Basic auth header for IBM Watson IAM authentication.
 * IBM Watson REST API accepts "apikey" as the username.
 */
function buildAuthHeader(apiKey: string): string {
  const credentials = Buffer.from(`apikey:${apiKey}`).toString('base64');
  return `Basic ${credentials}`;
}

// ─── Core synthesis function ──────────────────────────────────────────────────

/**
 * Converts text to speech using IBM Watson TTS.
 *
 * Selects the voice automatically based on the story mood.
 * Returns raw MP3 bytes as an ArrayBuffer.
 *
 * Throws descriptive errors for:
 *  • Missing / invalid credentials (401)
 *  • Unsupported voice name (404)
 *  • Character limit exceeded (400)
 *  • Quota/rate limit (429)
 *  • Network timeouts
 */
export async function synthesizeSpeech(
  text: string,
  mood: StoryMood
): Promise<ArrayBuffer> {
  if (!text || !text.trim()) {
    throw new Error('Text must be a non-empty string.');
  }

  if (text.length > MAX_CHARS) {
    throw new Error(
      `Text exceeds the ${MAX_CHARS}-character limit for IBM Watson TTS. ` +
      'Please shorten the story content.'
    );
  }

  const { apiKey, serviceUrl } = getEnv();
  const voiceConfig = MOOD_VOICE_MAP[mood];
  const voiceName = voiceConfig.voiceName;

  const endpoint = `${serviceUrl}${TTS_PATH}?voice=${encodeURIComponent(voiceName)}`;

  console.log(
    `[IBM TTS] Synthesizing mood="${mood}" voice="${voiceName}" chars=${text.length}`
  );

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: buildAuthHeader(apiKey),
        'Content-Type': 'application/json',
        Accept: AUDIO_FORMAT,
      },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(45_000), // 45 s — generous for longer texts
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    if (msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('abort')) {
      throw new Error(
        'IBM Watson TTS request timed out. The service may be under load — please try again.'
      );
    }
    throw new Error(
      `Network error calling IBM Watson TTS: ${msg}`
    );
  }

  // ── Handle error responses ────────────────────────────────────────────────
  if (!response.ok) {
    let detail = '';
    try {
      const errorBody = await response.json();
      detail = errorBody.error ?? errorBody.description ?? '';
    } catch {
      detail = await response.text().catch(() => '');
    }

    switch (response.status) {
      case 400:
        throw new Error(
          `IBM Watson TTS bad request: ${detail || 'Invalid input text or parameters.'}`
        );
      case 401:
        throw new Error(
          'IBM Watson TTS authentication failed. Check your IBM_TTS_API_KEY.'
        );
      case 404:
        throw new Error(
          `IBM Watson TTS voice "${voiceName}" not found. ` +
          'It may not be available on your Lite plan region. Check IBM_TTS_URL.'
        );
      case 429:
        throw new Error(
          'IBM Watson TTS rate limit reached. ' +
          'Your Lite plan (10,000 chars/month) may be exhausted. ' +
          'Check your usage at https://cloud.ibm.com/resources'
        );
      case 503:
        throw new Error(
          'IBM Watson TTS service is temporarily unavailable. Please try again.'
        );
      default:
        throw new Error(
          `IBM Watson TTS error (${response.status}): ${detail || 'Unknown error.'}`
        );
    }
  }

  // ── Return raw audio bytes ────────────────────────────────────────────────
  return response.arrayBuffer();
}

// ─── Voice listing helper (optional / for debugging) ─────────────────────────

/**
 * Lists all voices available on your IBM Watson TTS instance.
 * Useful during development to verify which voices are on your Lite plan region.
 *
 * Call via a temporary GET route or a one-off Node script — not exposed in production.
 */
export async function listAvailableVoices(): Promise<
  Array<{ name: string; language: string; gender: string; description: string }>
> {
  const { apiKey, serviceUrl } = getEnv();

  const response = await fetch(`${serviceUrl}/v1/voices`, {
    method: 'GET',
    headers: { Authorization: buildAuthHeader(apiKey) },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Failed to list IBM TTS voices (${response.status}).`);
  }

  const data = await response.json();
  return (data.voices ?? []) as Array<{
    name: string;
    language: string;
    gender: string;
    description: string;
  }>;
}
