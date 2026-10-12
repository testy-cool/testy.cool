import { cva } from "class-variance-authority";

/** Shared appearance for category links and category filter controls. */
export const categoryPillVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-3 py-1 text-[13px] font-medium transition-colors",
  {
    variants: {
      active: {
        true: "border-fd-primary/30 bg-fd-primary/10 text-fd-primary hover:bg-fd-primary/10 hover:text-fd-primary data-[state=on]:border-fd-primary/30 data-[state=on]:bg-fd-primary/10 data-[state=on]:text-fd-primary",
        false:
          "border-fd-border bg-fd-background/85 text-fd-foreground/72 hover:border-fd-primary/40 hover:bg-fd-background/85 hover:text-fd-foreground",
      },
    },
    defaultVariants: { active: false },
  },
);
