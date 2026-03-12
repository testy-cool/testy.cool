import type { ReactNode } from "react";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions, linkItems } from "@/app/layout.config";
import { getLinks } from "fumadocs-ui/layouts/shared";
import { Header } from "@/components/header";
import { SocialIcons } from "@repo/ui/components/social-icons";
import SimpleFooter from "@/components/simple-footer";

export default function Layout({ children }: { children: ReactNode }) {
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
      name: "Bluesky",
      href: "https://bsky.app/profile/testycool.bsky.social",
      icon: SocialIcons.bluesky,
    },
  ];

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
        {children}
      </div>
      <SimpleFooter navigation={footerNavigation} />
    </HomeLayout>
  );
}
