'use client';

import { useEffect, useState, useTransition } from 'react';
import { updatePostStatus, deletePostAction } from '@/app/actions/admin-posts';
import type { PostSummary } from '@/app/lib/definitions';
import toast from 'react-hot-toast';
import ActionButton from '@/app/components/ActionButton';
import ConfirmDeleteDialog from '@/app/components/ConfirmDeleteDialog';
import AdminPostItem from '@/app/components/AdminPostItem';
import { useRouter } from 'next/navigation';

const PAGE_SIZE = 10;

export default function AdminPostList() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [sortKey, setSortKey] = useState<'date_desc' | 'date_asc' | 'author' | 'category'>('date_desc');
  const [filterText, setFilterText] = useState('');
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<number | null>(null);
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

  const confirmDelete = (id: number) => setDeleteId(id);

  const handleDeleteConfirmed = async () => {
    if (!deleteId) return;

    startTransition(async () => {
      try {
        await deletePostAction(deleteId);
        toast.success('Post deleted');
        setPosts((prev) => prev.filter((post) => post.id !== deleteId));
        setDeleteId(null);
      } catch {
        toast.error('Delete failed');
      }
    });
  };

  const handleStatus = async (id: number, status: 'approved' | 'declined' | 'draft') => {
    startTransition(async () => {
      try {
        await updatePostStatus(id, status);
        toast.success(`Post ${status}`);
        setPosts((prev) =>
          prev.map((post) =>
            post.id === id ? { ...post, status } : post
          )
        );
      } catch {
        toast.error('Status update failed');
      }
    });
  };

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
    const start = (currentPage[status as keyof typeof currentPage] - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  };

  const renderPagination = (status: keyof typeof currentPage, total: number) => {
    const pageCount = Math.ceil(total / PAGE_SIZE);
    return (
      <div>
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

  return (
    <div>
      <h1>All Posts</h1>

      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
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

      <div style={{ display: 'flex', gap: '2rem' }}>
        {['pending', 'approved', 'declined', 'draft'].map((status) => (
          <div key={status} style={{ flex: 1 }}>
            <h2>{status[0].toUpperCase() + status.slice(1)}</h2>
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

      <ConfirmDeleteDialog
        open={deleteId !== null}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  );
}
