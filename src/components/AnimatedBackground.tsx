"use client";

import { useEffect, useRef } from "react";

export default function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create bubbles
    const createBubble = () => {
      const bubble = document.createElement("div");
      bubble.className = "bubble";

      // Random size
      const size = Math.random() * 100 + 20;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;

      // Random position
      bubble.style.left = `${Math.random() * 100}%`;
      bubble.style.top = `${Math.random() * 100}%`;

      // Random animation delay
      bubble.style.animationDelay = `${Math.random() * 5}s`;

      // Random color
      const colors = [
        "rgba(37, 99, 235, 0.1)",
        "rgba(124, 58, 237, 0.1)",
        "rgba(6, 182, 212, 0.1)",
      ];
      bubble.style.background =
        colors[Math.floor(Math.random() * colors.length)];

      container.appendChild(bubble);

      // Remove bubble after animation completes
      setTimeout(() => {
        if (bubble.parentNode === container) {
          container.removeChild(bubble);
        }
      }, 8000);
    };

    // Create initial bubbles
    for (let i = 0; i < 15; i++) {
      createBubble();
    }

    // Create new bubbles periodically
    const interval = setInterval(createBubble, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none -z-10"
    />
  );
}
