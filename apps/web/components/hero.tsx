"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@repo/shadverse/components/button";
import { MoveRight } from "lucide-react";

const topics = ["LLMs", "agents", "automation", "tools"];
const firstTopic = topics[0] ?? "LLMs";
// The rotating word sits in a fixed slot so the tagline never reflows. The
// slot fits the longest topic plus its trailing comma, with slack so a wide
// proportional glyph cannot overflow the box.
const slotChars = Math.max(...topics.map((topic) => topic.length)) + 2;
const chars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
const SCRAMBLE_SPEED = 30;
const SETTLE_DELAY = 3;

export default function Hero() {
  const [display, setDisplay] = useState(firstTopic);
  const [settled, setSettled] = useState(true);
  const indexRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);

  const scrambleTo = useCallback((target: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);

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
        settleTimerRef.current = window.setTimeout(
          () => setSettled(false),
          600,
        );
      }
    };

    step();
  }, []);

  useEffect(() => {
    // Keep the first word and never cycle when the visitor asked for less motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let interval: number | null = null;
    const start = () => {
      if (interval !== null) return;
      interval = window.setInterval(() => {
        indexRef.current = (indexRef.current + 1) % topics.length;
        scrambleTo(topics[indexRef.current] ?? firstTopic);
      }, 2500);
    };
    const stop = () => {
      if (interval !== null) {
        clearInterval(interval);
        interval = null;
      }
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, [scrambleTo]);

  return (
    <div className="w-full">
      <style jsx global>{`
        @keyframes settle-glow {
          0% {
            text-shadow: 0 0 24px
              color-mix(in srgb, currentColor 45%, transparent);
          }
          50% {
            text-shadow: 0 0 40px
              color-mix(in srgb, currentColor 65%, transparent);
          }
          100% {
            text-shadow: 0 0 24px
              color-mix(in srgb, currentColor 45%, transparent);
          }
        }
      `}</style>
      <div>
        <div className="flex flex-col items-start gap-5 py-12 lg:py-16">
          <h1 className="animate-fade-slide-in text-3xl font-bold tracking-tight text-fd-foreground sm:text-5xl lg:text-6xl">
            Mostly{" "}
            <span
              className="inline-block max-w-full text-fd-primary"
              style={{
                width: `${slotChars}ch`,
                textAlign: "left",
                animation: settled ? "settle-glow 0.5s ease" : "none",
              }}
            >
              {display},
            </span>
            <br />
            mostly.
          </h1>
          <p
            className="animate-fade-slide-in max-w-2xl text-base leading-7 text-fd-muted-foreground md:text-lg"
            style={{ animationDelay: "90ms" }}
          >
            Notes on LLMs, agents, automation and tools. Mostly written for
            myself. There are a few tools here too.
          </p>
          <div
            className="animate-fade-slide-in flex flex-wrap items-center gap-3"
            style={{ animationDelay: "180ms" }}
          >
            <Button
              asChild
              size="lg"
              className="gap-2 px-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <Link href="/blog">
                Browse notes <MoveRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="gap-2 px-6 transition-shadow hover:shadow-md"
            >
              <Link href="/tools">
                Tools <MoveRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
