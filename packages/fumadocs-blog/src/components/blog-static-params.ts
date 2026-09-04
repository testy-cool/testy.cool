import type { BlogPost } from "./types";
import { getSeriesNames } from "./utils";

export async function generateAllParams(
  posts: BlogPost[],
  includeBlogPosts = true,
) {
  // Derived from `posts` rather than blogSource.generateParams(), which returns
  // every page and so would build routes for drafts the caller has filtered out.
  // The two are otherwise identical: generateParams() is getPages().map(page =>
  // ({ slug: page.slugs })).
  const blogPostsParams = posts
    .filter((post): post is BlogPost & { slugs: string[] } => post.slugs != null)
    .map((post) => ({ slug: post.slugs }));

  // Generate series page params
  const seriesParams = generateSeriesPathParams(posts);

  // Get root and pagination params
  const rootParams = generateRootPathParams(blogPostsParams);

  // Generate category params (both category pages and their pagination)
  const categoryParams = generateCategoryPathParams(blogPostsParams);

  // Combine all params
  const allParams = [...rootParams, ...categoryParams, ...seriesParams];

  // Include individual blog posts if requested
  if (includeBlogPosts) {
    allParams.push(...blogPostsParams);
  }

  return allParams;
}

/**
 * Generates static parameters for blog routes including:
 * - Root route
 * - Individual blog posts
 * - Category pages
 * - Pagination for root and category pages
 */
export async function generateBlogStaticParams(posts: BlogPost[]) {
  return await generateAllParams(posts, true);
}

/**
 * Builds URLs for the blog root path and its paginated versions
 */
export function generateRootPathParams(
  blogPostsParams: Array<{ slug: string[] }>,
) {
  const postsPerPage = 5;
  const totalPages = Math.ceil(blogPostsParams.length / postsPerPage);

  // Generate pagination params for root route - skip page 1 as it's handled by the root route
  const rootPaginationParams = Array.from(
    { length: totalPages - 1 },
    (_, i) => ({
      slug: ["page", (i + 2).toString()],
    }),
  );

  // Return root route and pagination params
  return [
    { slug: [] }, // Root route
    ...rootPaginationParams,
  ];
}

/**
 * Builds URLs for category paths and their paginated versions
 */
export function generateCategoryPathParams(
  blogPostsParams: Array<{ slug: string[] }>,
) {
  const postsPerPage = 5;

  // Extract categories from two-part slugs
  const categoryPages = blogPostsParams
    .filter((param) => param.slug && param.slug.length === 2)
    .map((param) => param.slug[0])
    .filter((slug): slug is string => typeof slug === "string")
    .map((slug) => ({ slug: [slug] }))
    .filter(
      (category, index, self) =>
        // Remove duplicates
        index === self.findIndex((c) => c.slug[0] === category.slug[0]),
    );

  const categoryPaginationParams = [];

  for (const category of categoryPages) {
    const categorySlug = category.slug[0];
    if (!categorySlug) continue;

    // Get posts for this category by checking the URL structure
    const categoryPosts = blogPostsParams.filter((postSlug) => {
      // Extract category from URL path
      return postSlug.slug?.length === 2 && postSlug.slug[0] === categorySlug;
    });

    const categoryTotalPages = Math.ceil(categoryPosts.length / postsPerPage);

    // Skip page 1 as it's handled by the category route
    for (let i = 1; i < categoryTotalPages; i++) {
      categoryPaginationParams.push({
        slug: [categorySlug, "page", (i + 1).toString()],
      });
    }
  }

  return [...categoryPages, ...categoryPaginationParams];
}

/**
 * Builds URLs for series pages
 */
export function generateSeriesPathParams(posts: BlogPost[]) {
  return getSeriesNames(posts).map((seriesName) => ({
    slug: ["series", seriesName],
  }));
}

/**
 * Generates static parameters for OG image routes
 * Only generates image.png suffixed routes to avoid path conflicts
 */
export async function generateOgImageStaticParams(posts: BlogPost[]) {
  // Get all the regular params first
  const params = await generateAllParams(posts, true);

  // Create only image.png suffixed routes
  const imageRoutes: Array<{ slug: string[] }> = [];

  for (const param of params) {
    if (param.slug && param.slug.length > 0) {
      imageRoutes.push({ slug: [...param.slug, "image.png"] });
    } else {
      imageRoutes.push({ slug: ["image.png"] });
    }
  }

  return imageRoutes;
}
