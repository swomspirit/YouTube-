import subprocess, os
os.chdir(os.path.dirname(os.path.abspath(__file__))+"/skit")
def dur(f): return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f]))
os.makedirs("aud/t",exist_ok=True)
for d in ["aud","sfx"]:
    for f in os.listdir(d):
        if f.endswith(".mp3"):
            flt="silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
            subprocess.run(["ffmpeg","-y","-v","error","-i",f"{d}/{f}","-af",flt,"-ar","44100","-ac","2",f"aud/t/{f[:-4]}.wav"])
A=lambda k: f"aud/t/{k}.wav"; D=lambda k: dur(A(k))
# (clip, start, len, overlays, audio[(k,delay,vol)], fx)
S=[]
S.append(("v1",0.0,0.3+D("a1")+0.5,[("c1",0,99)],[("sparkle",0,0.7),("sfx_cash",0.1,0.6),("a1",0.3,1)],"bounce"))
S.append(("v2",0.3,0.35+D("a2")+0.35,[("sheriff",0,99),("c2",0,99)],[("pop",0,0.8),("a2",0.3,1)],"punch"))
S.append(("v3",0.5,0.1+D("a3")+0.7,[("sheriff",0,99),("c3",0,99)],[("a3",0.1,1),("cheer",0.6,0.7),("sparkle",0.5,0.5)],""))
S.append(("v4",0.0,1.2+D("a4")+0.5,[("op",0.3,99),("c4",1.2,99)],[("scratch",0,1),("dundun",0.15,0.9),("a4",1.2,1.1)],"punchlate"))
S.append(("v5",0.0,2.0+D("a5")+0.4,[("c5",0.9,99)],[("crickets",0,0.6),("a5",0.9,1)],"slowzoom"))
S.append(("v4",2.5,0.1+D("a5b")+0.6,[("op",0,99),("c5b",0,99)],[("a5b",0.1,1),("vineboom",0.1+D("a5b")-0.35,1)],"shakeend"))
S.append(("v5",2.5,1.9,[("c6",0,99)],[("sigh",0,1),("sfx_cash",1.2,0.8)],""))
S.append(("v6",0.0,4.2,[("c7",0,99)],[("whoosh",0,0.6),("sfx_miss",0,1),("sfx_bonk",2.0,1),("trombone",2.3,0.9)],"shakemid"))
a7=D("a7"); L8=0.8+a7+0.4
S.append(("v7",0.0,L8,[("c8a",0.8,0.8+a7*0.42),("c8b",0.8+a7*0.42,99)],[("wail",0,0.9),("a7",0.8,1.1)],""))
S.append(("v5",3.0,0.3+D("a8")+1.6,[("c9",0.3,99)],[("whoosh",0,0.7),("impact",0.25,1),("a8",0.3,1.2),("vineboom",0.35,0.8)],"punchshake"))
FX={
 "":"",
 "bounce":",zoompan=z='1.04+0.02*sin(on/4)':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=1080x1920:fps=30",
 "punch":",zoompan=z='if(lt(on,5),1+0.03*on,1.15)':x='iw/2-iw/zoom/2':y='ih/3-ih/zoom/3':d=1:s=1080x1920:fps=30",
 "punchlate":",zoompan=z='if(lt(on,36),1,min(1+0.04*(on-36),1.2))':x='iw/2-iw/zoom/2':y='ih/3-ih/zoom/3':d=1:s=1080x1920:fps=30",
 "slowzoom":",zoompan=z='min(1+0.0025*on,1.25)':x='iw/2-iw/zoom/2':y='ih/4-ih/zoom/4':d=1:s=1080x1920:fps=30",
}
def shake(t0,t1,a=28): return f",scale=1160:2062,crop=1080:1920:x='40+if(between(t,{t0},{t1}),{a}*sin(t*83),0)':y='71+if(between(t,{t0},{t1}),{a}*cos(t*71),0)'"
parts=[]
for i,(clip,st,ln,ovs,auds,fx) in enumerate(S):
    ins=["-ss",str(st),"-i",f"{clip}.mp4"]
    for o,_,_ in ovs: ins+=["-i",f"ov/{o}.png"]
    for a,_,_ in auds: ins+=["-i",A(a)]
    fc="[0:v]tpad=stop_mode=clone:stop_duration=4,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1"
    if fx=="shakeend": fc+=shake(ln-0.5,ln)
    elif fx=="shakemid": fc+=shake(2.0,2.5)
    elif fx=="punchshake": fc+=",zoompan=z='if(lt(on,8),1+0.05*on,1.4)':x='iw/2-iw/zoom/2':y='ih/5-ih/zoom/5':d=1:s=1080x1920:fps=30"+shake(0.3,0.9,35)+",drawbox=c=white@0.85:t=fill:enable='between(t,0.28,0.36)'"
    else: fc+=FX[fx]
    if fx=="punchlate": fc+=",drawbox=c=white@0.8:t=fill:enable='between(t,1.18,1.25)'"
    fc+="[v0];"
    for j,(o,t0,t1) in enumerate(ovs): fc+=f"[v{j}][{j+1}:v]overlay=0:0:enable='between(t,{t0},{t1})'[v{j+1}];"
    n=len(ovs); am=[]
    for j,(a,dl,vol) in enumerate(auds):
        ms=int(dl*1000); fc+=f"[{n+1+j}:a]volume={vol},adelay={ms}|{ms}[a{j}];"; am.append(f"[a{j}]")
    fc+=f"{''.join(am)}amix=inputs={len(am)}:normalize=0,apad,atrim=0:{ln}[aout]"
    out=f"g{i:02d}.mp4"; parts.append((out,ln))
    subprocess.run(["ffmpeg","-y","-v","error",*ins,"-filter_complex",fc,"-map",f"[v{n}]","-map","[aout]","-t",str(ln),
        "-c:v","libx264","-preset","medium","-crf","19","-pix_fmt","yuv420p","-c:a","pcm_s16le","-ar","44100","-ac","2",out.replace(".mp4",".mkv")],check=True)
    print(i,round(ln,2))
open("list2.txt","w").write("".join(f"file '{p.replace('.mp4','.mkv')}'\n" for p,_ in parts))
subprocess.run(["ffmpeg","-y","-v","error","-f","concat","-safe","0","-i","list2.txt","-c","copy","body.mkv"],check=True)
starts=[0];[starts.append(starts[-1]+l) for _,l in parts]
happy_end=starts[3]+0.05          # cut at record scratch
sad_st=starts[8]; sad_end=starts[9]
tot=starts[-1]
fc=(f"[1:a]aloop=loop=-1:size=2e9,atrim=0:{happy_end},volume=0.22,afade=t=out:st={happy_end-0.08}:d=0.08[h];"
    f"[2:a]atrim=0:{sad_end-sad_st},volume=0.3,afade=t=in:d=0.3,afade=t=out:st={sad_end-sad_st-0.3}:d=0.3,adelay={int(sad_st*1000)}|{int(sad_st*1000)}[s];"
    f"[0:a][h][s]amix=inputs=3:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5[a]")
subprocess.run(["ffmpeg","-y","-v","error","-i","body.mkv","-i",A("bgm_happy"),"-i",A("bgm_sad"),"-filter_complex",fc,
    "-map","0:v","-map","[a]","-c:v","copy","-c:a","aac","-b:a","192k","-ar","48000","-movflags","+faststart","final2.mp4"],check=True)
print("final2",dur("final2.mp4"),"starts",[round(s,2) for s in starts])
