import * as THREE from "three";
import { EYE_HEIGHT } from "@/geometry/layout";
import { easeInOutCubic, homeOf, inBounds, roomAt, wrapPi, yawToward } from "@/geometry/math";
import { findPath } from "@/geometry/graph";
import { hitOf, pick, tooltipTextFor } from "@/controller/picking";
import { makePathTween, makeYawTween, type PositionTween, type YawTween } from "@/controller/motion";
import { positionTooltip } from "@/controller/tooltipNode";
import { SPECIAL_ROOM_ID, isInGatedZone } from "@/controller/gatedRoom";
import type { GalleryStore } from "@/store/galleryStore";
import type { ArtRecord, CompiledSpace, DoorRecord } from "@/space/types";

export interface Controller {
  tick(dt: number, now: number): void;
  approach(rec: ArtRecord): void;
  stepBack(): void;
  travel(door: DoorRecord, after?: () => void): void;
  gotoRoom(id: string): void;
  enter(): void;
  unlockSpecial(): void;
  bindInput(dom: HTMLElement): () => void;
  dispose(): void;
}

interface ControllerOptions {
  space: CompiledSpace;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  store: GalleryStore;
}

// Matches compileSpace.ts's room-bounds inset exactly (the AABB every room's
// free-walk area is clipped to). Used below to keep a first-time arrival point
// safely inside that AABB, not still in the doorway's narrower corridor box —
// otherwise strafing (no forward component) right on arrival can hit the
// corridor's tight z-limit and appear to "stick" until some other tween
// (approach()) relocates the camera into the room proper.
const ROOM_WALK_INSET = 0.6;

const DRAG_THRESHOLD = 5;
const CLICK_THRESHOLD_DESKTOP = 6;
const CLICK_THRESHOLD_TOUCH = 10;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

/**
 * Owns camera pose, tweens, keys, drag and hover picking as mutable closure state —
 * none of it ever goes through React. Exactly one `useFrame` (in CameraController)
 * calls `tick`; its body is a line-by-line port of design/gallery3d.js's per-frame
 * loop, whose ordering (tween/yaw/walk exclusive chain -> room recompute -> camera
 * sync -> hover pick) is behavioural and must not be split across components.
 */
