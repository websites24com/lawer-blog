'use client';

import Link from 'next/link';

type Props = {
  currentPage: number;
  totalPages: number;
  basePath: string; // e.g. "/blog" or "/users"
};

export default function Pagination({ currentPage, totalPages, basePath }: Props) {
  if (totalPages <= 1) return null;

  const pageNumbers = [];

  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav style={{ marginTop: '2rem', textAlign: 'center' }}>
      {pageNumbers.map((page) => (
        <Link
          key={page}
          href={`${basePath}?page=${page}`}
          scroll={false}
          style={{
            margin: '0 0.5rem',
            padding: '0.5rem 1rem',
            textDecoration: 'none',
            background: page === currentPage ? '#333' : '#eee',
            color: page === currentPage ? '#fff' : '#333',
            borderRadius: '4px',
            fontWeight: page === currentPage ? 'bold' : 'normal',
          }}
        >
          {page}
        </Link>
      ))}
    </nav>
  );
}
