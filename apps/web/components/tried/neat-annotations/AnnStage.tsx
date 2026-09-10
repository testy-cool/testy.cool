import type { ReactNode } from "react";

/**
 * Room for annotations. The labels are absolutely positioned and reserve no
 * space, so in ordinary 28px prose they land on the lines above and below.
 * Anything annotated on this site sits inside one of these instead.
 */
export function AnnStage({ children }: { children: ReactNode }) {
  return (
    <div className="my-6 rounded-2xl border border-fd-border bg-fd-muted/40 px-10 py-16 text-center text-base leading-7">
      {children}
    </div>
  );
}

export default AnnStage;
