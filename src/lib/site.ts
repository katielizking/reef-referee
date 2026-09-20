export const SITE_URL = "https://fishtankr.com";

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

export const SUPPORT_URL = "https://ko-fi.com/fishtankr";
