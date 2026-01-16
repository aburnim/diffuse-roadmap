/**
 * Format a target date for display with countdown
 * @param targetDate ISO date string (e.g., "2025-01-22")
 * @returns Object with formatted date and days away text
 */
export function formatTargetDate(targetDate: string): {
  formattedDate: string;
  daysText: string;
  isPast: boolean;
  isToday: boolean;
} {
  const target = new Date(targetDate + 'T00:00:00'); // Parse as local date
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  // Format the date (e.g., "January 22")
  const formattedDate = target.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });

  // Calculate days difference
  const diffTime = targetDay.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const isToday = diffDays === 0;
  const isPast = diffDays < 0;

  let daysText: string;
  if (isToday) {
    daysText = 'today';
  } else if (diffDays === 1) {
    daysText = 'tomorrow';
  } else if (diffDays === -1) {
    daysText = 'yesterday';
  } else if (isPast) {
    daysText = `${Math.abs(diffDays)} days ago`;
  } else {
    daysText = `${diffDays} days away`;
  }

  return {
    formattedDate,
    daysText,
    isPast,
    isToday,
  };
}
