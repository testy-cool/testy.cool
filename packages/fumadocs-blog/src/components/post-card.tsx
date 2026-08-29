import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import type { BlogPost, BlogConfiguration } from "./types";
import { getReadingTime } from "./utils";

interface PostCardProps {
  post: NonNullable<BlogPost>;
  configuration?: BlogConfiguration;
}

export function PostCard({ post, configuration = {} }: PostCardProps) {
  const CardComponent = configuration.Card || null;
  const readingTime = getReadingTime(post.data.structuredData);
  const cardClassName =
    "order-last border-0 bg-transparent shadow-none sm:order-first sm:col-span-12 lg:col-span-10 lg:col-start-2 transition-all duration-300 group-hover:shadow-lg rounded-xl";

  const cardContent = (
    <div className="grid gap-y-6 sm:grid-cols-10 sm:gap-x-5 sm:gap-y-0 md:items-center md:gap-x-8 lg:gap-x-12">
      <div className="sm:col-span-5">
        <div className="mb-3 md:mb-4">
          <div className="flex flex-wrap gap-2">
            {post.data.tags?.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 bg-fd-muted text-fd-foreground rounded-full text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <h3 className="text-xl font-semibold md:text-2xl lg:text-3xl text-left">
          <span className="group-hover:underline">{post.data.title}</span>
        </h3>
        <p className="mt-4 text-muted-foreground md:mt-5 text-left line-clamp-3">
          {post.data.description}
        </p>
        <div className="mt-4 flex items-center space-x-4 text-sm md:mt-6">
          <span className="text-muted-foreground capitalize">
            {post.data.author || "Anonymous"}
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            {new Date(post.data.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span className="text-muted-foreground">&bull;</span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {readingTime} min read
          </span>
        </div>
        <div className="mt-4 flex items-center space-x-2 md:mt-6">
          <span className="inline-flex items-center font-semibold underline-offset-2 md:text-base">
            <span>Read more</span>
            <ArrowRight className="ml-2 size-4 transition-transform" />
          </span>
        </div>
      </div>
      <div className="order-first sm:order-last sm:col-span-5">
        <div className="aspect-[16/9] overflow-hidden rounded-lg border border-border">
          <img
            src={
              post.data.image ||
              post.url.replace("/blog/", "/blog-og/") + "/image.png"
            }
            alt={post.data.title}
            style={{
              transition: "transform 500ms ease-out, opacity 500ms ease-out",
            }}
            className="h-full w-full object-cover group-hover:scale-105 group-hover:opacity-80"
          />
        </div>
      </div>
    </div>
  );

  return (
    <Link
      href={post.url}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary focus-visible:ring-offset-2 focus-visible:ring-offset-fd-background"
    >
      {CardComponent ? (
        <CardComponent className={cardClassName}>{cardContent}</CardComponent>
      ) : (
        <div className={cardClassName}>{cardContent}</div>
      )}
    </Link>
  );
}
