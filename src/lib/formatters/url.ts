/**
 * URL Utilities
 *
 * URL construction utilities
 */

/** Combine URL path with base URL */
export function buildUrl(baseUrl: string, path: string): string {
  return `${baseUrl}${path}`;
}
