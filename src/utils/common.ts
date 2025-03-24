/**
 * Generates a random ID
 * @returns {string} A random ID
 */
export const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * Extracts the first UUID found in a URL path
 *
 * @param {string} pathname - The URL pathname to extract UUID from
 * @returns {string|null} The extracted UUID or null if not found
 */
export const extractFirstUuidFromPath = (pathname: string): string | null => {
  if (!pathname || typeof pathname !== 'string') {
    return null;
  }

  const uuidRegex =
    /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
  const match = pathname.match(uuidRegex);

  return match ? match[0] : null;
};
