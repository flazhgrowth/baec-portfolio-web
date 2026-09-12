import { useGallery } from "@/store/useGallery";
import styles from "@/overlay/overlay.module.css";
import type { CompiledSpace } from "@/space/types";

export default function RoomTag({ compiled }: { compiled: CompiledSpace }) {
  const roomId = useGallery((s) => s.roomId);
  const room = compiled.roomById[roomId];

  return (
    <div className={styles.roomTag}>
      {/* key remounts on room change so the fade-in animation replays, matching
          design/gallery3d.js's `setRoom` WAAPI animate. */}
      <div key={roomId} className={styles.roomTagInner}>
        <div className={styles.roomName}>{room.name}</div>
        <div className={styles.roomSub}>{room.sub}</div>
      </div>
    </div>
  );
}
