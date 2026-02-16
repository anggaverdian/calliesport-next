"use client";

import { useEffect } from "react";

const EDGE_THRESHOLD = 30; // pixels from screen edge

export default function EdgeSwipeBlocker() {
  useEffect(() => {
    let edgeTouch = false;
    let startX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      const x = touch.clientX;
      const screenWidth = window.innerWidth;

      // Track if touch started near screen edge
      edgeTouch =
        x <= EDGE_THRESHOLD || x >= screenWidth - EDGE_THRESHOLD;
      startX = x;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!edgeTouch) return;

      const touch = e.touches[0];
      if (!touch) return;

      const deltaX = Math.abs(touch.clientX - startX);

      // Only block if it's a horizontal swipe (not a tap)
      if (deltaX > 10) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return null;
}
