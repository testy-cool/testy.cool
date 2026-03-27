import { GridBackground } from "@repo/ui/components/grid-background";

export interface FooterNavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export default function SimpleFooter({
  navigation,
}: {
  navigation: FooterNavigationItem[];
}) {
  return (
    <footer>
      <div className="relative isolate mx-auto container px-4 py-12 md:flex md:items-center md:justify-between lg:px-6">
        <GridBackground maxWidthClass="container" />

        <div className="flex justify-center gap-x-6 md:order-2">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-fd-muted-foreground hover:text-fd-primary transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">{item.name}</span>
              <item.icon aria-hidden="true" className="size-6" />
            </a>
          ))}
        </div>
        <p className="mt-8 text-center text-sm/6 text-fd-muted-foreground md:order-1 md:mt-0">
          &copy; {new Date().getFullYear()} testy.cool
          <span className="mx-2">·</span>
          <a
            href="https://ailookup.dev"
            className="hover:text-fd-primary transition-colors duration-200"
            target="_blank"
            rel="noopener noreferrer"
          >
            AI tools directory
          </a>
        </p>
      </div>
    </footer>
  );
}
