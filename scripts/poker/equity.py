#!/usr/bin/env python3
"""
Win chances shown in "You Look Down at Jacks" (Monte Carlo with the treys evaluator).
Hero always holds J♠ J♥. Each point = hero vs the opponent's likely RANGE on that street,
or vs his actual cards once they are known. Writes src/poker/equity.generated.json.
"""
import itertools, json, random
from pathlib import Path
from treys import Card, Evaluator

ev = Evaluator()
rng = random.Random(11)
RANKS = "23456789TJQKA"
SUITS = "shdc"
DECK = [r + s for r in RANKS for s in SUITS]
HERO = ["Js", "Jh"]

def combos(spec):
    """'QQ+', 'AK', 'any' style range -> list of 2-card combos."""
    out = []
    for part in spec.split(","):
        part = part.strip()
        if part == "any":
            out += [list(c) for c in itertools.combinations(DECK, 2)]
        elif len(part) == 3 and part[0] == part[1] and part[2] == "+":
            for r in RANKS[RANKS.index(part[0]):]:
                out += [list(c) for c in itertools.combinations([r + s for s in SUITS], 2)]
        elif len(part) == 2 and part[0] == part[1]:
            out += [list(c) for c in itertools.combinations([part[0] + s for s in SUITS], 2)]
        elif len(part) == 2:
            out += [[part[0] + a, part[1] + b] for a in SUITS for b in SUITS]
    return out

def equity(villain_range, board, filt=None, n=30000):
    dead = set(HERO + board)
    rng_c = [c for c in villain_range if not (set(c) & dead) and c[0] != c[1]]
    if filt:
        rng_c = [c for c in rng_c if filt(c, board)]
    win = tie = 0
    h = [Card.new(x) for x in HERO]
    for _ in range(n):
        v = rng.choice(rng_c)
        used = dead | set(v)
        rest = [c for c in DECK if c not in used]
        run = board + rng.sample(rest, 5 - len(board))
        b = [Card.new(x) for x in run]
        hs, vs = ev.evaluate(b, h), ev.evaluate(b, [Card.new(x) for x in v])
        if hs < vs:
            win += 1
        elif hs == vs:
            tie += 1
    return round(100 * (win + tie / 2) / n), len(rng_c)

def has_pair_or_draw(c, board):
    """Rough 'calling station keeps calling' filter: any pair, overcards, or connected cards."""
    br = [x[0] for x in board]
    ranks = [x[0] for x in c]
    if ranks[0] == ranks[1] or any(r in br for r in ranks):
        return True
    if all(RANKS.index(r) >= RANKS.index("T") for r in ranks):
        return True
    idx = sorted(RANKS.index(r) for r in ranks + br)
    return any(idx[i + 3] - idx[i] <= 4 for i in range(len(idx) - 3))

ANY = combos("any")
points = {}
# --- 1: The Rock (3-bets only QQ+/AK; bets K-high flop with AK/KK/AA) ---
points["s1_pre"] = equity(combos("QQ+,AK"), [])
points["s1_flop"] = equity(combos("AA,KK,AK"), ["Kc", "8d", "3s"])
points["s1_actual"] = equity([["Ad", "Ks"]], ["Kc", "8d", "3s"])
# --- 2: The Maniac (plays and raises almost anything) ---
points["s2_pre"] = equity(ANY, [])
points["s2_flop"] = equity(ANY, ["Qs", "7h", "2d"])
points["s2_turn"] = equity(ANY, ["Qs", "7h", "2d", "4c"])
points["s2_actual"] = equity([["9s", "8s"]], ["Qs", "7h", "2d", "4c"])
# --- 3: The Calling Station (calls with any pair, draw or overcards) ---
points["s3_flop"] = equity(ANY, ["8s", "6d", "3c"], has_pair_or_draw)
points["s3_turn"] = equity(ANY, ["8s", "6d", "3c", "2h"], has_pair_or_draw)
points["s3_river"] = equity(ANY, ["8s", "6d", "3c", "2h", "Jd"], has_pair_or_draw)
points["s3_actual"] = equity([["9c", "8h"]], ["8s", "6d", "3c", "2h", "Jd"])

out = {k: v[0] for k, v in points.items()}
Path("src/poker/equity.generated.json").write_text(json.dumps(out, indent=2) + "\n")
for k, (e, n) in points.items():
    print(f"{k:10s} {e:3d}%   ({n} villain combos)")
