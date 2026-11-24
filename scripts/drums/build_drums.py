#!/usr/bin/env python3
"""
Build the three drum performances for "3 Levels of Drums".

Patterns are written as drum tabs (one string per instrument per bar).
The string length sets the grid: 16 = 16th notes, 24 = 16th-note triplets, 32 = 32nds.
  O = accent, o = normal, g = ghost note, - = rest   (any of x/X work too)

Outputs per level:
  public/drums/<id>.mp3          audio (FluidSynth, FluidR3 GM drum kit)
  src/drums/<id>.hits.json       hits with instrument, time, velocity and which hand/foot plays it
"""
import json, random, subprocess
from pathlib import Path
import mido

ROOT = Path(__file__).resolve().parents[2]
SF2 = "/usr/share/sounds/sf2/FluidR3_GM.sf2"

# instrument -> General MIDI drum note
GM = {
    "kick": 36, "snare": 38, "side": 37, "hhc": 42, "hhp": 44, "hho": 46,
    "tom1": 48, "tom2": 45, "floor": 41, "crash": 49, "crash2": 57, "ride": 51, "bell": 53, "china": 52,
}
CYMBALS = {"hhc", "hho", "hhp", "crash", "crash2", "ride", "bell", "china"}
FEET = {"kick", "hhp"}

def bar(**lanes):
    return lanes

def build(bars, bpm, seed, count_in=True):
    rng = random.Random(seed)
    beat = 60 / bpm
    hits = []
    t0 = 0.0
    if count_in:
        for i in range(4):
            hits.append({"t": i * beat, "i": "side", "v": 70 if i else 90})
        t0 = 4 * beat
    t = t0
    for b in bars:
        bar_len = 4 * beat
        for inst, tab in b.items():
            n = len(tab)
            if n == 0:
                continue
            step = bar_len / n
            for k, ch in enumerate(tab):
                if ch in "-.":
                    continue
                v = {"O": 118, "X": 118, "o": 96, "x": 96, "g": 38}[ch]
                v = max(1, min(127, v + rng.randint(-7, 7)))
                jitter = rng.uniform(-0.004, 0.004) if ch != "O" else 0
                hits.append({"t": t + k * step + jitter, "i": inst, "v": v})
        t += bar_len
    hits.sort(key=lambda h: (h["t"], h["i"]))
    return hits, t

def assign_limbs(hits):
    """Decide which hand/foot plays each hit (used for the stick animation)."""
    last = {"R": -9.0, "L": -9.0}
    i = 0
    while i < len(hits):
        group = [h for h in hits[i:] if abs(h["t"] - hits[i]["t"]) < 0.006]
        hands = []
        for h in group:
            if h["i"] == "kick":
                h["limb"] = "RF"
            elif h["i"] == "hhp":
                h["limb"] = "LF"
            else:
                hands.append(h)
        if len(hands) == 1:
            h = hands[0]
            pref = "R" if h["i"] in CYMBALS else ("L" if h["i"] in ("snare", "side") else None)
            if pref is None:  # toms: alternate
                pref = "L" if last["R"] > last["L"] else "R"
            other = "L" if pref == "R" else "R"
            # too fast for the same hand again -> use the other one
            if h["t"] - last[pref] < 0.11 and h["t"] - last[other] >= h["t"] - last[pref]:
                pref = other
            h["limb"] = pref
            last[pref] = h["t"]
        elif len(hands) >= 2:
            hands.sort(key=lambda h: (h["i"] not in CYMBALS, h["i"]))
            hands[0]["limb"] = "R"
            hands[1]["limb"] = "L"
            last["R"] = last["L"] = hands[0]["t"]
            for extra in hands[2:]:
                hits.remove(extra)  # only two hands
        i += len([h for h in group if h in hits])
    return hits

def double_kick(hits):
    """In the hard level consecutive fast kicks alternate feet (double pedal)."""
    last_t, foot = -9, "LF"
    for h in hits:
        if h["i"] == "kick":
            foot = "LF" if (h["t"] - last_t < 0.2 and foot == "RF") else "RF"
            h["limb"] = foot
            last_t = h["t"]
    return hits

