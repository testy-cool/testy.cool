import Link from "next/link";
import { Button } from "@repo/shadverse/components/button";
import { MoveRight } from "lucide-react";

export default function Hero() {
  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex flex-col items-center justify-center gap-5 py-12 lg:py-16">
          <h1 className="text-4xl md:text-6xl tracking-tight text-center font-bold">
            Mostly LLMs, mostly.
          </h1>
          <p className="max-w-xl text-center text-lg leading-relaxed text-fd-foreground/72 md:text-xl">
            Notes and ramblings about LLMs, automation and dev.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href="/blog">
                All Posts <MoveRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="gap-2">
              <Link href="/tools">
                Tools <MoveRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
          <p className="max-w-2xl text-center text-sm text-fd-foreground/62">
            Most of the site is blog posts. Tutorials and troubleshooting are
            the main buckets right now.
          </p>
        </div>
      </div>
    </div>
  );
}
