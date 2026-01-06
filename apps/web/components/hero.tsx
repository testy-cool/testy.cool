import Link from "next/link";
import { Button } from "@repo/shadverse/components/button";
import { SocialIcons } from "@repo/ui/components/social-icons";
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
          <div className="flex flex-row gap-3">
            <Link href="/blog">
              <Button size="lg" className="gap-2">
                Read Posts <MoveRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="https://x.com/testy_cool" target="_blank">
              <Button size="lg" variant="outline" className="gap-2">
                <SocialIcons.x className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="https://github.com/testy-cool" target="_blank">
              <Button size="lg" variant="outline" className="gap-2">
                <SocialIcons.github className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
