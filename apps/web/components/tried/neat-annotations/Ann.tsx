import type { ReactNode } from "react";

// The stylesheet and the font are static files under public/, linked from the
// component with React 19's hoisted <link precedence>. Importing the CSS from
// this module instead put it on every blog page: fumadocs-mdx generates a
// source index that statically imports every note, so any page reading the
// index pulled the chunk. Measured 2026-09-10, 17 of 29 pages. As plain links
// the files reach only the pages that render an annotation.
const BASE = "/tried/neat-annotations";

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
  /** Where the arrow points. Defaults to north, which parks the label below. */
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
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <link rel="stylesheet" href={`${BASE}/neat-annotations.css`} precedence="tried" />
      <link rel="stylesheet" href={`${BASE}/shantell-sans.css`} precedence="tried" />
      <span className={classes} data-note={note}>
        {children}
      </span>
    </>
  );
}

export default Ann;
