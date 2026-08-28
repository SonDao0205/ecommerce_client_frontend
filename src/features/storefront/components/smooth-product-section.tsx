"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface SmoothProductSectionProps {
  navigationKey: string;
  shouldScroll: boolean;
  children: ReactNode;
}

export function SmoothProductSection({
  navigationKey,
  shouldScroll,
  children,
}: SmoothProductSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!shouldScroll) return;

    const frame = window.requestAnimationFrame(() => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      sectionRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [navigationKey, shouldScroll]);

  return (
    <section ref={sectionRef} id="products" className="scroll-mt-32">
      {children}
    </section>
  );
}
