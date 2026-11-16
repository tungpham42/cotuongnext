"use client";
import { useSyncExternalStore } from "react";
import { isMuted, setMuted, subscribeMuted, unlockAudio } from "@/lib/sound";
import { VolumeOffIcon, VolumeOnIcon } from "./Icons";

export default function SoundToggle() {
  const muted = useSyncExternalStore(subscribeMuted, isMuted, () => false);
  const label = muted ? "Unmute sound" : "Mute sound";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={muted}
      className="rounded-lg p-1.5 text-lg text-stone-300 hover:bg-stone-800 hover:text-amber-300"
      onClick={() => {
        unlockAudio();
        setMuted(!muted);
      }}
    >
      {muted ? <VolumeOffIcon /> : <VolumeOnIcon />}
    </button>
  );
}
