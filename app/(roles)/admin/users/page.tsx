'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getAllUsers, updateUserStatus, deleteUser } from '@/app/actions/admin-users';
import type { UserSummary } from '@/app/lib/definitions';
import toast from 'react-hot-toast';
import ActionButton from '@/app/components/global/ActionButton';
import ConfirmDeleteDialog from '@/app/components/global/ConfirmDeleteDialog';
import ImageWithFallback from '@/app/components/global/ImageWithFallback';

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

export default function AdminUserList() {
  const router = useRouter();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [filterText, setFilterText] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'email' | 'role'>('name');
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState({
    approved: 1,
    pending: 1,
    declined: 1,
    banned: 1
  });
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch {
      toast.error('Failed to load users');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const confirmDelete = (id: number) => setDeleteId(id);

  const handleDeleteConfirmed = async () => {
    if (!deleteId) return;
    startTransition(async () => {
      try {
        await deleteUser(deleteId);
        toast.success('User deleted');
        setUsers((prev) => prev.filter((u) => u.id !== deleteId));
        setDeleteId(null);
      } catch {
        toast.error('Delete failed');
      }
    });
  };

  const handleStatus = (id: number, status: 'approved' | 'declined' | 'banned') => {
    startTransition(async () => {
      try {
        await updateUserStatus(id, status);
        toast.success(`User ${status}`);
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status } : u))
        );
      } catch {
        toast.error('Status update failed');
      }
    });
  };

  const sortUsers = (arr: UserSummary[]) => {
    return [...arr].sort((a, b) => {
      if (sortKey === 'name') {
        return (a.last_name + a.first_name).localeCompare(b.last_name + b.first_name);
      } else if (sortKey === 'email') {
        return a.email.localeCompare(b.email);
      } else if (sortKey === 'role') {
        return a.role.localeCompare(b.role);
      }
      return 0;
    });
  };

  const filteredUsers = users.filter(
    (user) =>
      user.first_name.toLowerCase().includes(filterText.toLowerCase()) ||
      user.last_name.toLowerCase().includes(filterText.toLowerCase()) ||
      user.email.toLowerCase().includes(filterText.toLowerCase())
  );

  const getPagedUsers = (arr: UserSummary[], status: string) => {
    const sorted = sortUsers(arr.filter(u => u.status === status));
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

  const count = (status: string) => users.filter(u => u.status === status).length;

  return (
    <div>
      <h1>All Users</h1>

      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <label htmlFor="sort">Sort by:</label>
        <select
          id="sort"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
        >
          <option value="name">Name</option>
          <option value="email">Email</option>
          <option value="role">Role</option>
        </select>

        <label htmlFor="pageSize">Show:</label>
        <select id="pageSize" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
          {PAGE_SIZE_OPTIONS.map(size => (
            <option key={size} value={size}>{size} per page</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search by name or email"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        <ActionButton onClick={() => router.push('/admin/posts')}>
                  Manage Posts
                </ActionButton>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {['approved', 'pending', 'declined', 'banned'].map((status) => (
          <div key={status} style={{ flex: 1, minWidth: '300px' }}>
            <h2>{status[0].toUpperCase() + status.slice(1)} ({count(status)})</h2>
            {getPagedUsers(filteredUsers, status).map((user) => (
              <div key={user.id} style={{ borderBottom: '1px solid #ccc', padding: '1rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '60px', height: '60px', position: 'relative' }}>
                    <ImageWithFallback
                      src={user.avatar_url}
                      alt={`${user.first_name} ${user.last_name}`}
                      imageType="avatar"
                      className=""
                      wrapperClassName=""
                    />
                  </div>
                  <div>
                    <div><strong>Name:</strong> {user.first_name} {user.last_name}</div>
                    <div><strong>Email:</strong> {user.email}</div>
                    <div><strong>Role:</strong> {user.role}</div>
                    <div><strong>Status:</strong> {user.status}</div>
                    <div><strong>Phone:</strong> {user.phone}</div>
                    <div><strong>Chat App:</strong> {user.chat_app}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <ActionButton title="Edit User" onClick={() => router.push(`/admin/users/edit?id=${user.id}`)}>Edit</ActionButton>
                  <ActionButton onClick={() => confirmDelete(user.id)} title="Delete User" loading={isPending}>Delete</ActionButton>
                  <ActionButton onClick={() => handleStatus(user.id, 'approved')} title="Approve User" loading={isPending}>Approve</ActionButton>
                  <ActionButton onClick={() => handleStatus(user.id, 'declined')} title="Decline User" loading={isPending}>Decline</ActionButton>
                  <ActionButton onClick={() => handleStatus(user.id, 'banned')} title="Ban User" loading={isPending}>Ban</ActionButton>
                </div>
              </div>
            ))}
            {renderPagination(status as keyof typeof currentPage, filteredUsers.filter((u) => u.status === status).length)}
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
