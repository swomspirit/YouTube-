import base64,json,subprocess,sys,concurrent.futures as cf
P={
"1":"The girl smiles warmly and holds the cash stack out, gently fanning the money, talks kindly, subtle simple 2D cartoon animation, static camera",
"3":"The girl hands the revolver to the boy, he grabs it happily and bounces with joy, simple 2D cartoon animation, static camera",
"4":"The white-haired girl taps her foot impatiently with arms crossed, smug, rolls her eyes, talks, simple 2D cartoon animation, static camera",
"5":"The girl stares completely deadpan and blinks slowly once, no other movement, simple 2D cartoon animation, slow push-in camera",
"6":"The knocked-out girl lies still with spinning dizzy swirl eyes, little cartoon stars circle her head, simple 2D cartoon animation, static camera",
"7":"The crying girl on the ground reaches up pleading and sobs dramatically with tears, simple 2D cartoon animation, static camera",
}
def run(k):
    b=base64.b64encode(open(f'f{k}.png','rb').read()).decode()
    open(f'req{k}.json','w').write(json.dumps({"prompt":P[k],"image_url":"data:image/png;base64,"+b,"duration":"5"}))
    for attempt in range(3):
        out=subprocess.run(["curl","-sS","-m","590","-X","POST","https://fal.run/fal-ai/kling-video/v2.1/standard/image-to-video","-H","Authorization: Key dummy","-H","Content-Type: application/json","--data-binary",f"@req{k}.json"],capture_output=True,text=True).stdout
        try:
            url=json.loads(out)["video"]["url"]; subprocess.run(["curl","-sS","-o",f"v{k}.mp4",url]); return k+" ok"
        except Exception: print(k,"retry",out[:200],flush=True)
    return k+" FAILED"
with cf.ThreadPoolExecutor(6) as ex:
    for r in ex.map(run, sys.argv[1:] or list(P)): print(r,flush=True)
