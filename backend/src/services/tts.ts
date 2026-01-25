import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const API_KEY = process.env.ELEVENLABS_API_KEY;

// ElevenLabs voice IDs - using "Rachel" for a natural female voice
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel

if (!API_KEY) {
  console.warn('[TTS] Missing ELEVENLABS_API_KEY - TTS will be disabled');
}

interface TTSOptions {
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
}

/**
 * Generate speech audio from text using ElevenLabs TTS API
 * @param text The text to convert to speech
 * @param options Optional TTS settings
 * @returns Base64 encoded audio (mp3 format)
 */
export async function textToSpeech(text: string, options: TTSOptions = {}): Promise<string | null> {
  if (!API_KEY) {
    console.warn('[TTS] No API key, skipping TTS');
    return null;
  }

  const {
    voiceId = DEFAULT_VOICE_ID,
    modelId = 'eleven_turbo_v2_5', // Fast, high-quality model
    stability = 0.5,
    similarityBoost = 0.75
  } = options;

  try {
    console.log(`[TTS] Generating speech for: "${text.substring(0, 50)}..."`);

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TTS] ElevenLabs API error: ${response.status} - ${errorText}`);
      return null;
    }

    // Convert audio buffer to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    console.log(`[TTS] Generated ${Math.round(arrayBuffer.byteLength / 1024)}KB of audio`);
    return base64Audio;

  } catch (error) {
    console.error('[TTS] Error generating speech:', error);
    return null;
  }
}
