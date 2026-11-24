// Dev helper: print bone hierarchy + positions of the drummer model (standing and sitting).
import fs from "node:fs";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
const buf = fs.readFileSync("public/models/RobotExpressive.glb");
new GLTFLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), "", (g) => {
  const root = g.scene;
  const mixer = new THREE.AnimationMixer(root);
  const clip = g.animations.find((a) => a.name === "Sitting");
  const act = mixer.clipAction(clip);
  act.setLoop(THREE.LoopOnce);
  act.clampWhenFinished = true;
  act.play();
  mixer.setTime(clip.duration * 0.999);
  root.updateMatrixWorld(true);
  const p = new THREE.Vector3();
  root.traverse((o) => {
    if (!o.isBone) return;
    o.getWorldPosition(p);
    if (/Finger|Middle|Index|Ring|Thumb|_end|Palm1|Palm3/.test(o.name)) return;
    console.log(o.name.padEnd(14), "<-", (o.parent?.name ?? "").padEnd(14), p.toArray().map((v) => v.toFixed(2)).join(", "));
  });
  const box = new THREE.Box3().setFromObject(root);
  console.log("sitting bbox", box.min.toArray().map((v) => v.toFixed(2)), box.max.toArray().map((v) => v.toFixed(2)));
});