# ---------------------------------------------------------------------------
# LEVEL 1 - EASY: basic rock beat, 90 bpm
# ---------------------------------------------------------------------------
def level1():
    HH = "o-o-o-o-o-o-o-o-"
    SN = "----O-------O---"
    groove = bar(hhc=HH, snare=SN, kick="O-------O-------")
    groove_b = bar(hhc=HH, snare=SN, kick="O-------O-O-----")
    first = bar(crash="O---------------", hhc="--o-o-o-o-o-o-o-", snare=SN, kick="O-------O-------")
    fill = bar(hhc="o-o-o-o-o-o-----", snare="----O-------O-O-", kick="O-------O-------")
    fill2 = bar(hhc="o-o-o-o-o-------", snare="----O-------oooo", kick="O-------O-------")
    tomfill = bar(hhc="o-o-o-o---------", snare="----O-----------", tom1="--------O-o-----", floor="------------O-o-", kick="O-------O-------")
    ride = bar(ride="o-o-o-o-o-o-o-o-", snare=SN, kick="O-------O-O-----")
    ride_first = bar(crash="O---------------", ride="--o-o-o-o-o-o-o-", snare=SN, kick="O-------O-O-----")
    end = bar(crash="O---------------", kick="O---------------")
    bars = [first, groove, groove_b, fill,
            first, groove, groove_b, fill2,
            ride_first, ride, ride, fill,
            ride_first, ride, ride, tomfill,
            first, groove, groove_b, fill2,
            end]
    hits, t = build(bars, 90, 1)
    return assign_limbs(hits), t + 2.5, 90

# ---------------------------------------------------------------------------
# LEVEL 2 - MEDIUM: funk groove with ghost notes, open hats and tom fills, 98 bpm
# ---------------------------------------------------------------------------
def level2():
    HH16 = "oooooooooooooooo"
    A = bar(hhc="ooooooooooooo-oo", hho="-------------o--", snare="----O--g-g--O--g", kick="O-O-----O-O--O--")
    B = bar(hhc="ooooooooooooo-oo", hho="-------------o--", snare="-g--O--g-g--O---", kick="O--O--O---O-----")
    first = bar(crash="O---------------", hhc="-oooooooooooo-oo", hho="-------------o--", snare="----O--g-g--O--g", kick="O-O-----O-O--O--")
    fill1 = bar(hhc="oooooooo--------", snare="----O--gOOoo----", tom1="------------oo--", floor="--------------oo", kick="O-O-----O-------")
    fill2 = bar(snare="OoooOooo--------", tom1="--------oooo----", tom2="------------oo--", floor="--------------oo", kick="O-------O-------")
    rideA = bar(ride="o-o-o-o-o-o-o-o-", bell="--o-------o-----", snare="-g--O--g-g--O--g", kick="O-O---O---O--O--", hhp="----o-------o---")
    ride_first = bar(crash="O---------------", ride="--o-o-o-o-o-o-o-", bell="--o-------o-----", snare="-g--O--g-g--O--g", kick="O-O---O---O--O--", hhp="----o-------o---")
    trip_fill = bar(snare="OooOoo------------------", tom1="------OooOoo------------", tom2="------------OooOoo------", floor="------------------OooOoo",
                    kick="O-----O-----O-----O-----")
    end = bar(crash="O---------------", china="O---------------", kick="O---------------")
    bars = [first, A, B, fill1,
            first, A, B, fill2,
            ride_first, rideA, rideA, fill1,
            ride_first, rideA, rideA, trip_fill,
            first, A, B, A,
            first, A, B, fill2,
            first, B, A, trip_fill,
            end]
    hits, t = build(bars, 98, 2)
    return assign_limbs(hits), t + 2.5, 98

