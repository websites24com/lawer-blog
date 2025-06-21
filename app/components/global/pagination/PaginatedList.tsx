import React, { useState } from 'react';
import PaginationControls from '@/app/components/global/pagination/PaginationControls';

type Props<T> = {
  items: T[];
  itemsPerPage?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  noItemsMessage?: string;
};

export default function PaginatedList<T>({
  items,
  itemsPerPage = 3,
  renderItem,
  noItemsMessage = 'No items to display.',
}: Props<T>) {
    
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      {paginatedItems.length > 0 ? (
        <>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {paginatedItems.map(renderItem)}
          </ul>
          {totalPages > 1 && (
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      ) : (
        <p>{noItemsMessage}</p>
      )}
    </div>
  );
}
