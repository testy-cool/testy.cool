"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@repo/shadverse/components/button";
import { MoveRight } from "lucide-react";

const topics = ["LLMs", "agents", "automation", "tools"];

export default function Hero({ postCount }: { postCount?: number }) {
  const [topicIndex, setTopicIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setTopicIndex((prev) => (prev + 1) % topics.length);
        setVisible(true);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex flex-col items-center justify-center gap-5 py-12 lg:py-16">
          <h1 className="text-4xl md:text-6xl tracking-tight text-center font-bold">
            Mostly LLMs, mostly.
          </h1>
          <p className="max-w-xl text-center text-lg leading-relaxed text-fd-foreground/72 md:text-xl">
            Notes on{" "}
            <span
              className="inline-block min-w-[7ch] text-fd-primary font-medium transition-all duration-300 ease-in-out"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(4px)",
              }}
            >
              {topics[topicIndex]}
            </span>
            , mostly ramblings.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href="/blog">
                Browse notes <MoveRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="gap-2">
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