# ---------------------------------------------------------------------------
# LEVEL 3 - HARD: metal, double kick, blast beats, drum solo, 168 bpm
# ---------------------------------------------------------------------------
def level3():
    DK = "OOOOOOOOOOOOOOOO"
    metalA = bar(crash="O---o---o---o---", snare="----O-------O---", kick=DK)
    metalB = bar(china="O---o---o---o---", snare="----O-------O---", kick=DK)
    metal_first = bar(crash="O---o---o---o---", crash2="O---------------", snare="----O-------O---", kick=DK)
    blast = bar(ride="o-o-o-o-o-o-o-o-", snare="-O-O-O-O-O-O-O-O", kick="O-O-O-O-O-O-O-O-")
    blast_first = bar(crash="O---------------", ride="--o-o-o-o-o-o-o-", snare="-O-O-O-O-O-O-O-O", kick="O-O-O-O-O-O-O-O-")
    gallop = bar(crash="O-----------------------", hhc="------o-----o-----o-----", snare="------O-----------O-----", kick="O-OO-OO-OO-OO-OO-OO-OO-O")
    gallop2 = bar(hhc="o-----o-----o-----o-----", snare="------O-----------O-----", kick="O-OO-OO-OO-OO-OO-OO-OO-O")
    fillA = bar(snare="OoooOooo--------", tom1="--------OoOo----", tom2="------------OoOo", kick="O-------O-------")
    fillB = bar(snare="OooOoo------------------", tom1="------OooOoo------------", tom2="------------OooOoo------", floor="------------------OooOoo", kick="O--O--O--O--O--O--O--O--")
    fillC = bar(snare="OoOoOoOo------------------------", tom1="--------OoOoOoOo----------------", tom2="----------------OoOoOoOo--------", floor="------------------------OoOoOoOo",
                kick="O-------O-------O-------O-------")
    # solo: linear patterns (hands and feet never at the same time)
    solo1 = bar(snare="O--o--O--o--O--o--O--o--", kick="-O--O--O--O--O--O--O--O-", tom1="--o-----o-----o-----o---", floor="-----o-----o-----o-----o")
    solo2 = bar(tom1="Oo----Oo----Oo----Oo----", tom2="--Oo----Oo----Oo----Oo--", floor="----Oo----Oo----Oo----Oo")
    solo3 = bar(snare="OgOg-OgOg-OgOg-O", kick="----O----O----O-", crash="---------------O")
    solo4 = bar(snare="OooooooooooooooooooooooooooooooO", kick="O-------O-------O-------O-------")
    solo_crash = bar(crash="O---------------", crash2="O---------------", china="--------O-------", kick="OOOOOOOOOOOOOOOO", snare="----O-------O---")
    end_roll = bar(snare="OoooooooooooooooOoooooooooooooOO", kick="O-------O-------O-------O-------")
    end = bar(crash="O---------------", crash2="O---------------", china="O---------------", kick="O---------------")
    bars = (
        [metal_first, metalA, metalA, fillA, metal_first, metalB, metalA, fillB]
        + [blast_first, blast, blast, fillA, blast_first, blast, blast, fillC]
        + [gallop, gallop2, gallop2, fillA, gallop, gallop2, gallop2, fillB]
        + [metal_first, metalB, metalA, fillA, blast_first, blast, blast, fillC]
        + [solo1, solo1, solo2, solo3, solo1, solo2, solo3, solo4]
        + [solo2, solo2, solo1, solo4, solo_crash, solo_crash, solo1, fillC]
        + [metal_first, metalA, metalB, fillB, blast_first, blast, blast, end_roll]
        + [end]
    )
    hits, t = build(bars, 168, 3)
    hits = assign_limbs(hits)
    return double_kick(hits), t + 2.5, 168

