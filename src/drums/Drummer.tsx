import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

/*
 * Robot drummer (RobotExpressive by Tomás Laulhé / Quaternius, CC0).
 * Base pose = the model's "Sitting" clip. Every frame we:
 *   1. restore the sitting pose,
 *   2. bend the arms with two-bone IK so the palms hold the sticks,
 *   3. headbang on the beat and blend facial expressions.
 */

const SCALE = 0.4;
const HEAD_SCALE = 0.62; // the model has a huge cartoon head; shrink it so the kit stays visible
// sitting hips in model space are at (0, 0.82, -0.66); put them on the throne at (0, 0.39, -0.85)
const OFFSET = new THREE.Vector3(0, 0.39 - 0.82 * SCALE, -0.85 + 0.66 * SCALE);

type Rig = {
  gltf: GLTF;
  root: THREE.Object3D;
  rest: Map<THREE.Bone, THREE.Quaternion>;
  bones: Record<string, THREE.Bone>;
  face: THREE.Mesh | null;
};

let rigPromise: Promise<Rig> | null = null;
let rigCache: Rig | null = null;

const loadRig = () => {
  if (!rigPromise) {
    rigPromise = new Promise<Rig>((resolve, reject) => {
      new GLTFLoader().load(
        staticFile("models/RobotExpressive.glb"),
        (gltf) => {
          const root = gltf.scene;
          root.scale.setScalar(SCALE);
          root.position.copy(OFFSET);
          const mixer = new THREE.AnimationMixer(root);
          const clip = gltf.animations.find((a) => a.name === "Sitting")!;
          const act = mixer.clipAction(clip);
          act.setLoop(THREE.LoopOnce, 1);
          act.clampWhenFinished = true;
          act.play();
          mixer.setTime(clip.duration * 0.999);
          const rest = new Map<THREE.Bone, THREE.Quaternion>();
          const bones: Record<string, THREE.Bone> = {};
          let face: THREE.Mesh | null = null;
          root.traverse((o) => {
            if ((o as THREE.Bone).isBone) {
              rest.set(o as THREE.Bone, o.quaternion.clone());
              bones[o.name] = o as THREE.Bone;
            }
            const m = o as THREE.Mesh;
            if (m.isMesh) {
              m.frustumCulled = false;
              if (m.morphTargetDictionary && "Angry" in m.morphTargetDictionary) face = m;
            }
          });
          mixer.stopAllAction();
          resolve({ gltf, root, rest, bones, face });
        },
        undefined,
        reject,
      );
    });
  }
  return rigPromise;
};

/**
 * Call this OUTSIDE the <ThreeCanvas> (in the normal React tree) and only mount the canvas once it
 * returns true. That way the model is ready on the very first frame of every render chunk.
 */
