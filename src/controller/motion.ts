import * as THREE from "three";
import { wrapPi } from "@/geometry/math";
import { EYE_HEIGHT } from "@/geometry/layout";

export interface PositionTween {
  curve: THREE.CatmullRomCurve3;
  t0: number;
  dur: number;
  yaw0: number;
  dYaw: number;
  pitch0: number;
  dPitch: number;
  onDone?: () => void;
  lookAlong?: boolean;
}

export interface YawTween {
  y0: number;
  dy: number;
  t0: number;
  dur: number;
}

/** Builds a CatmullRom path tween through world [x,z] waypoints, at constant eye
 * height. `tension 0.35` matches design/gallery3d.js's `path()` exactly. */
export function makePathTween(
  points: Array<[number, number]>,
  fromYaw: number,
  toYaw: number,
  fromPitch: number,
  toPitch: number,
  dur: number,
  now: number,
  onDone?: () => void,
  lookAlong?: boolean,
): PositionTween {
  const pts = points.map((p) => new THREE.Vector3(p[0], EYE_HEIGHT, p[1]));
  return {
    curve: new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.35),
    t0: now,
    dur,
    yaw0: fromYaw,
    dYaw: wrapPi(toYaw - fromYaw),
    pitch0: fromPitch,
    dPitch: toPitch - fromPitch,
    onDone,
    lookAlong,
  };
}

export function makeYawTween(fromYaw: number, toYaw: number, dur: number, now: number): YawTween {
  return { y0: fromYaw, dy: wrapPi(toYaw - fromYaw), t0: now, dur };
}
