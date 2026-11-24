#!/usr/bin/env node
/**
 * Generate a voiceover + word-timed captions with ElevenLabs.
 *
 *   npm run voiceover                       # reads voiceover/script.txt
 *   npm run voiceover -- path/to/script.txt --voice <voiceId> --out intro
 *
 * Writes:
 *   public/voiceover/<out>.mp3            the narration
 *   public/voiceover/<out>.captions.json  Caption[] for @remotion/captions
 *
 * Needs ELEVENLABS_API_KEY in the environment (or a .env file).
 * Optional: ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL_ID.
 */
import fs from "node:fs";
import path from "node:path";

// --- tiny .env loader (no dependency) --------------------------------------
if (fs.existsSync(".env")) {
  for (const line of fs.readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

// --- args --------------------------------------------------------------------
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const voiceId = flag("voice", process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb"); // "George" (premade)
const modelId = flag("model", process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2");
const outName = flag("out", "voiceover");
const scriptPath = args[0] || "voiceover/script.txt";

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("Missing ELEVENLABS_API_KEY. Put it in .env (see .env.example) or export it.");
  process.exit(1);
}

const text = fs.readFileSync(scriptPath, "utf8").trim();
if (!text) throw new Error(`${scriptPath} is empty`);
if (text.length > 9500) {
  console.error(`Script is ${text.length} characters; ElevenLabs allows ~10,000 per request. Split it into parts with --out part1, --out part2 ...`);
  process.exit(1);
}

// --- call ElevenLabs ---------------------------------------------------------
console.log(`Generating voiceover (${text.length} chars, voice ${voiceId}, model ${modelId})...`);
const res = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`,
  {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true },
    }),
  },
);
if (!res.ok) {
  console.error(`ElevenLabs error ${res.status}: ${await res.text()}`);
  process.exit(1);
}
const data = await res.json();
const alignment = data.alignment ?? data.normalized_alignment;

// --- characters -> words -> Caption[] ----------------------------------------
const { characters, character_start_times_seconds: starts, character_end_times_seconds: ends } = alignment;
const captions = [];
let word = "";
let wStart = 0;
let wEnd = 0;
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
  if (/\s/.test(ch)) return flush();
  if (!word) wStart = starts[i];
  word += ch;
  wEnd = ends[i];
});
flush();

// --- write files -------------------------------------------------------------
const outDir = "public/voiceover";
fs.mkdirSync(outDir, { recursive: true });
const mp3Path = path.join(outDir, `${outName}.mp3`);
const capPath = path.join(outDir, `${outName}.captions.json`);
fs.writeFileSync(mp3Path, Buffer.from(data.audio_base64, "base64"));
fs.writeFileSync(capPath, JSON.stringify(captions, null, 2));

const last = captions.at(-1);
console.log(`✔ ${mp3Path}`);
console.log(`✔ ${capPath} (${captions.length} words, ~${(last.endMs / 1000).toFixed(1)}s)`);
console.log(`\nUse it: set voiceoverFile: "voiceover/${outName}.mp3" and captionsFile: "voiceover/${outName}.captions.json" in src/Root.tsx`);
