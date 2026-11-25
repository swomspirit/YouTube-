import subprocess, os
os.chdir(os.path.dirname(os.path.abspath(__file__))+"/skit")
def dur(f): return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f]))
# trim silence from voice lines
os.makedirs("aud/t",exist_ok=True)
for f in os.listdir("aud"):
    if f.endswith(".mp3"):
        flt="silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse" if f.startswith("a") else "anull"
        subprocess.run(["ffmpeg","-y","-v","error","-i",f"aud/{f}","-af",flt,"-ar","44100","-ac","2",f"aud/t/{f[:-4]}.wav"])
A=lambda k: f"aud/t/{k}.wav"
D=lambda k: dur(A(k))
# segments: clip, start in clip, length, overlays [(png,t0,t1)], audio [(wav,delay)]
S=[]
S.append(("v1",0.0, 0.25+D("a1")+0.45, [("c1",0,99)], [("sfx_cash",0),("a1",0.25)]))
S.append(("v2",0.3, 0.15+D("a2")+0.4, [("sheriff",0,99),("c2",0,99)], [("a2",0.15)]))
S.append(("v3",0.5, 0.1+D("a3")+0.6, [("sheriff",0,99),("c3",0,99)], [("a3",0.1),("sfx_cash",0.3)]))
S.append(("v4",0.0, 0.2+D("a4")+0.5, [("op",0,99),("c4",0,99)], [("a4",0.2)]))
S.append(("v5",0.0, 0.15+D("a5")+0.5, [("c5",0,99)], [("a5",0.15)]))
S.append(("v4",2.5, 0.15+D("a5b")+0.5, [("op",0,99),("c5b",0,99)], [("a5b",0.15)]))
S.append(("v5",2.5, 1.6, [("c6",0,99)], [("sfx_cash",0.3)]))
S.append(("v6",0.0, 3.6, [("c7",0,99)], [("sfx_miss",0),("sfx_bonk",2.0)]))
a7=D("a7")
S.append(("v7",0.0, min(0.1+a7+0.4,5.0), [("c8a",0,0.1+a7*0.42),("c8b",0.1+a7*0.42,99)], [("a7",0.1)]))
S.append(("v5",3.0, 0.5+D("a8")+1.3, [("c9",0.5,99)], [("a8",0.5)]))
parts=[]
for i,(clip,st,ln,ovs,auds) in enumerate(S):
    ins=["-ss",str(st),"-t",str(ln),"-i",f"{clip}.mp4"]
    for o,_,_ in ovs: ins+=["-i",f"ov/{o}.png"]
    for a,_ in auds: ins+=["-i",A(a)]
    fc=f"[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1"
    if i==len(S)-1: fc+=",zoompan=z='min(1+0.004*on,1.25)':x='iw/2-iw/zoom/2':y='ih/3-ih/zoom/3':d=1:s=1080x1920:fps=30"
    fc+="[v0];"
    for j,(o,t0,t1) in enumerate(ovs):
        fc+=f"[v{j}][{j+1}:v]overlay=0:0:enable='between(t,{t0},{t1})'[v{j+1}];"
    n=len(ovs); amix=[]
    for j,(a,dl) in enumerate(auds):
        ms=int(dl*1000); fc+=f"[{n+1+j}:a]adelay={ms}|{ms}[a{j}];"; amix.append(f"[a{j}]")
    fc+=f"{''.join(amix)}amix=inputs={len(amix)}:normalize=0,apad,atrim=0:{ln}[aout]"
    out=f"seg{i:02d}.mp4"; parts.append(out)
    subprocess.run(["ffmpeg","-y","-v","error",*ins,"-filter_complex",fc,"-map",f"[v{n}]","-map","[aout]","-t",str(ln),
        "-c:v","libx264","-preset","medium","-crf","19","-pix_fmt","yuv420p","-c:a","aac","-ar","44100","-ac","2","-b:a","192k",out],check=True)
    print(out, round(ln,2))
open("list.txt","w").write("".join(f"file '{p}'\n" for p in parts))
subprocess.run(["ffmpeg","-y","-v","error","-f","concat","-safe","0","-i","list.txt","-af","loudnorm=I=-14:TP=-1.5","-c:v","copy","-c:a","aac","-b:a","192k","-movflags","+faststart","final.mp4"],check=True)
print("final", dur("final.mp4"))