export const usePreloadDrummer = () => {
  const [ready, setReady] = useState(!!rigCache);
  const [handle] = useState(() => (rigCache ? null : delayRender("Preloading drummer model")));
  useEffect(() => {
    if (ready) return;
    loadRig()
      .then((r) => {
        rigCache = r;
        setReady(true);
        if (handle !== null) continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [ready, handle]);
  return ready;
};

export const useDrummerRig = () => {
  const [rig, setRig] = useState<Rig | null>(rigCache);
  const invalidate = useThree((st) => st.invalidate);
  const [handle] = useState(() => (rigCache ? null : delayRender("Loading drummer model")));
  useEffect(() => {
    if (rig) return;
    loadRig()
      .then((r) => {
        rigCache = r;
        setRig(r);
      })
      .catch((e) => cancelRender(e));
  }, [rig]);
  useEffect(() => {
    // release the frame only after the model has been committed and drawn
    if (!rig || handle === null) return;
    // the canvas only redraws on demand: draw once with the model, then release the frame
    invalidate();
    requestAnimationFrame(() => requestAnimationFrame(() => continueRender(handle)));
  }, [rig, handle, invalidate]);
  return rig;
};

/* ---------------- two-bone IK (Daniel Holden's analytic method) ---------------- */
const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();
const clamp1 = (x: number) => Math.min(1, Math.max(-1, x));
const worldQuat = (o: THREE.Object3D) => o.getWorldQuaternion(new THREE.Quaternion());

const twoBoneIK = (a: THREE.Bone, b: THREE.Bone, c: THREE.Object3D, target: THREE.Vector3, pole: THREE.Vector3, root: THREE.Object3D) => {
  root.updateMatrixWorld(true);
  a.getWorldPosition(va);
  b.getWorldPosition(vb);
  c.getWorldPosition(vc);
  const lab = va.distanceTo(vb);
  const lcb = vb.distanceTo(vc);
  const lat = Math.min(Math.max(va.distanceTo(target), 0.01), (lab + lcb) * 0.999);

  const ac = vc.clone().sub(va).normalize();
  const ab = vb.clone().sub(va).normalize();
  const ba = va.clone().sub(vb).normalize();
  const bc = vc.clone().sub(vb).normalize();
  const at = target.clone().sub(va).normalize();

  const ac_ab_0 = Math.acos(clamp1(ac.dot(ab)));
  const ba_bc_0 = Math.acos(clamp1(ba.dot(bc)));
  const ac_at_0 = Math.acos(clamp1(ac.dot(at)));
  const ac_ab_1 = Math.acos(clamp1((lcb * lcb - lab * lab - lat * lat) / (-2 * lab * lat)));
  const ba_bc_1 = Math.acos(clamp1((lat * lat - lab * lab - lcb * lcb) / (-2 * lab * lcb)));

  const axis0 = new THREE.Vector3().crossVectors(ac, pole).normalize();
  const axis1 = new THREE.Vector3().crossVectors(ac, at);
  if (axis1.lengthSq() < 1e-10) axis1.copy(axis0);
  axis1.normalize();

  const aInv = worldQuat(a).invert();
  const bInv = worldQuat(b).invert();
  const r0 = new THREE.Quaternion().setFromAxisAngle(axis0.clone().applyQuaternion(aInv), ac_ab_1 - ac_ab_0);
  const r1 = new THREE.Quaternion().setFromAxisAngle(axis0.clone().applyQuaternion(bInv), ba_bc_1 - ba_bc_0);
  const r2 = new THREE.Quaternion().setFromAxisAngle(axis1.clone().applyQuaternion(aInv), ac_at_0);
  a.quaternion.multiply(r0.multiply(r2));
  b.quaternion.multiply(r1);
};

export type DrummerPose = {
  gripR: THREE.Vector3; // world-space points where the palms should be
  gripL: THREE.Vector3;
  bang: number; // 0..1 headbang
  sway: number; // -1..1 body sway
  angry: number;
  surprised: number;
  footR: number; // 0..1 pedal press
  footL: number;
};

const POLE_L = new THREE.Vector3(1, -0.6, -0.4).normalize();
const POLE_R = new THREE.Vector3(-1, -0.6, -0.4).normalize();
const X = new THREE.Vector3(1, 0, 0);
const Z = new THREE.Vector3(0, 0, 1);

export const Drummer: React.FC<{ pose: DrummerPose }> = ({ pose }) => {
  const rig = useDrummerRig();
  if (!rig) return null;
  const { root, rest, bones, face } = rig;

  // 1. sitting pose
  rest.forEach((q, bone) => bone.quaternion.copy(q));
  bones.Head?.scale.setScalar(HEAD_SCALE);

  // 2. body sway + headbang
  bones.Abdomen?.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(Z, pose.sway * 0.06));
  bones.Torso_1?.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(X, pose.bang * 0.12));
  bones.Neck?.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(X, pose.bang * 0.38 - 0.08));
  bones.Head?.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(X, pose.bang * 0.2));

  // 3. arms hold the sticks
  for (let pass = 0; pass < 2; pass++) {
    if (bones.UpperArmR && bones.LowerArmR && bones.Palm2R) twoBoneIK(bones.UpperArmR, bones.LowerArmR, bones.Palm2R, pose.gripR, POLE_R, root);
    if (bones.UpperArmL && bones.LowerArmL && bones.Palm2L) twoBoneIK(bones.UpperArmL, bones.LowerArmL, bones.Palm2L, pose.gripL, POLE_L, root);
  }

  // 4. feet tap with the pedals
  bones.FootR?.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(X, pose.footR * 0.35));
  bones.FootL?.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(X, pose.footL * 0.35));

  // 5. face
  if (face?.morphTargetInfluences && face.morphTargetDictionary) {
    face.morphTargetInfluences[face.morphTargetDictionary.Angry] = pose.angry;
    face.morphTargetInfluences[face.morphTargetDictionary.Surprised] = pose.surprised;
  }
  root.updateMatrixWorld(true);
  return <primitive object={root} />;
};
