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
  audio/music.mp3       placeholder music bed (replace with your voiceover/music)
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

**Voiceover / music:** put the file in `public/audio/`, then set `audioFile` in `Root.tsx`
(or change it in the Studio's props panel). Set the composition's `durationInFrames` to match the audio length.

**Captions:** `public/captions.json` is an array of
`{ text, startMs, endMs, timestampMs, confidence }`. Start every word except the first
with a space. To generate captions automatically from a voiceover, use
[`@remotion/install-whisper-cpp`](https://www.remotion.dev/docs/install-whisper-cpp)
and `toCaptions()`, or [`@remotion/openai-whisper`](https://www.remotion.dev/docs/openai-whisper).

## Licensing note

Remotion is free for individuals and small companies. Larger companies need a
[company license](https://www.remotion.dev/license).
