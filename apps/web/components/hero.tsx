import Link from "next/link";
import { Button } from "@repo/shadverse/components/button";
import { MoveRight } from "lucide-react";

export default function Hero() {
  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex gap-6 py-16 lg:py-24 items-center justify-center flex-col">
          <h1 className="text-4xl md:text-6xl tracking-tight text-center font-bold">
            Mostly LLMs, mostly.
          </h1>
          <p className="text-lg md:text-xl leading-relaxed text-muted-foreground max-w-xl text-center">
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
          <p className="max-w-2xl text-center text-sm text-muted-foreground">
            <Link
              href="/blog/tutorial"
              className="font-medium text-foreground transition-colors hover:text-muted-foreground"
            >
              Tutorials
            </Link>
            {" and "}
            <Link
              href="/blog/troubleshooting"
              className="font-medium text-foreground transition-colors hover:text-muted-foreground"
            >
              Troubleshooting
            </Link>
            {" are the main buckets right now."}
          </p>
        </div>
      </div>
    </div>
  );
}
