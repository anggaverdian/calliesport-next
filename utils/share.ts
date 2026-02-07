import { nanoid } from "nanoid";

/**
 * Generates a short, URL-friendly share ID
 * Uses nanoid for cryptographically secure, URL-safe IDs
 * @returns 9-character alphanumeric string (e.g., "lxk8m2abc")
 */
export function generateShareId(): string {
  return nanoid(9);
}

/**
 * Validates a share ID format
 * @param shareId - The share ID to validate
 * @returns true if the share ID is valid (alphanumeric, 9 characters)
 */
export function isValidShareId(shareId: string): boolean {
  // nanoid uses A-Za-z0-9_- characters
  const shareIdPattern = /^[A-Za-z0-9_-]{9}$/;
  return shareIdPattern.test(shareId);
}

/**
 * Generates the full share URL for a tournament
 * @param shareId - The share ID
 * @returns Full URL to the shared tournament page
 */
export function getShareUrl(shareId: string): string {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return `${baseUrl}/share/${shareId}`;
}
