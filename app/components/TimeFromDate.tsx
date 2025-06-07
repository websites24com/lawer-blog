'use client';

// Define the props as an object type
type Props = {
  date: string;
};

// Functional component to calculate time since a given date
export default function TimeFromDate({ date }: Props) {
  // If no date is provided, show a placeholder
  if (!date) return <>—</>;

  // Parse input date and current date
  const start = new Date(date);
  const end = new Date();

  // Calculate differences
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  // Adjust day overflow
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }

  // Adjust month overflow
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  // Create readable parts
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);

  // Fallback if less than a day
  const output = parts.length > 0 ? parts.join(', ') : 'less than a day';

  // Return JSX
  return <>{output}</>;
}
