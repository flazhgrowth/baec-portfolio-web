import type { Controller } from "@/controller/createController";

/** The single active controller instance, published by CameraController so overlay
 * components outside the <Canvas> tree (TitleCard's Enter button, RoomIndex) can
 * call its imperative API without threading props through the whole tree. */
export const controllerRef: { current: Controller | null } = { current: null };
