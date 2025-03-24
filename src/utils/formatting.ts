import sindresorhusSlugify from "@sindresorhus/slugify";

export const slugify = (text: string): string => {
  return sindresorhusSlugify(text, { decamelize: false });
};

export const extractFirstImage = (content: string): string | null => {
  const imageMatch = content.match(/!\[([^\]]*)\]\(([^)]+)\)/);
  return imageMatch ? imageMatch[2] : null;
};
