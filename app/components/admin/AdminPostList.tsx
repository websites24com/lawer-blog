'use client';

import { useEffect, useState, useTransition } from 'react';
import type { PostSummary } from '@/app/lib/definitions';
import toast from 'react-hot-toast';
import ActionButton from '@/app/components/global/ActionButton';
import AdminPostItem from '@/app/components/admin/AdminPostItem';
import { useRouter } from 'next/navigation';

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

export default function AdminPostList() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [sortKey, setSortKey] = useState<'date_desc' | 'date_asc' | 'author' | 'category'>('date_desc');
  const [filterText, setFilterText] = useState('');
  const [isPending, startTransition] = useTransition();
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState({
    pending: 1,
    approved: 1,
    declined: 1,
    draft: 1
  });

  const router = useRouter();

  const loadPosts = async () => {
    try {
      const res = await fetch('/api/admin/posts');
      const data = await res.json();
      setPosts(data);
    } catch {
      toast.error('Failed to load posts');
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const sortPosts = (arr: PostSummary[]) => {
    return [...arr].sort((a, b) => {
      if (sortKey === 'date_desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortKey === 'date_asc') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortKey === 'author') {
        return (a.user.last_name + a.user.first_name).localeCompare(b.user.last_name + b.user.first_name);
      } else if (sortKey === 'category') {
        return a.category.localeCompare(b.category);
      }
      return 0;
    });
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(filterText.toLowerCase()) ||
      post.category.toLowerCase().includes(filterText.toLowerCase()) ||
      `${post.user.first_name} ${post.user.last_name}`.toLowerCase().includes(filterText.toLowerCase())
  );

  const getPagedPosts = (arr: PostSummary[], status: string) => {
    const sorted = sortPosts(arr.filter((post) => post.status === status));
    const start = (currentPage[status as keyof typeof currentPage] - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  };

  const renderPagination = (status: keyof typeof currentPage, total: number) => {
    const pageCount = Math.ceil(total / pageSize);
    return (
      <div style={{ marginTop: '0.5rem' }}>
        {Array.from({ length: pageCount }, (_, i) => (
          <ActionButton
            key={i}
            onClick={() => setCurrentPage({ ...currentPage, [status]: i + 1 })}
            disabled={currentPage[status] === i + 1}
          >
            {i + 1}
          </ActionButton>
        ))}
      </div>
    );
  };

  const count = (status: string) => posts.filter(p => p.status === status).length;

  return (
    <div>
      <h1>All Posts</h1>

      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <label htmlFor="sort">Sort by: </label>
          <select
            id="sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
          >
            <option value="date_desc">Date Desc</option>
            <option value="date_asc">Date Asc</option>
            <option value="author">Author</option>
            <option value="category">Category</option>
          </select>
        </div>

        <div>
          <label htmlFor="pageSize">Show: </label>
          <select id="pageSize" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            {PAGE_SIZE_OPTIONS.map(size => (
              <option key={size} value={size}>{size} per page</option>
            ))}
          </select>
        </div>

        <input
          type="text"
          placeholder="Filter by title, category, or author"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />

        <ActionButton onClick={() => router.push('/admin/users')}>
          Manage Users
        </ActionButton>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {['pending', 'approved', 'declined', 'draft'].map((status) => (
          <div key={status} style={{ flex: 1, minWidth: '300px' }}>
            <h2>{status[0].toUpperCase() + status.slice(1)} ({count(status)})</h2>
            {getPagedPosts(filteredPosts, status).map((post) => (
              <AdminPostItem
                key={post.id}
                post={post}
                onUpdate={(id, newStatus) =>
                  setPosts((prev) =>
                    prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
                  )
                }
                onDelete={(id) =>
                  setPosts((prev) => prev.filter((p) => p.id !== id))
                }
              />
            ))}
            {renderPagination(status as keyof typeof currentPage, filteredPosts.filter((p) => p.status === status).length)}
          </div>
        ))}
      </div>
    </div>
  );
}
