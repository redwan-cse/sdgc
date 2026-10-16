/**
 * Safely serializes data for injection into an inline <script type="application/ld+json"> tag.
 * Replaces '<' with unicode escape '\u003c' to prevent HTML script tag breakout (CWE-79 / XSS sink).
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
