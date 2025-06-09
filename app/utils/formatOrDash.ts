export const formatOrDash = (val: unknown): string => {
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'string' && val.trim()) return val;
  return '—';
};
