import DOMPurify from "dompurify"

/**
 * Sanitize a string to prevent XSS.
 * Strips all HTML tags, returning plain text.
 */
export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
}

/**
 * Validate a CSS color value (hex, rgb, hsl, named colors).
 * Returns the color if valid, empty string otherwise.
 */
export function sanitizeColor(color: string): string {
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) return color
  if (/^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/.test(color)) return color
  if (/^[a-z]{3,20}$/i.test(color)) return color
  return ""
}