# ---------------------------------------------------------------------------
# SHORT: original groove-metal intro in a Gojira-like style (tom-driven,
# syncopated stabs, double-kick bursts). Not a transcription of any song.
# ---------------------------------------------------------------------------
def groove_metal_intro():
    tom_groove = bar(floor="O-o-O-o-O-o-O-o-", snare="----O-------O---", kick="O--O--O-O--O--O-", china="O---------------")
    tom_groove2 = bar(floor="O-o-O-o-O-o-----", tom2="------------O-o-", snare="----O-------O---", kick="O--O--O-O--O--O-", crash="O---------------")
    stabs = bar(crash="O--O--O-----O---", kick="O--O--O-OOOOO---", snare="------------O-O-", tom1="--------------O-")
    stabs2 = bar(china="O--O--O---O-----", kick="O--O--O---OOOOOO", snare="-------O----O---")
    gallop = bar(crash="O-----------------------", china="------O-----O-----O-----", snare="------O-----------O-----", kick="O-OO-OO-OO-OO-OO-OO-OO-O")
    cascade = bar(snare="OoOo--------------------", tom1="----OoOo----------------", tom2="--------OoOo------------", floor="------------OoOoOoOo----",
                  kick="O-----O-----O-----OOOOOO")
    blast = bar(ride="o-o-o-o-o-o-o-o-", snare="-O-O-O-O-O-O-O-O", kick="O-O-O-O-O-O-O-O-", crash="O---------------")
    end = bar(crash="O---------------", crash2="O---------------", china="O---------------", kick="O---------------", floor="O---------------")
    bars = ([tom_groove, tom_groove, tom_groove, tom_groove2]
            + [stabs, stabs2, stabs, cascade]
            + [gallop, gallop, gallop, cascade]
            + [tom_groove, tom_groove2, blast, blast]
            + [stabs, stabs2, stabs, cascade]
            + [end])
    hits, t = build(bars, 176, 4)
    hits = assign_limbs(hits)
    return double_kick(hits), t + 2.0, 176

# ---------------------------------------------------------------------------
def write(sid, hits, duration, bpm):
    tpb = 960
    to_ticks = lambda s: int(round(s / 0.5 * tpb))
    ev = []
    for h in hits:
        n = GM[h["i"]]
        ev.append((to_ticks(h["t"]), 1, n, h["v"]))
        ev.append((to_ticks(h["t"] + 0.25), 0, n, 0))
    ev.sort(key=lambda e: (e[0], e[1]))
    mf = mido.MidiFile(ticks_per_beat=tpb)
    tr = mido.MidiTrack()
    mf.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=500000))
    last = 0
    for tick, on, n, v in ev:
        tr.append(mido.Message("note_on" if on else "note_off", channel=9, note=n, velocity=v, time=tick - last))
        last = tick
    mid = ROOT / f"public/drums/{sid}.mid"
    mf.save(mid)
    wav = ROOT / f"public/drums/{sid}.wav"
    mp3 = ROOT / f"public/drums/{sid}.mp3"
    subprocess.run(["fluidsynth", "-ni", "-g", "1.0", "-R", "1", "-r", "44100", "-F", str(wav), SF2, str(mid)], check=True, capture_output=True)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(wav), "-t", f"{duration:.2f}", "-af",
                    f"acompressor=threshold=-18dB:ratio=3:attack=5:release=80,aecho=0.8:0.5:40:0.12,afade=t=out:st={duration-1.5:.2f}:d=1.5,loudnorm=I=-15:TP=-1.5",
                    "-b:a", "192k", str(mp3)], check=True)
    wav.unlink()
    out = {"duration": round(duration, 3), "bpm": bpm,
           "hits": [{"t": round(h["t"], 4), "i": h["i"], "v": h["v"], "limb": h["limb"]} for h in hits]}
    (ROOT / f"src/drums/{sid}.hits.json").write_text(json.dumps(out))
    from collections import Counter
    c = Counter(h["i"] for h in hits)
    peak = max(sum(1 for x in hits if h["t"] <= x["t"] < h["t"] + 1) for h in hits)
    print(f"✔ {sid}: {len(hits)} hits, {duration:.1f}s, {bpm} bpm, peak {peak} hits/s, {dict(c)}")

if __name__ == "__main__":
    write("level1-rock", *level1())
    write("level2-funk", *level2())
    write("level3-metal", *level3())
    write("short-groove-metal", *groove_metal_intro())
