/**
 * Sanitizes and validates internal returnTo / redirect destinations.
 *
 * Rules:
 * 1. Must be a non-empty string.
 * 2. Defaults to '/profile' on null, undefined, empty, or root '/'.
 * 3. Rejects any string containing backslashes ('\') or encoded backslashes ('%5c', '%5C').
 * 4. Rejects protocol-relative URLs (starting with '//' or containing '%2f%2f', '%2F%2F').
 * 5. Rejects any control characters (ASCII 0x00 - 0x1F) or newlines/tabs.
 * 6. Parses the target against a trusted dummy origin `http://localhost.local`.
 *    Ensures:
 *    - url.origin === 'http://localhost.local' (strict same-origin check)
 *    - url.pathname starts with a single '/'
 *    - url.pathname does not start with '//'
 * 7. Returns only `${url.pathname}${url.search}${url.hash}`.
 */
export function sanitizeReturnTo(returnTo?: string | null): string {
  const fallback = "/profile";
  if (!returnTo || typeof returnTo !== "string") {
    return fallback;
  }

  const trimmed = returnTo.trim();
  if (!trimmed || trimmed === "/") {
    return fallback;
  }

  // Reject backslashes (literal or percent-encoded %5c / %5C)
  if (trimmed.includes("\\") || /%5c/i.test(trimmed)) {
    return fallback;
  }

  // Reject protocol-relative attempts (literal // or encoded /%2f / %2f%2f)
  if (trimmed.startsWith("//") || /%2f%2f/i.test(trimmed) || /^\/%2f/i.test(trimmed)) {
    return fallback;
  }

  // Reject control characters or newlines (ASCII 0-31 and 127)
  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i);
    if ((code >= 0 && code <= 31) || code === 127) {
      return fallback;
    }
  }

  // Must begin with a single slash (relative internal path)
  if (!trimmed.startsWith("/")) {
    return fallback;
  }

  try {
    const trustedOrigin = "http://localhost.local";
    const url = new URL(trimmed, trustedOrigin);

    if (url.origin !== trustedOrigin) {
      return fallback;
    }

    // Double check pathname safety
    if (
      !url.pathname.startsWith("/") ||
      url.pathname.startsWith("//") ||
      url.pathname.includes("\\")
    ) {
      return fallback;
    }

    // Ensure path isn't just root
    if (url.pathname === "/" && !url.search && !url.hash) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
