# 3D YouTube Videos — three.js + Remotion

- **three.js** (through [react-three-fiber](https://r3f.docs.pmnd.rs/)) draws the 3D scenes.
- **[Remotion](https://www.remotion.dev/)** handles the timeline, captions, audio, and rendering to MP4.

## Quick start

```bash
npm install
npm run dev          # opens Remotion Studio: preview, scrub, tweak props live
npm run render       # renders out/video.mp4 (1920x1080, landscape)
npm run render:short # renders out/short.mp4 (1080x1920, YouTube Shorts)
npm run still        # renders out/thumbnail.png
```

If you have no GPU (a server, CI, or some Linux machines), use the software renderer:
`npm run render:cpu` / `npm run render:short:cpu`. It's slower but works everywhere.

## Voiceover + captions with ElevenLabs

One command turns a text script into narration **and** word-perfect captions:

1. Copy `.env.example` to `.env` and add your ElevenLabs API key.
   The key needs the **Text to Speech** permission (and **Voices → Read** for `npm run voices`).
2. Write your narration in `voiceover/script.txt`.
3. Run:
   ```bash
   npm run voices      # optional: list voice IDs on your account
   npm run voiceover   # or: npm run voiceover -- voiceover/script.txt --voice <id> --out intro
   ```
   This writes `public/voiceover/voiceover.mp3` and `public/voiceover/voiceover.captions.json`.
   The captions come from ElevenLabs' own character timings, so they match the audio exactly.
   You don't need a separate transcription step.
4. In `src/Root.tsx` set:
   ```ts
   voiceoverFile: "voiceover/voiceover.mp3",
   captionsFile: "voiceover/voiceover.captions.json",
   ```
   The video length now follows the narration automatically (plus 1.5s), and the
   background music drops under the voice.

If you're behind an HTTPS proxy (e.g. a cloud dev box), Node's `fetch` ignores `HTTPS_PROXY`
unless you run with `NODE_USE_ENV_PROXY=1` (Node 22.21+).

Tip: write numbers and symbols the way they should be spoken ("three dot j s"), because
the captions show the spoken words.

## 3 Levels of Piano (16:9, ~5 min)

A cartoon pianist plays three public-domain pieces of increasing difficulty, with
Synthesia-style falling notes on an 88-key keyboard and ElevenLabs narration.

| Level | Piece | Source |
|---|---|---|
| Easy | Ode to Joy (Beethoven) | written in `scripts/piano/build_songs.py` |
| Medium | Für Elise (Beethoven) | written in `scripts/piano/build_songs.py` |
| Hard | Maple Leaf Rag (Joplin) | music21 corpus, repeats expanded |

```bash
sudo apt-get install -y fluidsynth fluid-soundfont-gm && pip install music21 mido
python3 scripts/piano/build_songs.py          # notes JSON + piano audio (FluidSynth)
npm run reel:audio -- piano-levels            # narration + applause/chime (ElevenLabs)
npx remotion render PianoLevels out/3-levels-of-piano.mp4
```

The piano audio is rendered from the notes, so the falling notes and the sound always line up,
and there are no copyrighted recordings.

## 2D cartoon reels (9:16)

Short, joke-per-reel cartoons in a flat chibi style. Each reel has:

- `reels/<name>/reel.json`: the script (who says what, which ElevenLabs voice, and sound-effect prompts)
- `src/reels/<name>/<Reel>.tsx`: the animation timeline
- `src/cartoon/`: reusable characters (Pip, Shade, Bolt), faces, backgrounds, captions, meme text, kill feed

```bash
npm run reel:audio -- teleport-ult        # voices + SFX via ElevenLabs (cached; --force / --only <id>)
npx remotion render Reel-TeleportUlt out/reel-teleport-ult.mp4
```

Dialogue uses `eleven_v3`, so lines can include delivery tags like `[whispers]` or `[annoyed]`.
These tags are removed from the captions automatically. The timeline is built from the real audio
lengths, so you can change a line, re-run `reel:audio`, and the animation re-times itself.

## Project layout

```
src/
  index.ts              entry point (registerRoot)
  Root.tsx              compositions: Main3DVideo (16:9) and Short3DVideo (9:16)
  Video.tsx             puts the layers together: 3D canvas, title, captions, audio
  scenes/HeroScene.tsx  the three.js scene (meshes, lights, camera moves)
  components/
    Captions.tsx        word-by-word highlighted captions (@remotion/captions)
    Title.tsx           animated title overlay
    Starfield.tsx       deterministic star background
public/
  captions.json         caption timings (Caption[] format)
  audio/music.mp3       placeholder music bed (replace with your own music)
  voiceover/            generated narration + captions (npm run voiceover)
scripts/
  voiceover.mjs         ElevenLabs text-to-speech with timestamps -> mp3 + captions
  voices.mjs            list your ElevenLabs voices
voiceover/script.txt    the narration text
remotion.config.ts      render settings (OpenGL backend, concurrency, codec)
```

## The one rule for 3D in Remotion

**Animate from `useCurrentFrame()`, never from `useFrame()`, `THREE.Clock`, or `Math.random()`.**
Remotion renders frames in parallel and out of order, so each frame must be computed
only from its frame number. For randomness, use Remotion's seeded `random("seed")`
(see `Starfield.tsx`). For springs and easing, use `spring()` and `interpolate()`.

```tsx
const frame = useCurrentFrame();
const { fps } = useVideoConfig();
<mesh rotation={[0, frame / fps, 0]} />  // ✅ deterministic
```

## Adding your own content

**New scene:** copy `scenes/HeroScene.tsx`, then put it in `<ThreeCanvas>` in `Video.tsx`.
To play scenes one after another, wrap each one in `<Sequence from={...} durationInFrames={...}>`.

**3D models (.glb):** put them in `public/models/` and load them with drei's
`useGLTF(staticFile("models/thing.glb"))`.

**Your own recorded voiceover / music:** put the file in `public/`, then set `voiceoverFile` or
`musicFile` in `Root.tsx` (or in the Studio's props panel).

**Captions:** `public/captions.json` is an array of
`{ text, startMs, endMs, timestampMs, confidence }`. Start every word except the first
with a space. To generate captions automatically from a voiceover, use
[`@remotion/install-whisper-cpp`](https://www.remotion.dev/docs/install-whisper-cpp)
and `toCaptions()`, or [`@remotion/openai-whisper`](https://www.remotion.dev/docs/openai-whisper).

## Licensing note

Remotion is free for individuals and small companies. Larger companies need a
[company license](https://www.remotion.dev/license).
