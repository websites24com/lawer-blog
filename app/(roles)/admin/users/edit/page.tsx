'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { updateUserInfo, getAllUsers } from '@/app/actions/admin-users';
import type { UserSummary } from '@/app/lib/definitions';
import toast from 'react-hot-toast';
import ActionButton from '@/app/components/ActionButton';
import ImageWithFallback from '@/app/components/ImageWithFallback';
import Image from 'next/image';

export default function AdminUserEditPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [form, setForm] = useState<null | {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    chat_app: string;
    role: string;
    avatar_url: string;
  }>(null);
  const [originalAvatar, setOriginalAvatar] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const userId = searchParams.get('id');

  useEffect(() => {
    async function loadUsers() {
      const result = await getAllUsers();
      setUsers(result);
      const user = result.find(u => u.id.toString() === userId);
      if (user) {
        setSelectedUser(user);
        setForm({
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          chat_app: user.chat_app,
          role: user.role,
          avatar_url: user.avatar_url || ''
        });
        setOriginalAvatar(user.avatar_url || '');
      }
    }
    if (userId) loadUsers();
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);

      // Auto-save avatar when changed
      startTransition(async () => {
        try {
          const formData = new FormData();
          formData.append('avatar', file);
          formData.append('userId', userId!);

          const uploadRes = await fetch('/api/avatar', {
            method: 'POST',
            body: formData
          });

          if (!uploadRes.ok) throw new Error('Upload failed');

          const data = await uploadRes.json();
          setForm(prev => prev ? { ...prev, avatar_url: data.url } : prev);
          toast.success('Avatar updated');
        } catch {
          toast.error('Avatar upload failed');
        }
      });
    }
  };

  const handleDeleteAvatar = () => {
    setForm(prev => prev ? { ...prev, avatar_url: '' } : prev);
    setAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success('Avatar removed');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !form) return;

    startTransition(async () => {
      try {
        const { avatar_url, ...dataToUpdate } = form;
        await updateUserInfo(Number(userId), { ...dataToUpdate, avatar_url });

        toast.success('User updated');
        router.push('/admin/users');
      } catch {
        toast.error('Update failed');
      }
    });
  };

  if (!selectedUser || !form) return <p>Loading user...</p>;

  return (
    <div>
      <h1>Edit User</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="First name" required />
        <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last name" required />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" required />
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" />

        <select name="chat_app" value={form.chat_app} onChange={handleChange}>
          <option value="None">None</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Telegram">Telegram</option>
          <option value="Signal">Signal</option>
          <option value="Messenger">Messenger</option>
        </select>

        <select name="role" value={form.role} onChange={handleChange}>
          <option value="USER">USER</option>
          <option value="MODERATOR">MODERATOR</option>
          <option value="ADMIN">ADMIN</option>
        </select>

        <label>Current Avatar:</label>
        <div className="image-wrapper-avatar">
          <ImageWithFallback
            src={avatarFile ? URL.createObjectURL(avatarFile) : form.avatar_url}
            alt="Avatar preview"
            imageType="avatar"
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <ActionButton
            type="button"
            onClick={() => {
              setForm(prev => ({ ...prev!, avatar_url: originalAvatar }));
              setAvatarFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
              toast.success('Avatar restored');
            }}
          >
            Restore Original Avatar
          </ActionButton>

          <ActionButton
            type="button"
            onClick={handleDeleteAvatar}
          >
            Delete Avatar
          </ActionButton>
        </div>

        <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />

        <ActionButton type="submit" loading={isPending}>
          Save
        </ActionButton>
      </form>
    </div>
  );
}
