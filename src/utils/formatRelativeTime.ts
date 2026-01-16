/**
 * Formats a date string into a human-readable relative time.
 * Examples: "today", "yesterday", "3 days ago", "2 weeks ago", "1 month ago"
 */
export function formatRelativeTime(dateString: string | undefined): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();

  // Reset time parts for day comparison
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = today.getTime() - dateDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'today';
  }

  if (diffDays === 1) {
    return 'yesterday';
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  if (diffDays < 14) {
    return '1 week ago';
  }

  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} weeks ago`;
  }

  if (diffDays < 60) {
    return '1 month ago';
  }

  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} months ago`;
  }

  const years = Math.floor(diffDays / 365);
  if (years === 1) {
    return '1 year ago';
  }

  return `${years} years ago`;
}
