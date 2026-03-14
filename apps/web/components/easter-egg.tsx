"use client";
import { useEffect, useState, useCallback } from "react";

const CODE = "claudiu";

export function EasterEgg() {
  const [input, setInput] = useState("");
  const [show, setShow] = useState(false);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (show) return;
      const next = (input + e.key).slice(-CODE.length);
      setInput(next);
      if (next === CODE) setShow(true);
    },
    [input, show],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  if (!show) return null;

  return (
    <div
      onClick={() => setShow(false)}
      className="fixed inset-0 z-[9999] flex cursor-pointer items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="animate-in fade-in zoom-in rounded-2xl border border-fd-border bg-fd-card px-10 py-8 text-center shadow-2xl">
        <p className="text-4xl font-bold text-fd-primary">
          Hi Claudiu! 👋
        </p>
        <p className="mt-2 text-fd-muted-foreground text-sm">
          You found the secret. Click to dismiss.
        </p>
      </div>
    </div>
  );
}
