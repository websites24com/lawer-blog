'use client';

import { useState, useTransition, useEffect } from 'react';
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
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    chat_app: 'None',
    role: 'USER',
    avatar_url: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState('');
  const [isPending, startTransition] = useTransition();
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
        setOriginalAvatarUrl(user.avatar_url || '');
        setForm({
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          chat_app: user.chat_app,
          role: user.role,
          avatar_url: user.avatar_url || ''
        });
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
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    startTransition(async () => {
      try {
        let uploadedAvatarUrl = originalAvatarUrl;

        if (avatarFile) {
          const formData = new FormData();
          formData.append('avatar', avatarFile);
          formData.append('userId', userId);

          const uploadRes = await fetch('/api/avatar', {
            method: 'POST',
            body: formData
          });

          if (!uploadRes.ok) throw new Error('Upload failed');

          const data = await uploadRes.json();
          uploadedAvatarUrl = data.url;
        }

        const { avatar_url, ...data } = form;
        await updateUserInfo(Number(userId), { ...data, avatar_url: uploadedAvatarUrl });
        toast.success('User updated');
        router.push('/admin/users');
      } catch {
        toast.error('Update failed');
      }
    });
  };

  if (!selectedUser) return <p>Loading user...</p>;

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
        <div style={{ width: '100px', height: '100px', position: 'relative' }}>
          <ImageWithFallback
            src={originalAvatarUrl}
            alt="Original avatar"
            imageType="avatar"
            className=""
            wrapperClassName=""
          />
        </div>

        <input type="file" accept="image/*" onChange={handleFileChange} />

        {avatarFile && (
          <div>
            <label>New Avatar Preview:</label>
            <Image
              src={URL.createObjectURL(avatarFile)}
              alt="Avatar preview"
              width={100}
              height={100}
              style={{ objectFit: 'cover' }}
            />
          </div>
        )}

        <ActionButton
          onClick={() => {}} // required to satisfy props
          loading={isPending}
        >
          Save
        </ActionButton>
      </form>
    </div>
  );
}
