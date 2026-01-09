import { Fragment } from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/shadverse/components/breadcrumb";
import { DocsTitle, DocsDescription } from "fumadocs-ui/page";
import { Pagination } from "./pagination";
import { BlogConfiguration, type BlogPost } from "./types";
import { slot } from "./shared";

export type BreadcrumbEntry = {
  label: string;
  href?: string;
};

export type PostListProps = {
  posts: BlogPost[];
  currentPage: number;
  totalPages: number;
  heading?: string;
  description?: string;
  basePath?: string;
  disablePagination?: boolean;
  configuration?: BlogConfiguration;
  breadcrumbs?: BreadcrumbEntry[];
};

export function PostList({
  posts,
  currentPage,
  totalPages,
  heading = "Blog Posts",
  description = "Notes and ramblings, typically about LLMs.",
  basePath = "/blog",
  disablePagination = false,
  configuration,
  breadcrumbs = [],
}: PostListProps) {
  // PostCard is now imported directly

  return (
    <>
      <section className="relative container px-4 py-8 lg:py-12 lg:px-6 text-left bg-zinc-50/50 dark:bg-zinc-900/50">
        {slot(configuration?.backgroundPattern, null)}

        <div className="text-center">
          {breadcrumbs.length > 0 && (
            <Breadcrumb className="mb-4 flex justify-center">
              <BreadcrumbList className="justify-center">
                {breadcrumbs.map((crumb, index) => (
                  <Fragment key={`${crumb.label}-${index}`}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {crumb.href ? (
                        <BreadcrumbLink asChild>
                          <Link href={crumb.href}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
          <DocsTitle className="dark:text-white capitalize">
            {heading}
          </DocsTitle>
          <DocsDescription className="mt-3 dark:text-gray-300 mb-0">
            {description}
          </DocsDescription>
        </div>
      </section>

      <section className="relative container px-4 py-8 lg:py-12 lg:px-6 text-left">
        {slot(configuration?.backgroundPattern, null)}
        <div className="grid gap-y-10 sm:grid-cols-12 sm:gap-y-12 md:gap-y-16 lg:gap-y-20">
          {posts
            .filter(
              (post): post is NonNullable<typeof post> => post !== undefined
            )
            .map((post) => {
              if (configuration?.PostCard) {
                return (
                  <configuration.PostCard
                    key={post.url}
                    post={post}
                    configuration={configuration}
                  />
                );
              }
            })}
        </div>

        {!disablePagination && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={basePath}
            configuration={configuration}
          />
        )}
      </section>
    </>
  );
}
