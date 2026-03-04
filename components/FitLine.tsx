"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function FitLine({
  children,
  minScale = 0.78, // 너무 작아지는 걸 방지(원하면 0.72~0.85 조절)
}: {
  children: React.ReactNode;
  minScale?: number;
}) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  const ro = useMemo(() => {
    if (typeof ResizeObserver === "undefined") return null;
    return new ResizeObserver(() => {
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner) return;

      const cw = outer.clientWidth;
      const iw = inner.scrollWidth;

      if (!cw || !iw) {
        setScale(1);
        return;
      }

      const s = Math.min(1, cw / iw);
      setScale(Math.max(minScale, s));
    });
  }, [minScale]);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const calc = () => {
      const cw = outer.clientWidth;
      const iw = inner.scrollWidth;
      if (!cw || !iw) {
        setScale(1);
        return;
      }
      const s = Math.min(1, cw / iw);
      setScale(Math.max(minScale, s));
    };

    calc();
    ro?.observe(outer);
    ro?.observe(inner);

    return () => {
      ro?.disconnect();
    };
  }, [ro, minScale]);

  return (
    <div
      ref={outerRef}
      style={{
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <div
        ref={innerRef}
        style={{
          display: "inline-flex",
          alignItems: "baseline",
          gap: 6,
          whiteSpace: "nowrap",
          transform: `scale(${scale})`,
          transformOrigin: "left center",
        }}
      >
        {children}
      </div>
    </div>
  );
}
