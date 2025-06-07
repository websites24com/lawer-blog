export const formatOrDash = (val: unknown): string =>
  typeof val === 'string' && val.trim() ? val : '—';
