import { createStore } from "zustand/vanilla";
import type { ArtRecord } from "@/space/types";

export type InputProfile = "desktop" | "touch";
export type GalleryMode = "free" | "art" | "travel";
export type HintState = "hidden" | "shown";

export interface GalleryState {
  roomId: string;
  mode: GalleryMode;
  caption: ArtRecord | null;
  tooltipText: string | null;
  entered: boolean;
  hint: HintState;
  /** true during the 500ms hard-cut teleport used when two rooms aren't reachable
   * by a doorway path. */
  veil: boolean;
  profile: InputProfile;
  assetsReady: boolean;
  guestbookOpen: boolean;
  visitorName: string;
  /** Whether a POST /guests record is known to exist for this visit_id — true once
   * TitleCard's real submit fires it, or once MessageBoard registers a fallback
   * (random-named) one for a visitor who used "Skip". POST /messages requires this,
   * so MessageBoard checks it before sending. */
  visitorLogged: boolean;
  /** Whether the "leave a message" panel is open — see overlay/MessageBoard.tsx. */
  messageOpen: boolean;
  /** Whether the Special Room's token gate has been passed this session. Doubles
   * as the walking-collision gate — see controller/gatedRoom.ts. */
  specialUnlocked: boolean;
  /** Whether the token-entry modal is open — see overlay/SpecialGate.tsx. */
  specialGateOpen: boolean;
  /** Artwork keys (ArtRecord.key) known to have at least one note — populated once
   * from GET /notes/summary at app load, appended to optimistically after a
   * successful submit. Drives the post-it cue in scene/Hang.tsx. */
  notedArtKeys: string[];
  /** Whether the notes panel is open, and for which artwork — see
   * overlay/NotesPanel.tsx. Kept independent of `caption` so the panel survives
   * stepping back out of the caption view. */
  notesOpen: boolean;
  notesArtKey: string | null;
}

export type GalleryStore = ReturnType<typeof createGalleryStore>;

/** Vanilla zustand store, written by the imperative controller via `setState` and
 * read by React via `useGallery`. Holds only coarse, event-rate fields — never
 * camera pose, yaw, pitch or the active tween, which stay in the controller's own
 * closure and would cause a re-render every frame if they lived here. */
export function createGalleryStore(initial: Pick<GalleryState, "roomId" | "profile">) {
  return createStore<GalleryState>()(() => ({
    roomId: initial.roomId,
    mode: "free",
    caption: null,
    tooltipText: null,
    entered: false,
    hint: "hidden",
    veil: false,
    profile: initial.profile,
    assetsReady: false,
    guestbookOpen: false,
    visitorName: "",
    visitorLogged: false,
    messageOpen: false,
    specialUnlocked: false,
    specialGateOpen: false,
    notedArtKeys: [],
    notesOpen: false,
    notesArtKey: null,
  }));
}
