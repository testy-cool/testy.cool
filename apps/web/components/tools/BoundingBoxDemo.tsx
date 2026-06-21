"use client";

import { useState } from "react";

type Element = {
  label: string;
  type: string;
  box_2d: [number, number, number, number];
  text?: string;
};

const TYPE_COLORS: Record<string, string> = {
  container: "#6366f1",
  section: "#8b5cf6",
  card: "#a78bfa",
  navbar: "#f59e0b",
  sidebar: "#f97316",
  footer: "#78716c",
  header: "#eab308",
  text: "#22d3ee",
  button: "#f43f5e",
  input: "#fb923c",
  image: "#10b981",
  icon: "#34d399",
  badge: "#e879f9",
  divider: "#94a3b8",
  link: "#3b82f6",
  unknown: "#6b7280",
};

const EXAMPLE: { image: string; label: string; elements: Element[] } = {
  image: "/images/blog/bounding-boxes/testy-cool-homepage.png",
  label: "testy.cool /blog",
  elements: [{"label":"navbar","type":"navbar","box_2d":[0,0,50,1000]},{"label":"logo","type":"container","box_2d":[13,18,36,117],"text":"testy.cool"},{"label":"nav_links","type":"container","box_2d":[18,135,32,316]},{"label":"blog_link","type":"link","box_2d":[18,135,32,163],"text":"Blog"},{"label":"tools_link","type":"link","box_2d":[18,179,32,212],"text":"Tools"},{"label":"stack_link","type":"link","box_2d":[18,228,32,264],"text":"Stack"},{"label":"about_link","type":"link","box_2d":[18,281,32,316],"text":"About"},{"label":"search_input","type":"input","box_2d":[8,706,42,908],"text":"Search"},{"label":"theme_toggle","type":"button","box_2d":[8,916,42,964]},{"label":"header_section","type":"header","box_2d":[98,342,197,658]},{"label":"breadcrumb","type":"text","box_2d":[98,450,112,537],"text":"Home > Blog"},{"label":"page_title","type":"text","box_2d":[131,427,161,572],"text":"Blog Posts"},{"label":"page_subtitle","type":"text","box_2d":[177,342,197,658],"text":"Notes and ramblings, typically about LLMs."},{"label":"post_1_container","type":"section","box_2d":[310,99,575,888]},{"label":"post_1_badges","type":"container","box_2d":[310,99,328,397]},{"label":"badge_agents","type":"badge","box_2d":[310,99,328,148],"text":"agents"},{"label":"badge_commerce","type":"badge","box_2d":[310,155,328,221],"text":"commerce"},{"label":"badge_protocols","type":"badge","box_2d":[310,228,328,293],"text":"protocols"},{"label":"badge_ai","type":"badge","box_2d":[310,300,328,323],"text":"ai"},{"label":"badge_standards","type":"badge","box_2d":[310,330,328,397],"text":"standards"},{"label":"post_1_title","type":"text","box_2d":[344,99,407,460],"text":"UCP - How to Actually Make Money With It"},{"label":"post_1_description","type":"text","box_2d":[428,99,490,460]},{"label":"post_1_meta","type":"text","box_2d":[516,99,531,386]},{"label":"post_1_read_more","type":"link","box_2d":[556,99,573,187],"text":"Read more ->"},{"label":"post_1_card","type":"card","box_2d":[328,513,557,888]},{"label":"post_2_container","type":"section","box_2d":[673,99,915,888]},{"label":"post_2_badges","type":"container","box_2d":[673,99,691,275]},{"label":"badge_claude_code","type":"badge","box_2d":[673,99,691,177],"text":"claude-code"},{"label":"badge_ssh","type":"badge","box_2d":[673,184,691,217],"text":"ssh"},{"label":"badge_devops","type":"badge","box_2d":[673,224,691,275],"text":"devops"},{"label":"post_2_title","type":"text","box_2d":[707,99,770,460],"text":"Setting Up SSH for Claude Code"},{"label":"post_2_description","type":"text","box_2d":[791,99,830,460]},{"label":"post_2_meta","type":"text","box_2d":[856,99,871,384]},{"label":"post_2_read_more","type":"link","box_2d":[896,99,913,187],"text":"Read more ->"},{"label":"post_2_card","type":"card","box_2d":[681,513,909,888]}],
};

