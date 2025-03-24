import sitemap from "@astrojs/sitemap";
import {
  transformerMetaHighlight,
  transformerMetaWordHighlight,
} from "@shikijs/transformers";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import { defineConfig } from "astro/config";

// Custom plugin to handle Obsidian-style links and images
function remarkObsidianCustom() {
  return (tree) => {
    function visit(node) {
      // Handle text nodes
      if (node.type === 'text' && typeof node.value === 'string') {
        // Convert [[link|text]] to [text](link)
        node.value = node.value.replace(/\[\[(https?:\/\/[^\|]+)\|([^\]]+)\]\]/g, '[$2]($1)');
        // Convert [[link]] to [link](link)
        node.value = node.value.replace(/\[\[(https?:\/\/[^\]]+)\]\]/g, '[$1]($1)');
      }

      // Handle paragraphs that might contain image/video syntax
      if (node.type === 'paragraph' && node.children) {
        const newChildren = [];
        for (const child of node.children) {
          if (child.type === 'text' && typeof child.value === 'string') {
            // Match ![[file]] syntax
            const matches = child.value.match(/!\[\[([^\]]+)\]\]/g);
            if (matches) {
              for (const match of matches) {
                const path = match.slice(3, -2); // Remove ![[]]
                const finalPath = path.startsWith('/') ? path : `/src/images/${path}`;
                
                if (finalPath.toLowerCase().endsWith('.mp4')) {
                  // Create a raw HTML node for videos using our Video component
                  newChildren.push({
                    type: 'html',
                    value: `<Video src="${finalPath}" />`
                  });
                } else {
                  // Create an image node
                  newChildren.push({
                    type: 'image',
                    url: finalPath,
                    alt: path
                  });
                }
              }
            } else {
              newChildren.push(child);
            }
          } else {
            newChildren.push(child);
          }
        }
        node.children = newChildren;
      }

      // Recursively process all children
      if (node.children) {
        for (const child of node.children) {
          visit(child);
        }
      }
    }

    visit(tree);
  };
}

export default defineConfig({
  site: "https://testy.cool",
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      lastmod: new Date(),
      changefreq: 'weekly',
      priority: 0.7,
      filter: (page) => !page.includes('draft'),
    }),
    icon()
  ],
  markdown: {
    shikiConfig: {
      theme: "github-dark-default",
      defaultColor: false,
      transformers: [
        transformerMetaHighlight(),
        transformerMetaWordHighlight(),
      ],
    },
    remarkPlugins: [remarkObsidianCustom],
  },
});
