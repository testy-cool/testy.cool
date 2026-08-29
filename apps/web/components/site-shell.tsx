import type { ReactNode } from "react";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions, linkItems } from "@/app/layout.config";
import { getLinks } from "fumadocs-ui/layouts/shared";
import { Header } from "@/components/header";
import { SocialIcons } from "@repo/ui/components/social-icons";
import SimpleFooter from "@/components/simple-footer";
import { PageTransition } from "@/components/page-transition";
import { EasterEgg } from "@/components/easter-egg";

const footerNavigation = [
  {
    name: "X",
    href: "https://x.com/testy_cool",
    icon: SocialIcons.x,
  },
  {
    name: "GitHub",
    href: "https://github.com/testy-cool",
    icon: SocialIcons.github,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/vladeduard/",
    icon: SocialIcons.linkedIn,
  },
  {
    name: "Bluesky",
    href: "https://bsky.app/profile/testycool.bsky.social",
    icon: SocialIcons.bluesky,
  },
];

/**
 * The site chrome: header, dashed content column, footer, easter egg.
 * Used by the (home) route group layout and by the root not-found page,
 * which lives outside that group and would otherwise render bare.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <HomeLayout
      {...baseOptions}
      nav={{
        component: (
          <Header
            finalLinks={getLinks(linkItems, baseOptions.githubUrl)}
            {...baseOptions}
          />
        ),
      }}
      className="pt-0 home-layout"
    >
      <div className="home-children flex flex-1 flex-col divide-y divide-dashed divide-border/70 border-border/70 border-dashed sm:border-b dark:divide-border dark:border-border">
        <PageTransition>{children}</PageTransition>
      </div>
      <SimpleFooter navigation={footerNavigation} />
      <EasterEgg />
    </HomeLayout>
  );
}
