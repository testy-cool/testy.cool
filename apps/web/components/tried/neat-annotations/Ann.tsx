import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./neat-annotations.css";

// One variable woff2 from the Google Fonts CSS API, latin subset, covering the
// two weights the library uses. OFL notice sits next to it in fonts/.
const shantellSans = localFont({
  src: "./fonts/ShantellSans-Latin.woff2",
  weight: "400 500",
  style: "normal",
  display: "swap",
  variable: "--font-shantell-sans",
  // Only the Tried note about this library needs it.
  preload: false,
  fallback: ["cursive"],
});

export type AnnDirection = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";
export type AnnColor =
  | "amber"
  | "blue"
  | "green"
  | "red"
  | "purple"
  | "rainbow";

export interface AnnProps {
  /** The handwritten label. Leave it off for a plain highlight. */
  note?: string;
  /** Where the label and arrow sit relative to the target. Defaults to north. */
  dir?: AnnDirection;
  color?: AnnColor;
  /** Drop the highlighter background and keep only the arrow and label. */
  noMark?: boolean;
  children: ReactNode;
}

/**
 * A neat-annotations target. Pure CSS, no JavaScript: the arrow and the label
 * are ::before and ::after on this span, so they reserve no layout space.
 * Give it room with AnnStage.
 */
export function Ann({ note, dir = "n", color, noMark, children }: AnnProps) {
  const classes = [
    "ann",
    `ann-${dir}`,
    color ? `ann-${color}` : null,
    noMark ? "ann-no-mark" : null,
    shantellSans.variable,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classes}
      data-note={note}
      style={{ ["--ann-font" as string]: `var(--font-shantell-sans), cursive` }}
    >
      {children}
    </span>
  );
}

export default Ann;

// Deliberately not registered in mdx-components.tsx, and route-scoping the CSS
// is not possible here either. Measured on 2026-09-10: fumadocs-mdx generates
// .source/index.ts with a static import of every .mdx file, so any page that
// reads the post index pulls this module's stylesheet into its chunk. The
// stylesheet is its own 8.2 KB chunk rather than part of the 218 KB global one,
// and the font is preload: false so it downloads only where a label renders.
// Registering in the shared MDX map on top of that would add nothing but noise.
