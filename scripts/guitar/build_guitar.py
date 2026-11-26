#!/usr/bin/env python3
"""
Build the four "days" for the Short "I learned guitar from zero".

Song: "In the Hall of the Mountain King" (Edvard Grieg, 1875) - public domain.
The arrangement is our own and the audio is synthesised here from the notes
(FluidSynth + FluidR3 GM), so no copyrighted recordings are used.

For each day this writes:
  public/guitar/<id>.mp3          audio (guitar + bass + drums)
  src/guitar/<id>.notes.json      note events WITH string/fret for the animation

Every melody note gets a real, playable string+fret (a small Viterbi solver
picks the fingering), so the animated fingers show exactly what is heard.

Requires: mido, fluidsynth, fluid-soundfont-gm, ffmpeg
Run:      python3 scripts/guitar/build_guitar.py
"""
import json, random, subprocess
from pathlib import Path
import mido

ROOT = Path(__file__).resolve().parents[2]
SF2 = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
OPEN = {1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40}  # string -> open pitch (standard tuning)
MAXF = 20
rng = random.Random(11)

NAMES = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
def midi(n):  # "F#3" -> 54
    pc = NAMES[n[0]]
    i = 1
    while n[i] in "#b":
        pc += 1 if n[i] == "#" else -1
        i += 1
    return 12 * (int(n[i:]) + 1) + pc

# GM programs
CLEAN, OVERDRIVE, DIST, MUTED, FRETNOISE, BASS = 27, 29, 30, 28, 120, 33

# ---------------------------------------------------------------------------
# Melody (E minor). Tokens are NOTE:eighths.
# ---------------------------------------------------------------------------
A1 = "E3 F#3 G3 A3 B3 G3 B3:2"
A2 = "A#3 F#3 A#3:2 A3 F3 A3:2"
A3 = "E3 F#3 G3 A3 B3 G3 B3 E4"
A4 = "D4 B3 G3 B3 D4:4"
A4_END = "D4 B3 G3 B3 E4:4"
B1 = "B3 C#4 D#4 E4 F#4 D#4 F#4:2"
B2 = "G4 D#4 G4:2 F#4 D#4 F#4:2"
B3 = "B3 C#4 D#4 E4 F#4 D#4 F#4 B4"
B4 = "A4 F#4 D#4 F#4 A4:4"
PHRASE_A = [A1, A2, A3, A4]
PHRASE_A_END = [A1, A2, A3, A4_END]
PHRASE_B = [B1, B2, B3, B4]
# bass root per bar
ROOTS_A = ["E2", "B1", "E2", "G2"]
ROOTS_A_END = ["E2", "B1", "E2", "E2"]
ROOTS_B = ["B1", "B1", "B1", "D2"]

def parse(bars, shift=0):
    """-> list of (beat, beats, midi) with beat in quarter notes."""
    out, b = [], 0.0
    for bar in bars:
        for tok in bar.split():
            n, _, l = tok.partition(":")
            l = float(l or 1) / 2
            out.append((b, l, midi(n) + shift))
            b += l
    return out, b

# ---------------------------------------------------------------------------
# Fingering: Viterbi over (string, fret) candidates
# ---------------------------------------------------------------------------
def candidates(m):
    return [(s, m - OPEN[s]) for s in OPEN if 0 <= m - OPEN[s] <= MAXF]

def solve_fingering(pitches, lo, hi, allow_open=True):
    """Pick a string/fret per note, keeping the hand near frets lo..hi and moving little."""
    def node_cost(sf):
        s, f = sf
        if f == 0:
            return 0.0 if allow_open else 3.0
        return 0.6 * max(0, lo - f, f - hi)

    def hand(sf, prev_hand):
        return prev_hand if sf[1] == 0 else sf[1]

    layers = [candidates(m) for m in pitches]
    # state: (cost, hand, path)
    best = {c: (node_cost(c), hand(c, (lo + hi) / 2), [c]) for c in layers[0]}
    for layer in layers[1:]:
        nb = {}
        for c in layer:
            opts = []
            for p, (cost, h, path) in best.items():
                nh = hand(c, h)
                span = abs(nh - h)
                move = span * (0.35 if span <= 3 else 1.0)  # small stretches are cheap
                cost2 = cost + move + 0.15 * abs(c[0] - p[0]) + node_cost(c)
                opts.append((cost2, nh, path + [c]))
            nb[c] = min(opts, key=lambda o: o[0])
        best = nb
    return min(best.values(), key=lambda o: o[0])[2]

# ---------------------------------------------------------------------------
# Tempo map helpers
# ---------------------------------------------------------------------------
def const_tempo(bpm, offset=0.0):
    return lambda b: offset + b * 60.0 / bpm

