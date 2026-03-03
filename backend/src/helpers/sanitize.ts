import DOMPurify from "isomorphic-dompurify"

/**
 * Sanitize a string to prevent XSS attacks.
 * Strips all HTML tags and returns plain text.
 */
export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
}

/**
 * Sanitize an object's string values recursively (shallow - top-level only).
 * Only sanitizes string fields listed in `fields`.
 */
export function sanitizeFields<T extends Record<string, unknown>>(
  data: T,
  fields: (keyof T)[]
): T {
  const result = { ...data }

  for (const field of fields) {
    if (typeof result[field] === "string") {
      result[field] = sanitizeText(result[field] as string) as T[keyof T]
    }
  }

  return result
}
