// Dev check: load the drummer, apply sitting pose + IK toward sample grips, print results.
import fs from "node:fs";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
const SCALE = 0.45;
const buf = fs.readFileSync("public/models/RobotExpressive.glb");
new GLTFLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), "", (g) => {
  const root = g.scene;
  root.scale.setScalar(SCALE);
  root.position.set(0, 0.39 - 0.82 * SCALE, -0.85 + 0.66 * SCALE);
  const mixer = new THREE.AnimationMixer(root);
  const clip = g.animations.find((a) => a.name === "Sitting");
  const act = mixer.clipAction(clip); act.setLoop(THREE.LoopOnce, 1); act.clampWhenFinished = true; act.play();
  mixer.setTime(clip.duration * 0.999);
  mixer.stopAllAction();
  root.updateMatrixWorld(true);
  const b = {}; root.traverse((o) => { if (o.isBone) b[o.name] = o; });
  const p = new THREE.Vector3();
  for (const n of ["Hips", "Head", "UpperArmR", "LowerArmR", "Palm2R", "UpperArmL", "Palm2L"]) { b[n].getWorldPosition(p); console.log("after stop", n, p.toArray().map(v=>v.toFixed(3)).join(",")); }
  let meshes = 0; root.traverse((o) => { if (o.isMesh) meshes++; });
  console.log("meshes", meshes, "root children", root.children.map(c=>c.name));
});

// ---- run the same IK as Drummer.tsx ----
const clamp1 = (x) => Math.min(1, Math.max(-1, x));
function twoBoneIK(a, bb, c, target, pole, root) {
  root.updateMatrixWorld(true);
  const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();
  a.getWorldPosition(va); bb.getWorldPosition(vb); c.getWorldPosition(vc);
  const lab = va.distanceTo(vb), lcb = vb.distanceTo(vc);
  const lat = Math.min(Math.max(va.distanceTo(target), 0.01), (lab + lcb) * 0.999);
  const ac = vc.clone().sub(va).normalize(), ab = vb.clone().sub(va).normalize();
  const ba = va.clone().sub(vb).normalize(), bc = vc.clone().sub(vb).normalize();
  const at = target.clone().sub(va).normalize();
  const ac_ab_0 = Math.acos(clamp1(ac.dot(ab))), ba_bc_0 = Math.acos(clamp1(ba.dot(bc))), ac_at_0 = Math.acos(clamp1(ac.dot(at)));
  const ac_ab_1 = Math.acos(clamp1((lcb * lcb - lab * lab - lat * lat) / (-2 * lab * lat)));
  const ba_bc_1 = Math.acos(clamp1((lat * lat - lab * lab - lcb * lcb) / (-2 * lab * lcb)));
  const axis0 = new THREE.Vector3().crossVectors(ac, pole).normalize();
  const axis1 = new THREE.Vector3().crossVectors(ac, at); if (axis1.lengthSq() < 1e-10) axis1.copy(axis0); axis1.normalize();
  const aInv = a.getWorldQuaternion(new THREE.Quaternion()).invert();
  const bInv = bb.getWorldQuaternion(new THREE.Quaternion()).invert();
  const r0 = new THREE.Quaternion().setFromAxisAngle(axis0.clone().applyQuaternion(aInv), ac_ab_1 - ac_ab_0);
  const r1 = new THREE.Quaternion().setFromAxisAngle(axis0.clone().applyQuaternion(bInv), ba_bc_1 - ba_bc_0);
  const r2 = new THREE.Quaternion().setFromAxisAngle(axis1.clone().applyQuaternion(aInv), ac_at_0);
  a.quaternion.multiply(r0.multiply(r2)); bb.quaternion.multiply(r1);
  root.updateMatrixWorld(true);
  const got = new THREE.Vector3(); c.getWorldPosition(got);
  return { got, lab, lcb };
}
new GLTFLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), "", (g) => {
  const root = g.scene; root.scale.setScalar(SCALE); root.position.set(0, 0.39 - 0.82 * SCALE, -0.85 + 0.66 * SCALE);
  const mixer = new THREE.AnimationMixer(root); const clip = g.animations.find((a) => a.name === "Sitting");
  const act = mixer.clipAction(clip); act.setLoop(THREE.LoopOnce, 1); act.clampWhenFinished = true; act.play(); mixer.setTime(clip.duration * 0.999);
  root.updateMatrixWorld(true);
  const b = {}; root.traverse((o) => { if (o.isBone) b[o.name] = o; });
  const p = new THREE.Vector3(); b.Hips.getWorldPosition(p); console.log("sitting hips (before stop)", p.toArray().map(v=>v.toFixed(3)).join(","));
  const target = new THREE.Vector3(0.05, 0.85, -0.45);
  const r = twoBoneIK(b.UpperArmR, b.LowerArmR, b.Palm2R, target, new THREE.Vector3(-1, -0.6, -0.4).normalize(), root);
  console.log("IK R target", target.toArray().join(","), "got", r.got.toArray().map(v=>v.toFixed(3)).join(","), "lengths", r.lab.toFixed(3), r.lcb.toFixed(3));
  console.log("quat ok?", [b.UpperArmR.quaternion, b.LowerArmR.quaternion].every(q => [q.x,q.y,q.z,q.w].every(Number.isFinite)));
});