def accel_tempo(bpm0, bpm1, total_beats, offset=0.0, steps=4000):
    """Linear accelerando: tempo goes bpm0 -> bpm1 over total_beats."""
    table = [0.0]
    db = total_beats / steps
    for i in range(steps):
        bpm = bpm0 + (bpm1 - bpm0) * (i + 0.5) / steps
        table.append(table[-1] + db * 60.0 / bpm)
    def f(b):
        if b >= total_beats:
            return offset + table[-1] + (b - total_beats) * 60.0 / bpm1
        x = b / db
        i = int(x)
        return offset + table[i] + (table[min(i + 1, steps)] - table[i]) * (x - i)
    return f

# ---------------------------------------------------------------------------
# Event model
#   guitar note: dict(t, d, m, v, s, f, prog, miss?, tech?)
#   other:       dict(t, d, m, v, ch, prog)  (bass/drums, not shown on fretboard)
# ---------------------------------------------------------------------------
def melody_events(bars, tmap, prog, lo, hi, shift=0, allow_open=True, vel=(84, 100), legato=0.92):
    notes, beats = parse(bars, shift)
    fing = solve_fingering([m for _, _, m in notes], lo, hi, allow_open)
    ev = []
    for (b, l, m), (s, f) in zip(notes, fing):
        t0, t1 = tmap(b), tmap(b + l)
        ev.append(dict(t=t0, d=(t1 - t0) * legato, m=m, v=rng.randint(*vel), s=s, f=f, prog=prog))
    return ev, beats

def bass_events(roots, start_beat, tmap, vel=92):
    ev = []
    for i, r in enumerate(roots):
        for k in range(8):  # driving eighths
            b = start_beat + i * 4 + k * 0.5
            t0, t1 = tmap(b), tmap(b + 0.5)
            ev.append(dict(t=t0, d=(t1 - t0) * 0.85, m=midi(r), v=vel - (0 if k % 2 == 0 else 10), ch=1, prog=BASS))
    return ev

KICK, SNARE, HAT, OPENHAT, CRASH, RIDE, TOM_H, TOM_L, STICK = 36, 38, 42, 46, 49, 51, 48, 45, 37
def drum(t, n, v):
    return dict(t=t, d=0.1, m=n, v=v, ch=9, prog=0)

def rock_beat(n_bars, start_beat, tmap, double=False, crash_every=4):
    ev = []
    for bar in range(n_bars):
        base = start_beat + bar * 4
        if bar % crash_every == 0:
            ev.append(drum(tmap(base), CRASH, 110))
        for k in range(8):
            b = base + k * 0.5
            ev.append(drum(tmap(b), HAT, 70 + (12 if k % 2 == 0 else 0)))
            if double:
                ev.append(drum(tmap(b), KICK, 96 if k % 2 == 0 else 80))
            elif k in (0, 3, 4):
                ev.append(drum(tmap(b), KICK, 100))
            if k in (2, 6):
                ev.append(drum(tmap(b), SNARE, 108))
    return ev

def fill(start_beat, tmap, beats=1.0, n=8):
    ev = []
    for i in range(n):
        b = start_beat + i * beats / n
        ev.append(drum(tmap(b), [SNARE, SNARE, TOM_H, TOM_H, TOM_L, TOM_L, SNARE, SNARE][i % 8], 90 + i * 3))
    return ev

def metronome(n_beats, tmap):
    return [drum(tmap(b), 76 if b % 4 == 0 else 77, 85 if b % 4 == 0 else 65) for b in range(n_beats)]

# ---------------------------------------------------------------------------
# Day 1: never touched a guitar
# ---------------------------------------------------------------------------
def day1():
    g = []
    def gn(t, d, s, f, prog=CLEAN, v=70, miss=False, tech=None):
        g.append(dict(t=t, d=d, m=OPEN[s] + f, v=v, s=s, f=f, prog=prog, miss=miss, tech=tech))
    gn(0.50, 1.10, 6, 0, v=62)                                  # first open string... ok
    gn(1.55, 0.45, 5, 3, prog=FRETNOISE, v=110, miss=True, tech="buzz")  # buzz!
    gn(1.60, 0.30, 5, 3, prog=MUTED, v=70, miss=True)
    for s, f in [(6, 1), (5, 4), (4, 3), (3, 1), (2, 4)]:      # "chord" attempt: dissonant clang
        gn(2.35 + (6 - s) * 0.025, 0.9, s, f, prog=MUTED, v=95, miss=True)
    gn(3.45, 0.42, 5, 7, v=70)                                  # E3 - correct!
    gn(4.00, 0.40, 5, 8, v=70, miss=True)                       # F3 instead of F#3
    gn(4.55, 0.60, 5, 9, prog=FRETNOISE, v=120, miss=True, tech="buzz")
    return g, 5.6, []

