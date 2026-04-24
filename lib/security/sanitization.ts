export function sanitizeHtml(input: string): string {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, "");
}

export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";
  return input.trim().replace(/<[^>]*>/g, "");
}

export function sanitizeRichText(input: string): string {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, "");
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}