"use client";
import { useEffect, useRef, type RefObject } from "react";

/**
 * Calls `onDismiss` when the user presses Escape or presses the pointer
 * outside `ref`. Listeners are only attached while `active` is true, so a
 * closed popover costs nothing.
 *
 * `onDismiss` may change identity every render; it is read through a ref so
 * the listeners are not torn down and re-added each time.
 */
export function useDismiss(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onDismiss: (reason: "outside" | "escape") => void,
) {
  const dismissRef = useRef(onDismiss);
  useEffect(() => {
    dismissRef.current = onDismiss;
  });

  useEffect(() => {
    if (!active) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) dismissRef.current("outside");
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissRef.current("escape");
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, active]);
}
