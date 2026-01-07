/** @type {import('next-sitemap').IConfig} */

// Ensure siteUrl is a string, prioritizing the production URL
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL 
  ? `https://${process.env.NEXT_PUBLIC_SITE_URL}` 
  : "https://testy.cool"; 

module.exports = {
  outDir: "out",
  siteUrl: siteUrl,
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/api/', '/_next/', '/static/'] },
    ],
  },
  transform: async (config, path) => {
    // custom function to ignore the path
    if (customIgnoreFunction(path)) {
      return null;
    }
    // Use default transformation for all other cases
    return {
      loc: path, // => this will be exported as http(s)://<config.siteUrl>/<path>
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    };
  },
};

/**
 * Function to check if a path should be ignored
 * @param {string} path - The path to check
 * @returns {boolean} - True if the path should be ignored
 */
function customIgnoreFunction(path) {
  const pathsToIgnore = [
    "/api/",
    "opengraph-image-",
    "blog-1",
    "docs-og",
    "blog-og",
    "blog-posts-og",
    "posts",
  ];

  return pathsToIgnore.some((pattern) => path.includes(pattern));
}