import { useEffect } from "react";

let activeLockCount = 0;

/**
 * Custom hook to lock body scrolling when a modal or dialog popup is open.
 * Uses reference counting so multiple open modals keep the lock active,
 * and body scrolling is only restored when ALL modals are closed.
 */
export function useBodyScrollLock(isOpen: boolean = true) {
  useEffect(() => {
    if (!isOpen) return;

    activeLockCount++;
    if (activeLockCount > 0) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      activeLockCount = Math.max(0, activeLockCount - 1);
      if (activeLockCount === 0) {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen]);
}

