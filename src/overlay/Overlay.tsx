import RoomTag from "@/overlay/RoomTag";
import RoomIndex from "@/overlay/RoomIndex";
import Hint from "@/overlay/Hint";
import Tooltip from "@/overlay/Tooltip";
import CaptionPanel from "@/overlay/CaptionPanel";
import Guestbook from "@/overlay/Guestbook";
import TitleCard from "@/overlay/TitleCard";
import Veil from "@/overlay/Veil";
import styles from "@/overlay/overlay.module.css";
import type { CompiledSpace } from "@/space/types";

export default function Overlay({ compiled }: { compiled: CompiledSpace }) {
  return (
    <>
      <div className={styles.ui}>
        <RoomTag compiled={compiled} />
        <RoomIndex compiled={compiled} />
        <Hint />
        <Tooltip />
        <CaptionPanel />
      </div>
      <Guestbook />
      <TitleCard compiled={compiled} />
      <Veil />
    </>
  );
}