# ---------------------------------------------------------------------------
# Day 7: slow, clean, metronome, one mistake
# ---------------------------------------------------------------------------
def day7():
    bpm, lead = 96, 2 * 60 / 96  # two count-in clicks
    tmap = const_tempo(bpm, lead)
    g, beats = melody_events(PHRASE_A, tmap, CLEAN, 0, 5, allow_open=True, vel=(70, 82))
    # the learner slips on bar 2: plays A instead of A# (one fret too low)
    for n in g:
        if n["m"] == midi("A#3"):
            n["m"] -= 1
            n["f"] -= 1
            n["miss"] = True
            break
    other = metronome(int(beats) + 2, const_tempo(bpm, 0))
    end = tmap(beats) + 0.6
    return g, end, other

# ---------------------------------------------------------------------------
# Day 30: tempo up, overdrive, drums + bass
# ---------------------------------------------------------------------------
def day30():
    bpm = 150
    lead = 2 * 60 / bpm  # two sticks clicks
    tmap = const_tempo(bpm, lead)
    a, ba = melody_events(PHRASE_A, tmap, OVERDRIVE, 5, 9, allow_open=False)
    b_tmap = lambda b: tmap(b + ba)
    b, bb = melody_events(PHRASE_B, b_tmap, OVERDRIVE, 5, 9, allow_open=False)
    g = a + b
    other = [drum(0, STICK, 90), drum(60 / bpm, STICK, 90)]
    other += rock_beat(8, 0, tmap)
    other += fill(ba + bb - 1, tmap)
    other += bass_events(ROOTS_A + ROOTS_B, 0, tmap, vel=84)
    end = tmap(ba + bb) + 0.2
    other.append(drum(end - 0.2, CRASH, 110))
    other.append(dict(t=end - 0.2, d=1.0, m=midi("B1"), v=90, ch=1, prog=BASS))
    g.append(dict(t=end - 0.2, d=1.0, m=midi("B3"), v=96, s=4, f=9, prog=OVERDRIVE, tech="vib"))
    return g, end + 1.2, other

# ---------------------------------------------------------------------------
# Day 100: full speed, an octave up, accelerando, shred finale + dive bomb
# ---------------------------------------------------------------------------
PENTA_DOWN = [(1, 15), (1, 12), (2, 15), (2, 12), (3, 14), (3, 12), (4, 14), (4, 12), (5, 14), (5, 12), (6, 15), (6, 12)]

def day100():
    bars = PHRASE_A + PHRASE_B + PHRASE_A_END
    roots = ROOTS_A + ROOTS_B + ROOTS_A_END
    total = len(bars) * 4
    lead = 0.35
    tmap = accel_tempo(176, 252, total, lead)
    g, beats = melody_events(bars, tmap, DIST, 12, 17, shift=12, allow_open=False, vel=(92, 112), legato=0.96)
    other = rock_beat(len(bars), 0, tmap, double=True)
    other += bass_events(roots, 0, tmap, vel=96)
    for bar in (3, 7):
        other += fill(bar * 4 + 3, tmap)
    # finale: sextuplet pentatonic runs at the final tempo (down, up, down)
    fin_bpm = 252
    t = tmap(beats)
    step = 60 / fin_bpm / 6
    run = PENTA_DOWN + PENTA_DOWN[::-1] + PENTA_DOWN
    for i, (s, f) in enumerate(run):
        g.append(dict(t=t + i * step, d=step * 0.95, m=OPEN[s] + f, v=100 + (12 if i % 6 == 0 else 0), s=s, f=f, prog=DIST))
        if i % 6 == 0:
            other.append(drum(t + i * step, KICK, 110))
            other.append(drum(t + i * step, CRASH if i % 12 == 0 else TOM_L, 105))
        else:
            other.append(drum(t + i * step, SNARE if i % 2 == 0 else TOM_H, 80 + i % 20))
    t_end = t + len(run) * step
    # final E5 power chord with a whammy dive bomb
    for s, f in [(6, 0), (5, 2), (4, 2)]:
        g.append(dict(t=t_end, d=2.6, m=OPEN[s] + f, v=120, s=s, f=f, prog=DIST, tech="dive"))
    other.append(drum(t_end, CRASH, 127))
    other.append(drum(t_end, KICK, 127))
    other.append(drum(t_end + 0.02, 57, 120))  # crash 2
    other.append(dict(t=t_end, d=2.4, m=midi("E1"), v=110, ch=1, prog=BASS))
    meta = {"diveStart": round(t_end + 0.55, 3), "diveEnd": round(t_end + 2.2, 3)}
    return g, t_end + 3.4, other, meta