function BoxOverlay({
  el,
  hovered,
  onHover,
}: {
  el: Element;
  hovered: boolean;
  onHover: (label: string | null) => void;
}) {
  const [yMin, xMin, yMax, xMax] = el.box_2d;
  const color = TYPE_COLORS[el.type] || TYPE_COLORS.unknown;

  return (
    <div
      onMouseEnter={() => onHover(el.label)}
      onMouseLeave={() => onHover(null)}
      className="absolute transition-opacity"
      style={{
        top: `${yMin / 10}%`,
        left: `${xMin / 10}%`,
        width: `${(xMax - xMin) / 10}%`,
        height: `${(yMax - yMin) / 10}%`,
        border: `2px solid ${color}`,
        backgroundColor: hovered ? `${color}33` : `${color}11`,
        zIndex: hovered ? 20 : 10,
      }}
    >
      <span
        className="absolute -top-5 left-0 whitespace-nowrap rounded px-1 py-0.5 text-[10px] font-medium leading-none text-white"
        style={{ backgroundColor: color, opacity: hovered ? 1 : 0.7 }}
      >
        {el.label}
      </span>
    </div>
  );
}

export function BoundingBoxDemo() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showBoxes, setShowBoxes] = useState(true);

  const filtered = EXAMPLE.elements.filter(
    (el) => !filterType || el.type === filterType,
  );
  const typeCounts = EXAMPLE.elements.reduce(
    (acc, el) => ({ ...acc, [el.type]: (acc[el.type] || 0) + 1 }),
    {} as Record<string, number>,
  );

  const hoveredEl = EXAMPLE.elements.find((el) => el.label === hovered);

  return (
    <div className="not-prose my-8 rounded-xl border border-fd-border bg-fd-card">
      <div className="flex items-center justify-between border-b border-fd-border px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-fd-foreground">
            Detected Elements - {EXAMPLE.label}
          </h3>
          <p className="text-xs text-fd-muted-foreground">
            {EXAMPLE.elements.length} elements detected by Gemini 3 Flash in a
            single pass. Hover to inspect.
          </p>
        </div>
        <button
          onClick={() => setShowBoxes(!showBoxes)}
          className="rounded-lg border border-fd-border px-3 py-1.5 text-xs font-medium text-fd-muted-foreground transition-colors hover:bg-fd-muted/30"
        >
          {showBoxes ? "Hide boxes" : "Show boxes"}
        </button>
      </div>

      <div className="p-4">
        <div className="relative overflow-hidden rounded-lg border border-fd-border">
          <img
            src={EXAMPLE.image}
            alt={`Screenshot of ${EXAMPLE.label}`}
            className="block w-full"
            draggable={false}
          />
          {showBoxes &&
            filtered.map((el) => (
              <BoxOverlay
                key={`${el.label}-${el.box_2d.join(",")}`}
                el={el}
                hovered={hovered === el.label}
                onHover={setHovered}
              />
            ))}
        </div>

        {hoveredEl && (
          <div className="mt-2 rounded-lg border border-fd-border bg-fd-muted/30 px-3 py-2 text-xs">
            <span className="font-semibold text-fd-foreground">
              {hoveredEl.label}
            </span>
            <span className="mx-2 text-fd-muted-foreground">
              type: {hoveredEl.type}
            </span>
            <span className="text-fd-muted-foreground">
              box: [{hoveredEl.box_2d.join(", ")}]
            </span>
            {hoveredEl.text && (
              <span className="ml-2 text-fd-muted-foreground">
                text: &quot;{hoveredEl.text}&quot;
              </span>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterType(null)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              !filterType
                ? "bg-fd-primary text-fd-primary-foreground"
                : "border border-fd-border text-fd-muted-foreground hover:bg-fd-muted/30"
            }`}
          >
            All ({EXAMPLE.elements.length})
          </button>
          {Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => (
              <button
                key={type}
                onClick={() =>
                  setFilterType(filterType === type ? null : type)
                }
                className="rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
                style={{
                  backgroundColor:
                    filterType === type
                      ? TYPE_COLORS[type] || TYPE_COLORS.unknown
                      : "transparent",
                  color:
                    filterType === type
                      ? "white"
                      : TYPE_COLORS[type] || TYPE_COLORS.unknown,
                  border: `1px solid ${TYPE_COLORS[type] || TYPE_COLORS.unknown}40`,
                }}
              >
                {type} ({count})
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