export function createController({ space, camera, scene, store }: ControllerOptions): Controller {
  const roomList = Object.values(space.roomById);

  const state = {
    pos: new THREE.Vector3(space.spec.start.pos[0], EYE_HEIGHT, space.spec.start.pos[1]),
    yaw: space.spec.start.yaw,
    pitch: -0.02,
    room: space.startRoom.id,
    mode: store.getState().mode,
    focus: null as ArtRecord | null,
    tween: null as PositionTween | null,
    yawTween: null as YawTween | null,
    entered: false,
  };

  const keys: Record<string, boolean> = {};
  let dragging = false;
  let moved = 0;
  let lx = 0;
  let ly = 0;
  let hovered: THREE.Object3D | null = null;
  let ptrIn = false;
  let dom: HTMLElement | null = null;
  let disposed = false;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const fwd = new THREE.Vector3();
  const sid = new THREE.Vector3();
  const timers = new Set<ReturnType<typeof setTimeout>>();

  /** Where the visitor was standing the last time they left each room, keyed
   * by room id. `travel()` writes this on the way out and reads it on the way
   * back in, so leaving a room and returning resumes from the same spot
   * instead of always re-landing on the room's fixed `home` point. Facing is
   * NOT remembered here — arrival yaw is always computed fresh from the
   * direction of travel (see `travel()`'s `endYaw`), not the old departure
   * yaw, so returning to a room means facing into it, not back at the door. */
  const roomMemory = new Map<string, { pos: [number, number] }>();

  function setCursor(cursor: string) {
    if (dom) dom.style.cursor = cursor;
  }

  function schedule(fn: () => void, ms: number) {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  }

  function startPath(
    points: Array<[number, number]>,
    toYaw: number,
    toPitch: number,
    dur: number,
    onDone?: () => void,
    lookAlong?: boolean,
  ) {
    state.tween = makePathTween(points, state.yaw, toYaw, state.pitch, toPitch, dur, performance.now(), onDone, lookAlong);
    state.yawTween = null;
  }

  function startYaw(toYaw: number, dur: number) {
    state.yawTween = makeYawTween(state.yaw, toYaw, dur, performance.now());
  }

  function setRoom(id: string) {
    if (state.room === id) return;
    state.room = id;
    store.setState({ roomId: id });
  }

  function heroYaw(roomId: string): number {
    const rec = space.artRecords.find((a) => a.room === roomId);
    return rec ? rec.yaw : state.yaw;
  }

  function approach(rec: ArtRecord) {
    state.mode = "art";
    state.focus = rec;
    store.setState({ mode: "art", hint: "hidden" });
    const mid: [number, number] = [(state.pos.x + rec.view[0]) / 2, (state.pos.z + rec.view[1]) / 2];
    startPath([[state.pos.x, state.pos.z], mid, rec.view], rec.yaw, 0.075, 1200, () => {
      store.setState({ caption: rec });
    });
  }

  function stepBack() {
    if (state.mode !== "art" || !state.focus) return;
    state.mode = "free";
    state.focus = null;
    store.setState({ mode: "free", caption: null });
    const bx = Math.sin(state.yaw);
    const bz = Math.cos(state.yaw);
    let d = 2.4;
    while (d > 0.3 && !inBounds(space.bounds, state.pos.x + bx * d, state.pos.z + bz * d)) d -= 0.3;
    const mid: [number, number] = [state.pos.x + bx * d * 0.5, state.pos.z + bz * d * 0.5];
    const away: [number, number] = [state.pos.x + bx * d, state.pos.z + bz * d];
    startPath([[state.pos.x, state.pos.z], mid, away], state.yaw, -0.02, 900, () => {
      store.setState({ hint: "shown" });
    });
  }

  function travel(door: DoorRecord, after?: () => void) {
    if (door.to === SPECIAL_ROOM_ID && !store.getState().specialUnlocked) {
      store.setState({ specialGateOpen: true });
      return;
    }
    // Remember where we're standing in the room we're leaving before anything
    // else changes state.pos/yaw, so a later return trip can resume here.
    roomMemory.set(state.room, { pos: [state.pos.x, state.pos.z] });

    state.mode = "travel";
    state.focus = null;
    store.setState({ mode: "travel", caption: null, hint: "hidden" });
    const to = space.roomById[door.to];
    const remembered = roomMemory.get(to.id);
    const hp = homeOf(to);
    // Clamp into the room's own walkable AABB (not the door's corridor box) so
    // a first-time arrival never lands in the trap described above — a no-op
    // for any room where the 0.72/0.28 blend already lands well clear of the
    // doorway, and a small pull-in for a room whose home point sits close to
    // its own door (East Room, North Room, Special Room all do).
    const clamp = (v: number, c: number, half: number) =>
      Math.max(c - half + ROOM_WALK_INSET, Math.min(c + half - ROOM_WALK_INSET, v));
    const stand: [number, number] = remembered
      ? remembered.pos
      : [
          clamp(hp[0] * 0.72 + door.thru[0] * 0.28, to.c[0], to.s[0] / 2),
          clamp(hp[1] * 0.72 + door.thru[1] * 0.28, to.c[1], to.s[1] / 2),
        ];
    // Face the direction of travel on arrival, not the yaw last held while
    // standing here before leaving — re-entering a room from a door you just
    // walked back through should mean facing further into the room (away from
    // that door), the same way a first-time entry faces the room's centre,
    // not spin around to face the door itself.
    const endYaw = remembered
      ? yawToward(stand[0] - door.thru[0] || 0.001, stand[1] - door.thru[1] || 0.001)
      : yawToward(to.c[0] - stand[0] || 0.001, to.c[1] - stand[1] || 0.001);
    startPath(
      [[state.pos.x, state.pos.z], door.entry, door.mid, door.thru, stand],
      endYaw,
      -0.02,
      2700,
      () => {
        state.mode = "free";
        store.setState({ mode: "free", hint: "shown" });
        // Only auto-face the hero print on a first visit — a remembered
        // return already ends facing into the room from `endYaw` above.
        if (!remembered) startYaw(heroYaw(door.to), 1100);
        after?.();
      },
      true,
    );
    schedule(() => setRoom(door.to), 1600);
  }

  function gotoRoom(id: string) {
    if (id === SPECIAL_ROOM_ID && !store.getState().specialUnlocked) {
      store.setState({ specialGateOpen: true });
      return;
    }
    if (id === state.room || state.mode === "travel") return;
    const hops = findPath(space.adjacency, state.room, id);
    if (!hops || !hops.length) {
      store.setState({ veil: true });
      schedule(() => {
        const r = space.roomById[id];
        const hp = homeOf(r);
        state.pos.set(hp[0], EYE_HEIGHT, hp[1]);
        state.yaw = heroYaw(id);
        state.pitch = -0.02;
        state.mode = "free";
        store.setState({ mode: "free" });
        setRoom(id);
        store.setState({ veil: false });
      }, 500);
      return;
    }
    let i = 0;
    const step = () => {
      if (disposed || i >= hops.length) return;
      const nextId = hops[i++];
      const door = space.doors.find((x) => x.from === state.room && x.to === nextId);
      if (!door) return;
      travel(door, step);
    };
    step();
  }

  function enter() {
    state.entered = true;
    store.setState({ entered: true });
    const r = space.startRoom;
    const hp = homeOf(r);
    startPath(
      [[state.pos.x, state.pos.z], [(state.pos.x + hp[0]) / 2, (state.pos.z + hp[1]) / 2], hp],
      heroYaw(r.id),
      -0.02,
      2600,
    );
    schedule(() => store.setState({ hint: "shown" }), 2000);
    schedule(() => store.setState({ hint: "hidden" }), 13000);
  }

  /** Marks the token gate passed and closes its modal — called by SpecialGate.tsx
   * once POST /specials/validate returns 2xx. Doesn't travel by itself; the caller
   * follows up with gotoRoom(SPECIAL_ROOM_ID), which now passes the check above. */
  function unlockSpecial() {
    store.setState({ specialUnlocked: true, specialGateOpen: false });
  }

  function onPointerDown(e: PointerEvent) {
    dragging = true;
    moved = 0;
    lx = e.clientX;
    ly = e.clientY;
    setCursor("grabbing");
    dom?.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!dom) return;
    const r = dom.getBoundingClientRect();
    ptrIn = true;
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    positionTooltip(e.clientX - r.left, e.clientY - r.top);
    if (dragging) {
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > DRAG_THRESHOLD) {
        state.tween = null;
        state.yawTween = null;
        if (state.mode === "travel") {
          state.mode = "free";
          store.setState({ mode: "free" });
        }
      }
      state.yaw -= dx * 0.0033;
      state.pitch = Math.max(-0.55, Math.min(0.5, state.pitch - dy * 0.0027));
      lx = e.clientX;
      ly = e.clientY;
    }
  }

  function onPointerLeave() {
    ptrIn = false;
    hovered = null;
    store.setState({ tooltipText: null });
  }

  function onPointerUp() {
    if (dragging) {
      dragging = false;
      setCursor("grab");
    }
  }

  function onClick() {
    const profile = store.getState().profile;
    const threshold = profile === "touch" ? CLICK_THRESHOLD_TOUCH : CLICK_THRESHOLD_DESKTOP;
    if (moved > threshold) return;
    const hit = hitOf(pick(raycaster, pointer, camera, scene));
    if (hit) {
      if (hit.type === "art") {
        approach(hit.rec);
        return;
      }
      travel(hit.door);
      return;
    }
    if (state.mode === "art") stepBack();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (isTypingTarget(e.target)) return;
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (e.key === "Escape") stepBack();
    if (
      ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k) &&
      state.entered
    ) {
      e.preventDefault();
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    if (isTypingTarget(e.target)) return;
    keys[e.key.toLowerCase()] = false;
  }

  function bindInput(domEl: HTMLElement): () => void {
    // Reset so a StrictMode dev remount (unbind+dispose, then bindInput again) or a
    // genuine remount leaves the controller fully functional, not permanently
    // disposed from the first cleanup.
    disposed = false;
    dom = domEl;
    dom.style.cursor = "grab";
    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("pointerleave", onPointerLeave);
    dom.addEventListener("click", onClick);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      dom?.removeEventListener("pointerdown", onPointerDown);
      dom?.removeEventListener("pointermove", onPointerMove);
      dom?.removeEventListener("pointerleave", onPointerLeave);
      dom?.removeEventListener("click", onClick);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      dom = null;
    };
  }

  function dispose() {
    disposed = true;
    for (const t of timers) clearTimeout(t);
    timers.clear();
  }

  function tick(dt: number, now: number) {
    if (state.tween) {
      const tw = state.tween;
      const raw = Math.min(1, (now - tw.t0) / tw.dur);
      const t = easeInOutCubic(raw);
      const p = tw.curve.getPoint(t);
      state.pos.set(p.x, EYE_HEIGHT, p.z);
      if (tw.lookAlong && raw < 0.8) {
        const tan = tw.curve.getTangent(Math.min(0.999, Math.max(0.001, t)));
        const want = yawToward(tan.x, tan.z);
        state.yaw += wrapPi(want - state.yaw) * Math.min(1, dt * 3.2);
        state.pitch += (0 - state.pitch) * Math.min(1, dt * 2.2);
      } else {
        state.yaw = tw.yaw0 + tw.dYaw * t;
        state.pitch = tw.pitch0 + tw.dPitch * t;
      }
      if (raw >= 1) {
        state.tween = null;
        tw.onDone?.();
      }
    } else if (state.yawTween) {
      const yt = state.yawTween;
      const raw = Math.min(1, (now - yt.t0) / yt.dur);
      state.yaw = yt.y0 + yt.dy * easeInOutCubic(raw);
      if (raw >= 1) state.yawTween = null;
    } else if (state.entered && store.getState().profile === "desktop") {
      let f = 0;
      let s = 0;
      if (keys["w"] || keys["arrowup"]) f += 1;
      if (keys["s"] || keys["arrowdown"]) f -= 1;
      if (keys["a"] || keys["arrowleft"]) s -= 1;
      if (keys["d"] || keys["arrowright"]) s += 1;
      if (f || s) {
        if (state.mode === "art") {
          state.mode = "free";
          state.focus = null;
          store.setState({ mode: "free", caption: null });
        }
        const sp = (keys["shift"] ? 3.2 : 1.8) * dt;
        fwd.set(-Math.sin(state.yaw), 0, -Math.cos(state.yaw));
        sid.set(Math.cos(state.yaw), 0, -Math.sin(state.yaw));
        const nx = state.pos.x + (fwd.x * f + sid.x * s) * sp;
        const nz = state.pos.z + (fwd.z * f + sid.z * s) * sp;
        const gateLocked = !store.getState().specialUnlocked;
        if (inBounds(space.bounds, nx, state.pos.z) && !(gateLocked && isInGatedZone(space, nx, state.pos.z))) {
          state.pos.x = nx;
        }
        if (inBounds(space.bounds, state.pos.x, nz) && !(gateLocked && isInGatedZone(space, state.pos.x, nz))) {
          state.pos.z = nz;
        }
      }
    }

    if (state.mode !== "travel") {
      const rid = roomAt(roomList, state.pos.x, state.pos.z, state.room);
      if (rid !== state.room) setRoom(rid);
    }

    camera.position.copy(state.pos);
    camera.rotation.set(state.pitch, state.yaw, 0);

    if (!dragging && state.entered && ptrIn && store.getState().profile === "desktop") {
      const obj = pick(raycaster, pointer, camera, scene);
      if (obj !== hovered) {
        hovered = obj;
        const hit = hitOf(obj);
        if (hit) {
          store.setState({ tooltipText: tooltipTextFor(hit) });
          setCursor("pointer");
        } else {
          store.setState({ tooltipText: null });
          setCursor("grab");
        }
      }
    }
  }

  return { tick, approach, stepBack, travel, gotoRoom, enter, unlockSpecial, bindInput, dispose };
}
