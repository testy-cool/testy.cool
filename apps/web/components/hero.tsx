"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@repo/shadverse/components/button";
import { MoveRight } from "lucide-react";

const topics = ["LLMs", "agents", "automation", "tools"];
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
const SCRAMBLE_SPEED = 30; // ms per tick
const SETTLE_DELAY = 3; // ticks before each char locks in

export default function Hero({ postCount }: { postCount?: number }) {
  const [display, setDisplay] = useState(topics[0]);
  const indexRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const scrambleTo = useCallback((target: string) => {
    let tick = 0;
    const maxLen = Math.max(display.length, target.length);

    const step = () => {
      tick++;
      let result = "";
      let allSettled = true;

      for (let i = 0; i < maxLen; i++) {
        if (i < target.length) {
          // char locks in after enough ticks
          if (tick >= (i + 1) * SETTLE_DELAY) {
            result += target[i];
          } else {
            result += chars[Math.floor(Math.random() * chars.length)];
            allSettled = false;
          }
        }
      }

      setDisplay(result);

      if (!allSettled) {
        rafRef.current = window.setTimeout(step, SCRAMBLE_SPEED);
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
      if (rafRef.current) clearTimeout(rafRef.current);
    };
  }, [scrambleTo]);

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex flex-col items-center justify-center gap-3 py-12 lg:py-16">
          <h1 className="text-4xl md:text-6xl tracking-tight text-center font-bold">
            Mostly LLMs, mostly.
          </h1>
          <p className="max-w-xl text-center text-lg leading-relaxed text-fd-foreground/72 md:text-xl">
            Notes on{" "}
            <span className="inline-block min-w-[7ch] text-fd-primary font-medium font-mono">
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
