/**
 * Redirect /tools/video-tutorial to /tools/video-breakdown, preserving query params.
 */
export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  url.pathname = "/tools/video-breakdown";
  return Response.redirect(url.toString(), 301);
};
