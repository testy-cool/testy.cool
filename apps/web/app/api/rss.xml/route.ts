import { Feed } from "feed";
import { getBlogPosts } from "@/lib/source";

export const dynamic = "force-static";
export const revalidate = false;

const siteUrl = "https://testy.cool";

export function GET() {
  const feed = new Feed({
    title: "testy.cool",
    description:
      "Notes on LLMs, agents, automation and development.",
    id: siteUrl,
    link: siteUrl,
    language: "en",
    copyright: `${new Date().getFullYear()} testy.cool`,
    feedLinks: {
      rss2: `${siteUrl}/api/rss.xml`,
    },
  });

  const posts = getBlogPosts()
    .filter((post) => !post.data.draft)
    .sort((a, b) => {
      const dateA = new Date(a.data.date);
      const dateB = new Date(b.data.date);
      return dateB.getTime() - dateA.getTime();
    });

  for (const post of posts) {
    const url = `${siteUrl}${post.url}`;

    feed.addItem({
      title: post.data.title,
      id: url,
      link: url,
      description: post.data.description ?? "",
      date: new Date(post.data.date),
      author: [{ name: post.data.author ?? "testy.cool" }],
      category: (post.data.tags ?? []).map((tag: string) => ({ name: tag })),
    });
  }

  return new Response(feed.rss2(), {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
