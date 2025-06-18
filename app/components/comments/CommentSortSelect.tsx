'use client';

type Props = {
  sortOrder: 'asc' | 'desc';
  setSortOrder: (value: 'asc' | 'desc') => void;
};

export default function CommentSortSelect({ sortOrder, setSortOrder }: Props) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label htmlFor="sort-comments">Sort by:{' '}</label>
      <select
        id="sort-comments"
        value={sortOrder}
        onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
      >
        <option value="asc">Oldest First</option>
        <option value="desc">Newest First</option>
      </select>
    </div>
  );
}
