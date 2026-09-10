import {
  defineCollections,
  defineConfig,
  frontmatterSchema,
} from "fumadocs-mdx/config";
import { z } from "zod";
import { transformerTwoslash } from "fumadocs-twoslash";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import {
  transformerRemoveNotationEscape,
  transformerNotationHighlight,
  transformerNotationFocus,
  transformerMetaHighlight,
} from "@shikijs/transformers";
import { remarkInstall } from "fumadocs-docgen";
import { rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins";
import { bundledLanguages, type BundledLanguage } from "shiki";
import { mdtaskGrammar } from "./lib/shiki/mdtask";

export const blog = defineCollections({
  type: "doc",
  dir: "content/blog",
  schema: frontmatterSchema.extend({
    // Optional so a note jotted by hand still builds. Kept in step with
    // blogConstants.defaultAuthorName, which is not imported here because
    // blog-configuration.tsx pulls in React components.
    author: z.string().optional().default("testy.cool"),
    date: z
      .string()
      .or(z.date())
      .transform((value, context) => {
        try {
          return new Date(value);
        } catch {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid date",
          });
          return z.NEVER;
        }
      }),
    tags: z.array(z.string()).optional(),
    resumeSignal: z.enum(["featured", "supporting", "none"]).optional(),
    updated: z
      .string()
      .or(z.date())
      .transform((value, context) => {
        try {
          return new Date(value);
        } catch {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid date",
          });
          return z.NEVER;
        }
      })
      .optional(),
    image: z.string().optional(),
    draft: z.boolean().optional().default(false),
    // Open list, not an enum: a Tried note can name a new kind of thing.
    kind: z.string().optional(),
    series: z.string().optional(),
    seriesPart: z.number().optional(),
  }),
});

export default defineConfig({
  lastModifiedTime: "git",
  mdxOptions: {
    providerImportSource: "@/mdx-components",
    // The default list also indexes mdxJsxFlowElement, which put component
    // names like "ClampCalculator" into the search index as content.
    remarkStructureOptions: {
      types: ["heading", "paragraph", "blockquote", "tableCell"],
    },
    rehypeCodeOptions: {
      inline: "tailing-curly-colon",
      // Setting langs replaces the default list, so the bundled ones come too.
      langs: [
        ...(Object.keys(bundledLanguages) as BundledLanguage[]),
        mdtaskGrammar,
      ],
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      transformers: [
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        transformerTwoslash(),
        transformerRemoveNotationEscape(),
        transformerNotationFocus(),
        transformerMetaHighlight(),
      ],
    },
    remarkPlugins: [remarkMath, remarkInstall],
    rehypePlugins: (v) => [rehypeKatex, ...v],
  },
});
