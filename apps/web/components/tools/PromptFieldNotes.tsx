"use client";

import { useState } from "react";

interface FieldNote {
  id: string;
  when: string;
  rule: string;
  why: string;
}

const notes: FieldNote[] = [
  {
    id: "mental-models",
    when: "Writing system prompts or behavioral instructions",
    rule: "Teach it how to think. Give it a mental model instead of a list of \"don't do this, don't do that.\"",
    why: "Not benchmarked, just vibes - but at scale you hit a ton of outliers you can't predict. A list of prohibitions can't cover what you don't know is coming. A mental model is a catch-all that stays strong without inducing unwanted bias. I'll take that over a blacklist any day.",
  },
  {
    id: "avoid-examples-bias",
    when: "Your product handles diverse or multilingual inputs",
    rule: "Don't give specific examples - they anchor the model and induce bias.",
    why: "Say you're processing store names across 30 countries. If your prompt includes \"e.g. Walmart, Target\" as examples, the model starts pattern-matching toward American retail chains. Instead, describe what you want abstractly: \"extract the merchant name as displayed on the page.\" Let the model generalize - that's what it's good at. Not benchmarked, but every time I've removed specific examples from a multilingual prompt, output diversity got better.",
  },
  {
    id: "structure-over-caps",
    when: "You need the model to parse multi-part instructions clearly",
    rule: "Use markdown headers or XML tags to structure prompts. Not CAPS.",
    why: "Haven't benchmarked this either - I just don't like CAPS. They feel like yelling and I'm not convinced the model reads them the way we intend. Markdown headers or XML tags give clear, parseable structure. I reach for markdown first, XML when the prompt has nested sections or when I want the model to reference specific blocks by name.",
  },
];

function toMarkdown(note: FieldNote): string {
  return `**When:** ${note.when}\n**Rule:** ${note.rule}\n**Why:** ${note.why}`;
}

function toXml(note: FieldNote): string {
  return `<rule context="${note.when}">\n  <principle>${note.rule}</principle>\n  <reasoning>${note.why}</reasoning>\n</rule>`;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="px-2.5 py-1 text-xs font-mono rounded border border-fd-border bg-fd-background text-fd-muted-foreground hover:text-fd-foreground hover:border-fd-foreground/30 transition-colors"
    >
      {copied ? "Copied" : label}
    </button>
  );
}

export function PromptFieldNotes() {
  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <div
          key={note.id}
          className="rounded-lg border border-fd-border bg-fd-card p-5"
        >
          <div className="mb-3">
            <span className="text-xs font-mono uppercase tracking-wide text-fd-muted-foreground">
              When
            </span>
            <p className="text-sm text-fd-muted-foreground mt-0.5">
              {note.when}
            </p>
          </div>

          <p className="text-base font-medium text-fd-foreground mb-2">
            {note.rule}
          </p>

          <p className="text-sm text-fd-muted-foreground mb-4">{note.why}</p>

          <div className="flex gap-2">
            <CopyButton text={toMarkdown(note)} label="Copy MD" />
            <CopyButton text={toXml(note)} label="Copy XML" />
          </div>
        </div>
      ))}
    </div>
  );
}
