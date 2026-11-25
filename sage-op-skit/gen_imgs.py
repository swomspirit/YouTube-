import json, subprocess, sys, concurrent.futures as cf
STYLE = ("Funny 2D chibi cartoon animation frame, thick black outlines, flat cel colors, simple webcomic style, "
 "vertical 9:16 shot. Background: sandy desert-town video game map with tan stone walls and wooden crates, slightly soft. "
 "No text, no letters, no watermark, single panel. ")
SAGE = "a young woman healer with long black hair in a high bun, white kimono-style jacket with teal trim, purple and teal sash belt, black pants"
GEKKO = "a short chubby cheerful young man with spiky lime-green hair, lime and purple shirt, purple fingerless gloves, brown pants"
JETT = "a small cocky young woman with spiky white hair tied in a bun with white bangs, light-blue cropped jacket, black pants, black gloves"
shots = {
 "s1": f"Medium shot of {SAGE}, calm kind smile, holding out a fat stack of green cash toward the viewer.",
 "s2": f"Medium shot of {GEKKO}, waving one arm high excitedly, big open-mouth happy grin.",
 "s3": f"Full vertical frame. {SAGE} on the left gently giving a silver revolver to {GEKKO} on the right, she holds it flat on her open palm, gun pointing at the ground, he reaches for it with sparkly happy eyes, she smiles.",
 "s4": f"Medium shot of {JETT}, arms crossed, smug entitled face, chin up, eyebrows raised, demanding.",
 "s5": f"Close-up of {SAGE}, completely deadpan unimpressed blank stare, flat mouth, half-lidded eyes, straight at the viewer.",
 "s6": f"{JETT} lying face-down flat on the sandy ground knocked out, cartoon dizzy swirl eyes, a huge sniper rifle dropped beside her, comedic, no blood.",
 "s7": f"{JETT} lying on the ground looking up at the viewer with huge teary puppy eyes, reaching one hand up, pleading.",
}
def gen(k):
    body = json.dumps({"prompt": STYLE + shots[k], "num_images": 1, "aspect_ratio": "9:16"})
    out = subprocess.run(["curl","-sS","-X","POST","https://fal.run/fal-ai/nano-banana","-H","Authorization: Key dummy",
        "-H","Content-Type: application/json","-d",body],capture_output=True,text=True).stdout
    url = json.loads(out)["images"][0]["url"]
    subprocess.run(["curl","-sS","-o",f"{k}.png",url]); return k
keys = sys.argv[1:] or list(shots)
with cf.ThreadPoolExecutor(7) as ex:
    for k in ex.map(gen, keys): print("done", k)
