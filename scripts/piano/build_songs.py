#!/usr/bin/env python3
"""
Build the three songs for "3 Levels of Piano".

For each song this writes:
  public/piano/<id>.mid / .mp3     audio (rendered with FluidSynth + FluidR3 GM piano)
  src/piano/<id>.notes.json         note events for the animation

All pieces are public-domain compositions; the audio is rendered here, so no
recordings are used.

Requires: music21, mido, fluidsynth, fluid-soundfont-gm, ffmpeg
Run:      python3 scripts/piano/build_songs.py
"""
import json, random, subprocess
from pathlib import Path
import mido
from music21 import corpus, pitch

ROOT = Path(__file__).resolve().parents[2]
SF2 = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
rng = random.Random(7)

def midi(name):  # "C#4" -> 61
    return pitch.Pitch(name).midi

# ---------------------------------------------------------------------------
# Level 1: Ode to Joy (Beethoven), simplified, C major, quarter = 100
# ---------------------------------------------------------------------------
def ode_to_joy():
    q = 60 / 100
    # (note, beats)
    A1 = "E4 1 E4 1 F4 1 G4 1 | G4 1 F4 1 E4 1 D4 1 | C4 1 C4 1 D4 1 E4 1 | E4 1.5 D4 .5 D4 2"
    A2 = "E4 1 E4 1 F4 1 G4 1 | G4 1 F4 1 E4 1 D4 1 | C4 1 C4 1 D4 1 E4 1 | D4 1.5 C4 .5 C4 2"
    B = "D4 1 D4 1 E4 1 C4 1 | D4 1 E4 .5 F4 .5 E4 1 C4 1 | D4 1 E4 .5 F4 .5 E4 1 D4 1 | C4 1 D4 1 G3 2"
    rh = " | ".join([A1, A2, B, A2])
    # left hand: two half notes per bar
    lh_bars = ["C3 G3", "G2 D3", "C3 G3", "G2 D3",
               "C3 G3", "G2 D3", "C3 G3", "G2 C3",
               "G2 D3", "G2 C3", "G2 D3", "C3 G2",
               "C3 G3", "G2 D3", "C3 G3", "G2 C3"]
    notes = []
    t = 0.0
    for tok_bar in rh.split("|"):
        toks = tok_bar.split()
        for n, b in zip(toks[::2], toks[1::2]):
            d = float(b) * q
            notes.append((t, d * 0.95, midi(n), 78, "R"))
            t += d
    for i, bar in enumerate(lh_bars):
        for j, n in enumerate(bar.split()):
            notes.append((i * 4 * q + j * 2 * q, 2 * q * 0.98, midi(n), 60, "L"))
    end = 16 * 4 * q
    # final chord
    for n in ["C3", "G3", "C4", "E4"]:
        notes.append((end, 2.5, midi(n), 70, "L" if n < "D" and n.endswith("3") else "R"))
    return notes, end + 3.0

# ---------------------------------------------------------------------------
# Level 2: Fur Elise (Beethoven), main theme + middle episode, 3/8
# Written in sixteenths; "r" = rest. LH notes ring like a pedal.
# ---------------------------------------------------------------------------
def fur_elise():
    s16 = 0.21
    seq = []  # list of bars: (rh tokens, lh tokens) each token "NOTE:len" in 16ths

    def bar(rh, lh=""):
        seq.append((rh.split(), lh.split()))

    theme = lambda: bar("E5:1 D#5:1 E5:1 B4:1 D5:1 C5:1")
    a_m = lambda: bar("A4:2 r:1 C4:1 E4:1 A4:1", "A2:1 E3:1 A3:1 r:3")
    e_m1 = lambda: bar("B4:2 r:1 E4:1 G#4:1 B4:1", "E2:1 E3:1 G#3:1 r:3")
    c_m = lambda: bar("C5:2 r:1 E4:1 E5:1 D#5:1", "A2:1 E3:1 A3:1 r:3")
    e_m2 = lambda: bar("B4:2 r:1 E4:1 C5:1 B4:1", "E2:1 E3:1 G#3:1 r:3")

    def a_section(ending):
        theme(); a_m(); e_m1(); c_m(); theme(); a_m(); e_m2()
        if ending == 1:
            bar("A4:2 r:1 r:1 E5:1 D#5:1", "A2:1 E3:1 A3:1 r:3")
        elif ending == 2:
            bar("A4:2 r:1 B4:1 C5:1 D5:1", "A2:1 E3:1 A3:1 r:3")
        else:
            bar("A4:6", "A2:1 E3:1 A3:3 r:1")

    def b_section():
        bar("E5:3 G4:1 F5:1 E5:1", "C3:1 G3:1 C4:1 r:3")
        bar("D5:3 F4:1 E5:1 D5:1", "G2:1 G3:1 B3:1 r:3")
        bar("C5:3 E4:1 D5:1 C5:1", "A2:1 E3:1 A3:1 r:3")
        bar("B4:2 r:1 E4:1 E5:1 r:1", "E2:1 E3:1 E4:1 r:3")
        bar("r:1 E5:1 E6:1 r:2 D#5:1")
        bar("E5:1 r:2 D#5:1 E5:1 D#5:1")

    pickup = [("E5", 1), ("D#5", 1)]
    a_section(1)
    a_section(2)
    b_section()
    a_section(2)
    b_section()
    a_section(3)

    notes = []
    t = 0.0
    for n, l in pickup:
        notes.append((t, l * s16, midi(n), 70, "R"))
        t += l * s16
    total_bars = len(seq)
    for bi, (rh, lh) in enumerate(seq):
        # gentle ritardando over the last 3 bars
        slow = 1 + max(0, bi - (total_bars - 4)) * 0.18
        u = s16 * slow
        bar_start = t
        x = bar_start
        for tok in rh:
            n, l = tok.split(":")
            l = int(l)
            if n != "r":
                notes.append((x, l * u * 0.95, midi(n), 66 + rng.randint(-6, 6), "R"))
            x += l * u
        x = bar_start
        for tok in lh:
            n, l = tok.split(":")
            l = int(l)
            if n != "r":
                ring = bar_start + 6 * u - x  # sustain to the end of the bar (pedal)
                notes.append((x, ring, midi(n), 50 + rng.randint(-4, 4), "L"))
            x += l * u
        t = bar_start + 6 * u
    return notes, t + 2.5

