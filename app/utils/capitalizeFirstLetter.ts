/**
 * Capitalizes only the first letter of a given string.
 * 
 * Examples:
 * capitalizeFirstLetter('león') => 'León'
 * capitalizeFirstLetter('mexico city') => 'Mexico city'
 */
export function capitalizeFirstLetter(text: string): string {
  const decoded = decodeURIComponent(text);
  return decoded.charAt(0).toUpperCase() + decoded.slice(1);
}
