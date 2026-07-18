const ABSOLUTE_URL_PATTERN = /^(?:[a-z][a-z\d+.-]*:)?\/\//iu;

export function resolvePublicPath(
  path: string,
  baseUrl = import.meta.env.BASE_URL,
): string {
  if (ABSOLUTE_URL_PATTERN.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const normalizedBase =
    baseUrl === "/" ? "" : `/${baseUrl.replace(/^\/|\/$/gu, "")}`;

  return `${normalizedBase}${normalizedPath}`;
}

export const FEEDBACK_API_URL =
  import.meta.env.VITE_FEEDBACK_API_URL?.trim() || "/api/feedback";