# ---------------------------------------------------------------------------
# Level 3: Maple Leaf Rag (Scott Joplin), from the music21 corpus, with repeats
# ---------------------------------------------------------------------------
def maple_leaf():
    bpm = 100
    s = corpus.parse("joplin/maple_leaf_rag.mxl").expandRepeats()
    sec = 60 / bpm
    notes = []
    for pi, part in enumerate(s.parts):
        hand = "R" if pi == 0 else "L"
        for n in part.flatten().notes:
            if n.duration.isGrace:
                continue
            t = float(n.getOffsetInHierarchy(s)) * sec
            d = max(0.06, float(n.quarterLength) * sec * 0.92)
            base = 80 if hand == "R" else 66
            for p in n.pitches:
                notes.append((t, d, p.midi, base + rng.randint(-6, 6), hand))
    end = float(s.highestTime) * sec
    return notes, end + 2.5

# ---------------------------------------------------------------------------
def write_song(sid, notes, duration):
    notes.sort(key=lambda x: (x[0], x[2]))
    # MIDI
    tpb = 960
    tempo = 500000  # 120 bpm -> 1 beat = 0.5 s
    to_ticks = lambda sec: int(round(sec / 0.5 * tpb))
    events = []
    for t, d, m, v, h in notes:
        events.append((to_ticks(t), 1, m, v))
        events.append((to_ticks(t + d), 0, m, 0))
    events.sort(key=lambda e: (e[0], e[1]))
    mf = mido.MidiFile(ticks_per_beat=tpb)
    tr = mido.MidiTrack()
    mf.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=tempo))
    tr.append(mido.Message("program_change", program=0, time=0))
    last = 0
    for tick, on, m, v in events:
        tr.append(mido.Message("note_on" if on else "note_off", note=m, velocity=v, time=tick - last))
        last = tick
    mid = ROOT / f"public/piano/{sid}.mid"
    mf.save(mid)
    # Audio
    wav = ROOT / f"public/piano/{sid}.wav"
    mp3 = ROOT / f"public/piano/{sid}.mp3"
    subprocess.run(["fluidsynth", "-ni", "-g", "0.9", "-r", "44100", "-F", str(wav), SF2, str(mid)],
                   check=True, capture_output=True)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(wav), "-t", f"{duration:.2f}",
                    "-af", f"afade=t=out:st={duration-1.2:.2f}:d=1.2,loudnorm=I=-16:TP=-1.5",
                    "-b:a", "192k", str(mp3)], check=True)
    wav.unlink()
    out = {
        "duration": round(duration, 3),
        "notes": [{"t": round(t, 4), "d": round(d, 4), "m": m, "v": v, "h": h} for t, d, m, v, h in notes],
    }
    (ROOT / f"src/piano/{sid}.notes.json").write_text(json.dumps(out))
    lo = min(n[2] for n in notes); hi = max(n[2] for n in notes)
    print(f"✔ {sid}: {len(notes)} notes, {duration:.1f}s, range {lo}-{hi}")

if __name__ == "__main__":
    write_song("level1-ode-to-joy", *ode_to_joy())
    write_song("level2-fur-elise", *fur_elise())
    write_song("level3-maple-leaf-rag", *maple_leaf())
