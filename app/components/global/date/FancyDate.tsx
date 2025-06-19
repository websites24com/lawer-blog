export type FancyDateProps = {
  dateString: string;
};

// Converts "2025-05-06" → "6th of May 2025"
export default function FancyDate({ dateString }: FancyDateProps) {
  const date = new Date(dateString);
  const day = date.getDate();

  const suffix =
    day % 10 === 1 && day !== 11 ? 'st' :
    day % 10 === 2 && day !== 12 ? 'nd' :
    day % 10 === 3 && day !== 13 ? 'rd' : 'th';

  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();

  return <>{`${day}${suffix} of ${month} ${year}`}</>;
}
