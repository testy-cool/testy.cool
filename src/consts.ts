export const SITE_VERSION = "0.0.1";
export const SITE_TITLE = "TestyCool";

export const NAVIGATION = [
  {
    label: "Posts",
    slug: "/",
    hotkey: "p",
  },
  {
    label: "About",
    slug: "/about",
    hotkey: "a",
  }
];

export const SOCIALS = [
  {
    icon: "github",
    label: "GitHub",
    url: "https://github.com/testy-cool",
  },
  {
    icon: "bluesky",
    label: "Bluesky",
    url: "https://bsky.app/profile/testycool.bsky.social",
  },
] as const;

export const CATEGORIES = [
  {
    label: "Notes",
    url: "/notes",
  },
  {
    label: "Links",
    url: "/links",
  },
  {
    label: "Posts",
    url: "/posts",
  },
  {
    label: "TIL",
    url: "/TIL",
  },
  {
    label: "Tools",
    url: "/tools",
  },
] as const;
