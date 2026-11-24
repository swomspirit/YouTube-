#!/usr/bin/env node
/**
 * Generate a single narration voiceover + word-timed captions with ElevenLabs.
 *
 *   npm run voiceover                       # reads voiceover/script.txt
 *   npm run voiceover -- path/to/script.txt --voice <voiceId> --out intro
 *
 * Writes public/voiceover/<out>.mp3 and public/voiceover/<out>.captions.json
 */
import fs from "node:fs";
import path from "node:path";
import { loadEnv, tts } from "./lib/elevenlabs.mjs";

loadEnv();
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const voiceId = flag("voice", process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb"); // George
const modelId = flag("model", process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2");
const outName = flag("out", "voiceover");
const scriptPath = args[0] || "voiceover/script.txt";

const text = fs.readFileSync(scriptPath, "utf8").trim();
if (!text) throw new Error(`${scriptPath} is empty`);
if (text.length > 9500) {
  console.error(`Script is ${text.length} characters; ElevenLabs allows ~10,000 per request. Split it into parts.`);
  process.exit(1);
}

console.log(`Generating voiceover (${text.length} chars, voice ${voiceId}, model ${modelId})...`);
const { audio, captions } = await tts({
  text,
  voiceId,
  modelId,
  voiceSettings: { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true },
});

const outDir = "public/voiceover";
fs.mkdirSync(outDir, { recursive: true });
const mp3Path = path.join(outDir, `${outName}.mp3`);
const capPath = path.join(outDir, `${outName}.captions.json`);
fs.writeFileSync(mp3Path, audio);
fs.writeFileSync(capPath, JSON.stringify(captions, null, 2));
console.log(`✔ ${mp3Path}`);
console.log(`✔ ${capPath} (${captions.length} words, ~${(captions.at(-1).endMs / 1000).toFixed(1)}s)`);
