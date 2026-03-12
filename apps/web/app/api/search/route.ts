import { blogSource } from "@/lib/source";
import { allTools, getToolUrl } from "@/lib/tools";
import { createSearchAPI } from "fumadocs-core/search/server";

export const revalidate = false;

export const { staticGET: GET } = createSearchAPI("advanced", {
  indexes: [
    ...blogSource
      .getPages()
      .filter((page) => !page.data.draft) // Filter out draft posts
      .map((page) => {
        return {
          title: page.data.title,
          description: page.data.description,
          url: page.url,
          id: page.url,
          structuredData: page.data.structuredData,
          tag: "blog",
        };
      }),
    ...allTools.map((tool) => ({
      title: tool.title,
      description: tool.description,
      url: getToolUrl(tool),
      id: `tool-${tool.slug}`,
      structuredData: {
        headings: [] as { id: string; content: string }[],
        contents: [{ heading: undefined, content: tool.description }],
      },
      tag: "tool",
    })),
  ],
});
