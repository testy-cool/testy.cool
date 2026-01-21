import Hero from "@/components/hero";
import { GridBackground } from "@repo/ui/components/grid-background";
import { getBlogPosts } from "@/lib/source";
import { BlogList } from "@repo/fumadocs-blog/blog";
import { getBlogConfiguration } from "@/blog-configuration";
import { organizationSchema, websiteSchema } from "@/lib/jsonld";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col justify-center text-center">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationSchema(), websiteSchema()]),
        }}
      />
      <div className="relative flex w-full flex-col items-center overflow-x-hidden">
        <GridBackground maxWidthClass="container" />

        <div className="relative flex items-center justify-center w-full mx-auto container">
          <div className="space-y-8">
            <Hero />
          </div>
        </div>

        <BlogList
          configuration={getBlogConfiguration()}
          posts={getBlogPosts()}
          heading="Recent Posts"
          description="The recently published"
          disablePagination={true}
        />
      </div>
    </div>
  );
}
