#!/usr/bin/env node
// List the voices on your ElevenLabs account:  npm run voices
import fs from "node:fs";
if (fs.existsSync(".env")) {
  for (const line of fs.readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const res = await fetch("https://api.elevenlabs.io/v2/voices?page_size=100", {
  headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "" },
});
if (!res.ok) {
  console.error(`ElevenLabs error ${res.status}: ${await res.text()}`);
  process.exit(1);
}
const { voices } = await res.json();
for (const v of voices) {
  const l = v.labels ?? {};
  console.log(`${v.voice_id}  ${v.name.padEnd(28)} ${[l.gender, l.accent, l.age, l.use_case].filter(Boolean).join(", ")}`);
}
