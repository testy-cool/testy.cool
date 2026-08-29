import type { ReactNode } from "react";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions, linkItems } from "@/app/layout.config";
import { getLinks } from "fumadocs-ui/layouts/shared";
import { Header } from "@/components/header";
import { SocialIcons } from "@repo/ui/components/social-icons";
import SimpleFooter from "@/components/simple-footer";
import { EasterEgg } from "@/components/easter-egg";
import { SiteSidebar, type SidebarLink } from "@/components/site-sidebar";
import { getBlogPosts } from "@/lib/source";
import { getCategoryBySlug } from "@/lib/categories";

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

/** Only categories that actually have posts, so no sidebar link 404s. */
function getWritingLinks(): SidebarLink[] {
  const slugs = [
    ...new Set(
      getBlogPosts()
        .map((post) => post.slugs?.[0])
        .filter((slug): slug is string => Boolean(slug)),
    ),
  ].sort();

  return slugs.map((slug) => ({
    label: getCategoryBySlug(slug).label,
    href: `/blog/${slug}`,
  }));
}

/**
 * The site chrome: header, sidebar, dashed content column, footer, easter egg.
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
      <div className="container grid w-full flex-1 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <SiteSidebar writingItems={getWritingLinks()} />
        <div className="flex min-w-0 flex-col">
          <div className="home-children flex flex-1 flex-col divide-y divide-dashed divide-border/70 border-border/70 border-dashed sm:border-b dark:divide-border dark:border-border">
            {children}
          </div>
          <SimpleFooter navigation={footerNavigation} />
        </div>
      </div>
      <EasterEgg />
    </HomeLayout>
  );
}
