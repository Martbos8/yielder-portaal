// Input sanitization for form fields
// Strips potentially dangerous HTML/script content

/**
 * Sanitize a text input by removing HTML tags and trimming.
 * Preserves basic punctuation and special characters.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

/**
 * Sanitize a subject line: strip HTML, limit length.
 */
export function sanitizeSubject(input: string, maxLength = 200): string {
  return sanitizeText(input).slice(0, maxLength);
}

/**
 * Sanitize a message body: strip HTML, limit length.
 */
export function sanitizeMessage(input: string, maxLength = 2000): string {
  return sanitizeText(input).slice(0, maxLength);
}
