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
              <Link href="/blog/tutorial">
                Tutorials <MoveRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link href="/blog/troubleshooting">
                Troubleshooting <MoveRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="gap-2">
              <Link href="/tools">
                Tools <MoveRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            All Posts <MoveRight className="w-4 h-4" />
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link
              href="https://github.com/testy-cool"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground"
            >
              GitHub
            </Link>
            <Link
              href="https://x.com/testy_cool"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground"
            >
              X
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
