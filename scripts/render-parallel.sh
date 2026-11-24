#!/usr/bin/env bash
# Render a composition in N parallel chunks (separate browser processes), then join.
# Useful for 3D (WebGL) videos on machines without a GPU, where one browser uses one core.
#
#   scripts/render-parallel.sh <CompositionId> <out.mp4> [chunks=4] [extra remotion flags...]
#   e.g. scripts/render-parallel.sh DrumLevels out/3-levels-of-drums.mp4 4 --gl=swangle
set -euo pipefail
COMP=$1; OUT=$2; N=${3:-4}; shift 3 || true
EXTRA=("$@")
WORK=$(mktemp -d "${TMPDIR:-/tmp}/render-XXXX")
echo "work dir: $WORK"

npx remotion bundle --out-dir "$WORK/bundle" >/dev/null
TOTAL=$(npx remotion compositions "$WORK/bundle" "${EXTRA[@]}" 2>/dev/null | awk -v c="$COMP" '$1==c {print $4}')
echo "frames: $TOTAL"
PER=$(( (TOTAL + N - 1) / N ))

pids=()
for ((i=0; i<N; i++)); do
  S=$(( i * PER )); E=$(( S + PER - 1 )); (( E >= TOTAL )) && E=$(( TOTAL - 1 ))
  (( S > E )) && continue
  npx remotion render "$WORK/bundle" "$COMP" "$WORK/part$i.mp4" --frames=$S-$E --muted --concurrency=1 "${EXTRA[@]}" \
    > "$WORK/part$i.log" 2>&1 &
  pids+=($!)
  echo "chunk $i: frames $S-$E (pid ${pids[-1]})"
done
# audio once, in parallel with the video chunks
npx remotion render "$WORK/bundle" "$COMP" "$WORK/audio.wav" --codec=wav "${EXTRA[@]}" > "$WORK/audio.log" 2>&1 &
pids+=($!)

fail=0
for p in "${pids[@]}"; do wait "$p" || fail=1; done
if (( fail )); then echo "a chunk failed, see $WORK/*.log"; exit 1; fi

: > "$WORK/list.txt"
for ((i=0; i<N; i++)); do [[ -f "$WORK/part$i.mp4" ]] && echo "file '$WORK/part$i.mp4'" >> "$WORK/list.txt"; done
ffmpeg -loglevel error -y -f concat -safe 0 -i "$WORK/list.txt" -i "$WORK/audio.wav" \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest "$OUT"
echo "✔ $OUT"
