export const SITE_URL = "https://fishtankr.com";

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

export const SUPPORT_URL = "https://ko-fi.com/fishtankr";

/**
 * Social preview image tags for a 1200 × 630 PNG in public/og/.
 * Images are rendered by tools/og/render-og.ts.
 */
export function ogImage(path: string) {
  const url = absoluteUrl(path);
  return [
    { property: "og:image", content: url },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: url },
  ];
}
