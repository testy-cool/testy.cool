"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@repo/shadverse/components/button";
import { MoveRight } from "lucide-react";

const topics = ["LLMs", "agents", "automation", "tools"];
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
const SCRAMBLE_SPEED = 30;
const SETTLE_DELAY = 3;

export default function Hero({ postCount }: { postCount?: number }) {
  const [display, setDisplay] = useState(topics[0]);
  const [targetLen, setTargetLen] = useState(topics[0].length);
  const [settled, setSettled] = useState(true);
  const indexRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);

  const scrambleTo = useCallback((target: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);

    setTargetLen(target.length);
    setSettled(false);
    let tick = 0;

    const step = () => {
      tick++;
      let result = "";
      let allSettled = true;

      for (let i = 0; i < target.length; i++) {
        if (tick >= (i + 1) * SETTLE_DELAY) {
          result += target[i];
        } else {
          result += chars[Math.floor(Math.random() * chars.length)];
          allSettled = false;
        }
      }

      setDisplay(result);

      if (!allSettled) {
        timerRef.current = window.setTimeout(step, SCRAMBLE_SPEED);
      } else {
        setSettled(true);
        // Reset settled after the glow fades
        settleTimerRef.current = window.setTimeout(() => setSettled(false), 600);
      }
    };

    step();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % topics.length;
      scrambleTo(topics[indexRef.current]);
    }, 2500);

    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, [scrambleTo]);

  return (
    <div className="w-full">
      <style jsx global>{`
        @keyframes settle-glow {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }
      `}</style>
      <div className="container mx-auto">
        <div className="flex flex-col items-center justify-center gap-3 py-12 lg:py-16">
          <h1 className="text-4xl md:text-6xl tracking-tight text-center font-bold">
            Mostly LLMs, mostly.
          </h1>
          <p className="max-w-xl text-center text-lg leading-relaxed text-fd-foreground/72 md:text-xl">
            Notes on{" "}
            <span
              className="inline-block text-fd-primary font-medium font-mono"
              style={{
                width: `${targetLen}ch`,
                transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                textAlign: "left",
                animation: settled ? "settle-glow 0.5s ease" : "none",
              }}
            >
              {display}
            </span>
            , mostly ramblings.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2 hover:shadow-md transition-all">
              <Link href="/blog">
                Browse notes <MoveRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 hover:shadow-md transition-all">
              <Link href="/tools">
                Tools <MoveRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
          {postCount != null && (
            <p className="max-w-2xl text-center text-sm text-fd-foreground/62">
              {postCount} notes so far.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
