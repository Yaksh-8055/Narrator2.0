// ─── Story Moods ─────────────────────────────────────────────────────────────
export type StoryMood =
  | 'adventure'
  | 'horror'
  | 'romance'
  | 'comedy'
  | 'mystery'
  | 'fantasy'
  | 'children'
  | 'dramatic';

export interface MoodConfig {
  voiceName: string; // IBM Watson TTS voice name
  label: string;
  emoji: string;
  description: string;
}

/**
 * Maps each story mood to a specific IBM Watson TTS voice.
 *
 * All voices below are available on the IBM Watson TTS Lite plan.
 * Full voice list: https://cloud.ibm.com/docs/text-to-speech?topic=text-to-speech-voices
 *
 * Voice name format: <language>_<Name>V3Voice  (V3 = neural, highest quality on Lite)
 */
export const MOOD_VOICE_MAP: Record<StoryMood, MoodConfig> = {
  adventure: {
    voiceName: 'en-US_HenryV3Voice',   // Deep, confident US male
    label: 'Adventure',
    emoji: '⚔️',
    description: 'Deep, confident US male voice for epic tales',
  },
  horror: {
    voiceName: 'en-US_KevinV3Voice',   // Gravelly, tense US male
    label: 'Horror',
    emoji: '👻',
    description: 'Tense US male voice for scary stories',
  },
  romance: {
    voiceName: 'en-US_AllisonV3Voice', // Warm, expressive US female
    label: 'Romance',
    emoji: '💖',
    description: 'Warm, expressive US female voice for love stories',
  },
  comedy: {
    voiceName: 'en-US_MichaelV3Voice', // Upbeat, friendly US male
    label: 'Comedy',
    emoji: '😄',
    description: 'Upbeat, friendly US male voice for funny stories',
  },
  mystery: {
    voiceName: 'en-GB_JamesV3Voice',   // Deep British male — suave and subtle
    label: 'Mystery',
    emoji: '🔍',
    description: 'Deep British male voice for suspenseful tales',
  },
  fantasy: {
    voiceName: 'en-US_EmilyV3Voice',   // Soft, storytelling US female
    label: 'Fantasy',
    emoji: '🧙',
    description: 'Soft storytelling US female voice for magical tales',
  },
  children: {
    voiceName: 'en-US_LisaV3Voice',    // Clear, friendly US female
    label: "Children's",
    emoji: '🌟',
    description: "Clear, friendly US female voice for kids' stories",
  },
  dramatic: {
    voiceName: 'en-GB_KateV3Voice',    // Composed, emotive British female
    label: 'Dramatic',
    emoji: '🎭',
    description: 'Composed, emotive British female voice for dramatic stories',
  },
};

// ─── Cloudant Document ────────────────────────────────────────────────────────
export interface Story {
  _id?: string;
  _rev?: string;
  type?: 'story';
  userId: string;
  title: string;
  content: string;
  mood: StoryMood;
  prompt: string;
  /**
   * Not used with IBM Watson TTS (no history/storage API on Lite plan).
   * Reserved for future use with IBM Cloud Object Storage if needed.
   */
  audioId?: string;
  createdAt: string; // ISO 8601
}

// ─── API Request / Response shapes ───────────────────────────────────────────
export interface GenerateStoryRequest {
  prompt: string;
  mood: StoryMood;
}

export interface GenerateStoryResponse {
  title: string;
  content: string;
}

export interface TTSRequest {
  text: string;
  mood: StoryMood;
}

export interface SaveStoryRequest {
  title: string;
  content: string;
  mood: StoryMood;
  prompt: string;
  audioId?: string;
}

// ─── User (Demo Mode) ──────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
}

// ─── Frontend auth state ──────────────────────────────────────────────────────
export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}
