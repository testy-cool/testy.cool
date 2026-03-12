import { Icons } from "@/components/icons";
import type { BaseLayoutProps, LinkItemType } from "fumadocs-ui/layouts/shared";

export const title = "testy.cool — Mostly LLMs, mostly.";
export const description =
  "Notes on LLMs, agents, automation and development. Mostly written for myself. There are a few tools here too.";
export const owner = "testy.cool";
/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <>
        <img
          src="/avatar.webp"
          width={28}
          height={28}
          alt="testy.cool logo"
          className="rounded-full"
        />{" "}
        testy.cool
      </>
    ),
  },
  links: [
    {
      text: "Docs",
      url: "/docs",
    },
  ],
};

export const linkItems: LinkItemType[] = [
  {
    icon: <Icons.posts />,
    text: "Blog",
    url: "/blog",
    active: "nested-url",
  },
  {
    icon: <Icons.settings />,
    text: "Tools",
    url: "/tools",
    active: "nested-url",
  },
  {
    icon: <Icons.user />,
    text: "About",
    url: "/about",
    active: "url",
  },
];

export const postsPerPage = 5;
