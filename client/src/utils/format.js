/**
 * Formats a byte count into a human-readable string.
 * @param {number} bytes - Raw byte count
 * @param {number} [decimals=1] - Decimal precision
 * @returns {string} e.g. "1.4 MB"
 */
export function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 B';
  if (!bytes || isNaN(bytes)) return '—';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Formats a Date object or ISO string as a compact date string.
 * @param {Date|string} date
 * @returns {string} e.g. "27 May 2025"
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Truncates a string to a maximum length, appending an ellipsis.
 * @param {string} str
 * @param {number} [max=40]
 * @returns {string}
 */
export function truncate(str, max = 40) {
  if (!str) return '';
  return str.length <= max ? str : `${str.slice(0, max)}…`;
}
