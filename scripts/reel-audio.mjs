#!/usr/bin/env node
/**
 * Generate all dialogue lines + sound effects for a reel.
 *
 *   npm run reel:audio -- teleport-ult
 *
 * Reads   reels/<name>/reel.json
 * Writes  public/reels/<name>/<id>.mp3                 (one file per line / sfx)
 *         src/reels/<name>/audio.generated.json        (durations + captions)
 *
 * Unchanged lines are NOT regenerated (saves ElevenLabs credits).
 * Use --force to regenerate everything, or --only <id> to redo one item.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { audioDurationMs, loadEnv, soundEffect, tts } from "./lib/elevenlabs.mjs";

loadEnv();
const args = process.argv.slice(2);
const force = args.includes("--force");
const onlyIdx = args.indexOf("--only");
const only = onlyIdx >= 0 ? args[onlyIdx + 1] : null;
const name = args.find((a, i) => !a.startsWith("--") && (onlyIdx < 0 || i !== onlyIdx + 1));
if (!name) {
  console.error("Usage: npm run reel:audio -- <reel-name> [--force] [--only <id>]");
  process.exit(1);
}

const def = JSON.parse(fs.readFileSync(`reels/${name}/reel.json`, "utf8"));
const audioDir = `public/reels/${name}`;
const manifestPath = `src/reels/${name}/audio.generated.json`;
fs.mkdirSync(audioDir, { recursive: true });
fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
const old = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : { lines: {}, sfx: {} };
const manifest = { lines: {}, sfx: {} };
const save = () => fs.writeFileSync(manifestPath, JSON.stringify({ lines: { ...old.lines, ...manifest.lines }, sfx: { ...old.sfx, ...manifest.sfx } }, null, 2) + "\n");
const hash = (o) => crypto.createHash("sha1").update(JSON.stringify(o)).digest("hex").slice(0, 12);
const reuse = (kind, id, h) =>
  !force && only !== id && old[kind][id]?.hash === h && fs.existsSync(path.join("public", old[kind][id].file));

for (const line of def.lines) {
  const voiceId = def.voices[line.speaker];
  if (!voiceId) throw new Error(`No voice for speaker "${line.speaker}"`);
  const modelId = line.model ?? def.model ?? "eleven_multilingual_v2";
  const h = hash({ text: line.text, voiceId, modelId, s: line.voiceSettings });
  if (reuse("lines", line.id, h)) {
    manifest.lines[line.id] = old.lines[line.id];
    console.log(`= ${line.id} (cached)`);
    continue;
  }
  console.log(`→ ${line.id} [${line.speaker}] ${line.text}`);
  const { audio, captions } = await tts({ text: line.text, voiceId, modelId, voiceSettings: line.voiceSettings });
  const file = `reels/${name}/${line.id}.mp3`;
  fs.writeFileSync(path.join("public", file), audio);
  manifest.lines[line.id] = { speaker: line.speaker, file, durationMs: await audioDurationMs(audio), captions, hash: h };
  save(); // keep progress if a later item fails
}

for (const s of def.sfx ?? []) {
  const h = hash(s);
  if (reuse("sfx", s.id, h)) {
    manifest.sfx[s.id] = old.sfx[s.id];
    console.log(`= sfx ${s.id} (cached)`);
    continue;
  }
  console.log(`→ sfx ${s.id}: ${s.prompt}`);
  const audio = await soundEffect({ prompt: s.prompt, durationSeconds: s.duration, promptInfluence: s.influence });
  const file = `reels/${name}/sfx-${s.id}.mp3`;
  fs.writeFileSync(path.join("public", file), audio);
  manifest.sfx[s.id] = { file, durationMs: await audioDurationMs(audio), hash: h };
  save();
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`✔ ${manifestPath}`);
