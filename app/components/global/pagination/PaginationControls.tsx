type Props = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function PaginationControls({ currentPage, totalPages, onPageChange }: Props) {
  return (
    <div style={{ marginTop: '1rem' }}>
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>
        ⬅ Prev
      </button>
      <span style={{ margin: '0 1rem' }}>
        Page {currentPage} of {totalPages}
      </span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
        Next ➡
      </button>
    </div>
  );
}
