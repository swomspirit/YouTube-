// Shared ElevenLabs helpers for the project scripts.
import fs from "node:fs";
import { ALL_FORMATS, BufferSource, Input } from "mediabunny";

export function loadEnv() {
  if (!fs.existsSync(".env")) return;
  for (const line of fs.readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

function apiKey() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    console.error("Missing ELEVENLABS_API_KEY. Put it in .env (see .env.example) or export it.");
    process.exit(1);
  }
  return key;
}

async function post(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": apiKey(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  return res;
}

/**
 * Convert ElevenLabs character alignment into @remotion/captions Caption[].
 * Delivery tags like "[whispers]" (eleven_v3) are removed from the captions.
 */
export function alignmentToCaptions(alignment) {
  const { characters, character_start_times_seconds: starts, character_end_times_seconds: ends } = alignment;
  const captions = [];
  let word = "";
  let wStart = 0;
  let wEnd = 0;
  let inTag = false;
  const flush = () => {
    if (!word) return;
    captions.push({
      text: (captions.length === 0 ? "" : " ") + word,
      startMs: Math.round(wStart * 1000),
      endMs: Math.round(wEnd * 1000),
      timestampMs: Math.round(((wStart + wEnd) / 2) * 1000),
      confidence: 1,
    });
    word = "";
  };
  characters.forEach((ch, i) => {
    if (ch === "[") return void (inTag = true);
    if (ch === "]") return void (inTag = false);
    if (inTag) return;
    if (/\s/.test(ch)) return flush();
    if (!word) wStart = starts[i];
    word += ch;
    wEnd = ends[i];
  });
  flush();
  return captions;
}

/** Text to speech with word timings. Returns { audio: Buffer, captions: Caption[] } */
export async function tts({ text, voiceId, modelId = "eleven_multilingual_v2", voiceSettings }) {
  const res = await post(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`,
    {
      text,
      model_id: modelId,
      ...(voiceSettings ? { voice_settings: voiceSettings } : {}),
    },
  );
  const data = await res.json();
  return {
    audio: Buffer.from(data.audio_base64, "base64"),
    captions: alignmentToCaptions(data.alignment ?? data.normalized_alignment),
  };
}

/** Sound effect from a text prompt. Returns Buffer (mp3). */
export async function soundEffect({ prompt, durationSeconds, promptInfluence = 0.5, loop = false }) {
  const res = await post("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128", {
    text: prompt,
    ...(durationSeconds ? { duration_seconds: durationSeconds } : {}),
    prompt_influence: promptInfluence,
    ...(loop ? { loop: true } : {}),
  });
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Music track (ElevenLabs Music). Returns Buffer (mp3).
 * Pass either a text `prompt` (+ lengthMs) or a `plan` (composition plan: global styles + timed sections),
 * which lets the score follow the video section by section.
 */
export async function musicTrack({ prompt, lengthMs, plan }) {
  const body = plan ? { composition_plan: plan } : { prompt, music_length_ms: lengthMs };
  const res = await post("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", body);
  return Buffer.from(await res.arrayBuffer());
}

export async function audioDurationMs(buffer) {
  const input = new Input({ formats: ALL_FORMATS, source: new BufferSource(buffer) });
  return Math.round((await input.computeDuration()) * 1000);
}
