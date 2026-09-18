import { useState } from "react";
import { controllerRef } from "@/controller/controllerRef";
import { useGallery } from "@/store/useGallery";
import { useGalleryStore } from "@/store/GalleryStoreContext";
import styles from "@/overlay/overlay.module.css";
import type { CompiledSpace, CompiledRoom } from "@/space/types";

function IndexButton({
  room,
  active,
  onClick,
}: {
  room: CompiledRoom;
  active: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const opacity = active ? 1 : hover ? 0.8 : 0.38;
  return (
    <button
      className={styles.indexButton}
      style={{ opacity }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      {room.name}
    </button>
  );
}

function GuestbookButton() {
  const store = useGalleryStore();
  const open = useGallery((s) => s.guestbookOpen);
  const [hover, setHover] = useState(false);
  const opacity = open ? 1 : hover ? 0.8 : 0.38;
  return (
    <button
      className={styles.indexButton}
      style={{ opacity }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => store.setState({ guestbookOpen: !open, messageOpen: false })}
    >
      Guestbook
    </button>
  );
}

function MessageButton() {
  const store = useGalleryStore();
  const open = useGallery((s) => s.messageOpen);
  const [hover, setHover] = useState(false);
  const opacity = open ? 1 : hover ? 0.8 : 0.38;
  return (
    <button
      className={styles.indexButton}
      style={{ opacity }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => store.setState({ messageOpen: !open, guestbookOpen: false })}
    >
      Message
    </button>
  );
}

export default function RoomIndex({ compiled }: { compiled: CompiledSpace }) {
  const roomId = useGallery((s) => s.roomId);
  const rooms = Object.values(compiled.roomById);

  return (
    <div className={styles.index}>
      {rooms.map((r) => (
        <IndexButton
          key={r.id}
          room={r}
          active={r.id === roomId}
          onClick={() => controllerRef.current?.gotoRoom(r.id)}
        />
      ))}
      <GuestbookButton />
      <MessageButton />
    </div>
  );
}
