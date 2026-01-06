import Link from "next/link";

interface Tool {
  slug: string;
  title: string;
  description: string;
  screenshot?: string;
}

const tools: Tool[] = [
  {
    slug: "clamp-calculator",
    title: "Clamp Calculator",
    description: "Generate fluid responsive CSS clamp() values from your Figma designs. Supports both mobile+desktop and desktop-only workflows.",
    screenshot: "/images/tools/clamp-calculator.png",
  },
];

export default function ToolsIndex() {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-semibold mb-2">Tools</h1>
        <p className="text-muted-foreground mb-10">
          Dev tools and calculators. Mostly for frontend work.
        </p>

        <div className="grid gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="group block bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
            >
              <div className="aspect-[2/1] bg-muted relative overflow-hidden">
                {tool.screenshot ? (
                  <img
                    src={tool.screenshot}
                    alt={`${tool.title} screenshot`}
                    className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                    Preview
                  </div>
                )}
              </div>
              <div className="p-5">
                <h2 className="text-lg font-medium mb-1 group-hover:text-primary transition-colors">
                  {tool.title}
                </h2>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
