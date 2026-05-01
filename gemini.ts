/**
 * lib/gemini.ts
 *
 * Google Gemini 1.5 Pro — Story generation client.
 *
 * Each mood has a tailored system instruction so the model adapts its tone,
 * pacing, and vocabulary accordingly.
 *
 * The model is prompted to respond ONLY with a JSON object:
 *   { "title": "...", "content": "..." }
 *
 * Required env var:  GEMINI_API_KEY
 */

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import { StoryMood } from '@/types';

// ─── Client (singleton) ───────────────────────────────────────────────────────

function getGenAI(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY environment variable is not set.');
  return new GoogleGenerativeAI(key);
}

// ─── Mood → Tone instructions ─────────────────────────────────────────────────

const MOOD_INSTRUCTIONS: Record<StoryMood, string> = {
  adventure:
    'Write an exciting, action-packed adventure story. Use vivid action verbs, fast pacing, and a brave protagonist who overcomes obstacles.',
  horror:
    'Write a chilling horror story with slow-burn suspense, dread-building details, and an unsettling or shocking twist at the end.',
  romance:
    'Write a heartfelt romance story with rich emotional depth, tender dialogue, and a satisfying connection between two characters.',
  comedy:
    'Write a light-hearted, genuinely funny comedy story with clever wordplay, absurd situations, and a cheerful resolution.',
  mystery:
    'Write an intriguing mystery story. Plant red herrings, build tension carefully, and deliver a clever, satisfying reveal.',
  fantasy:
    'Write a magical fantasy story with imaginative world-building, a sense of wonder, and fantastical creatures or powers.',
  children:
    'Write a simple, warm, and age-appropriate children\'s story (suitable for ages 5–10). Use easy language and include a positive moral lesson.',
  dramatic:
    'Write a deeply emotional and dramatic story with complex, flawed characters, internal conflict, and a meaningful resolution.',
};

// ─── Safety settings ──────────────────────────────────────────────────────────

const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// ─── Core function ────────────────────────────────────────────────────────────

/**
 * Calls Gemini 1.5 Pro to generate a short story.
 * Returns a validated { title, content } object.
 * Throws descriptive errors for quota limits, timeouts, and bad formats.
 */
export async function generateStory(
  prompt: string,
  mood: StoryMood
): Promise<{ title: string; content: string }> {
  const genAI = getGenAI();

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    safetySettings: SAFETY_SETTINGS,
    systemInstruction: buildSystemInstruction(mood),
  });

  const userPrompt = buildUserPrompt(prompt, mood);

  let rawText: string;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.85,
        topP: 0.95,
        maxOutputTokens: 1200,
      },
    });

    rawText = result.response.text().trim();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
      throw new Error(
        'Gemini API quota exceeded. Please wait a moment and try again.'
      );
    }
    if (msg.includes('503') || msg.toLowerCase().includes('unavailable')) {
      throw new Error('Gemini API is temporarily unavailable. Please retry.');
    }
    if (msg.toLowerCase().includes('timeout')) {
      throw new Error('Gemini request timed out. Please try again.');
    }
    throw new Error(`Gemini API error: ${msg}`);
  }

  // ── Parse response ──────────────────────────────────────────────────────────
  return parseGeminiResponse(rawText);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSystemInstruction(mood: StoryMood): string {
  return `You are a master storyteller specialising in ${mood} fiction.
${MOOD_INSTRUCTIONS[mood]}

CRITICAL OUTPUT RULES:
1. Respond ONLY with a valid JSON object. No markdown, no code blocks, no preamble.
2. The JSON must have exactly two string fields: "title" and "content".
3. "title": 5–10 words, compelling and appropriate for the mood.
4. "content": 3–4 paragraphs (~300–500 words), well-structured narrative prose.
5. Do NOT include any text before or after the JSON object.`;
}

function buildUserPrompt(prompt: string, mood: StoryMood): string {
  return `Create a ${mood} story based on this prompt: "${prompt}"

Respond with ONLY this exact JSON structure (no other text):
{
  "title": "Your story title here",
  "content": "Your full story content here with proper paragraph breaks..."
}`;
}

function parseGeminiResponse(raw: string): { title: string; content: string } {
  // Strip markdown code fences if the model wraps its output
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Fallback: try to extract the first JSON object from the response
    const match = cleaned.match(/\{[\s\S]*?\}/);
    if (!match) {
      throw new Error(
        'Gemini returned a non-JSON response. Please try again.'
      );
    }
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      throw new Error(
        'Could not parse the story JSON from Gemini\'s response. Please try again.'
      );
    }
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('title' in parsed) ||
    !('content' in parsed)
  ) {
    throw new Error(
      'Gemini response is missing required "title" or "content" fields.'
    );
  }

  const { title, content } = parsed as Record<string, unknown>;

  if (typeof title !== 'string' || !title.trim()) {
    throw new Error('Gemini returned an empty or invalid story title.');
  }
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Gemini returned empty or invalid story content.');
  }

  return {
    title: title.trim(),
    content: content.trim(),
  };
}