# ---------------------------------------------------------------------------
def render(sid, guitar, duration, other, meta=None, reverb=True):
    tpb, tempo = 960, 500000
    ticks = lambda sec: int(round(sec / 0.5 * tpb))
    progs = sorted({n["prog"] for n in guitar})
    ch_for = {p: i for p, i in zip(progs, [0, 2, 3, 4, 5, 6])}
    msgs = []  # (tick, order, msg)
    for p, ch in ch_for.items():
        msgs.append((0, 0, mido.Message("program_change", channel=ch, program=p)))
        # pitch-bend range: 12 semitones (for the dive bomb)
        for c, v in [(101, 0), (100, 0), (6, 12), (38, 0)]:
            msgs.append((0, 0, mido.Message("control_change", channel=ch, control=c, value=v)))
    msgs.append((0, 0, mido.Message("program_change", channel=1, program=BASS)))
    for n in guitar:
        ch = ch_for[n["prog"]]
        msgs.append((ticks(n["t"]), 2, mido.Message("note_on", channel=ch, note=n["m"], velocity=n["v"])))
        msgs.append((ticks(n["t"] + n["d"]), 1, mido.Message("note_off", channel=ch, note=n["m"], velocity=0)))
    for n in other:
        msgs.append((ticks(n["t"]), 2, mido.Message("note_on", channel=n["ch"], note=n["m"], velocity=n["v"])))
        msgs.append((ticks(n["t"] + n["d"]), 1, mido.Message("note_off", channel=n["ch"], note=n["m"], velocity=0)))
    # vibrato / dive via pitch wheel on the lead channel
    lead_ch = 0
    for n in guitar:
        if n.get("tech") == "vib":
            k = 0
            while k * 0.02 < n["d"]:
                import math
                val = int(1400 * math.sin(k * 0.02 * 2 * math.pi * 6) * min(1, k * 0.02 / 0.25))
                msgs.append((ticks(n["t"] + k * 0.02), 3, mido.Message("pitchwheel", channel=ch_for[n["prog"]], pitch=val)))
                k += 1
            msgs.append((ticks(n["t"] + n["d"]), 3, mido.Message("pitchwheel", channel=ch_for[n["prog"]], pitch=0)))
    if meta and "diveStart" in meta:
        ch = ch_for[DIST]
        t0, t1 = meta["diveStart"], meta["diveEnd"]
        k = 0
        while t0 + k * 0.02 <= t1:
            x = (k * 0.02) / (t1 - t0)
            val = int(-8191 * (x ** 1.6))
            msgs.append((ticks(t0 + k * 0.02), 3, mido.Message("pitchwheel", channel=ch, pitch=max(-8191, val))))
            k += 1
    msgs.sort(key=lambda e: (e[0], e[1]))
    mf = mido.MidiFile(ticks_per_beat=tpb)
    tr = mido.MidiTrack()
    mf.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=tempo))
    last = 0
    for tick, _, m in msgs:
        tr.append(m.copy(time=tick - last))
        last = tick
    out_dir = ROOT / "public/guitar"
    out_dir.mkdir(parents=True, exist_ok=True)
    mid, wav, mp3 = out_dir / f"{sid}.mid", out_dir / f"{sid}.wav", out_dir / f"{sid}.mp3"
    mf.save(mid)
    subprocess.run(["fluidsynth", "-ni", "-g", "0.8", "-r", "44100", "-F", str(wav), SF2, str(mid)], check=True, capture_output=True)
    af = f"afade=t=out:st={duration - 0.8:.2f}:d=0.8,loudnorm=I=-15:TP=-1.5"
    if reverb:
        af = "aecho=0.8:0.6:45|90:0.22|0.12," + af
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(wav), "-t", f"{duration:.2f}", "-af", af, "-b:a", "192k", str(mp3)], check=True)
    wav.unlink()
    mid.unlink()

    guitar.sort(key=lambda n: (n["t"], -n["s"]))
    beats = sorted({round(n["t"], 3) for n in other if n.get("ch") == 9 and n["m"] in (KICK, SNARE, 76, 77, STICK)})
    data = {
        "duration": round(duration, 3),
        "notes": [
            {k: (round(v, 4) if isinstance(v, float) else v) for k, v in n.items() if k != "prog" and v is not None and v is not False}
            for n in guitar
        ],
        "beats": beats,
        **(meta or {}),
    }
    js = ROOT / f"src/guitar/{sid}.notes.json"
    js.parent.mkdir(parents=True, exist_ok=True)
    js.write_text(json.dumps(data))
    frets = [n["f"] for n in guitar]
    print(f"✔ {sid}: {len(guitar)} guitar notes, {duration:.1f}s, frets {min(frets)}-{max(frets)}")

if __name__ == "__main__":
    render("day1", *day1(), reverb=False)
    render("day7", *day7())
    render("day30", *day30())
    g, d, o, meta = day100()
    render("day100", g, d, o, meta)
