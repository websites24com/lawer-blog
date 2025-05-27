'use client';

import { useEffect, useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import ActionButton from '@/app/components/ActionButton';
import ImageWithFallback from '@/app/components/ImageWithFallback';

export default function UpdateProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    chat_app: 'None',
    avatar_url: ''
  });
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadUser() {
      if (status !== 'authenticated' || !session?.user) return;

      const query = session.user.email
        ? `email=${encodeURIComponent(session.user.email)}`
        : `providerId=${encodeURIComponent(session.user.id)}`;

      const res = await fetch(`/api/user?${query}`);
      const user = await res.json();

      setForm({
        id: String(user.id),
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email || '',
        phone: user.phone || '',
        chat_app: user.chat_app || 'None',
        avatar_url: user.avatar_url || ''
      });
      setOriginalAvatarUrl(user.avatar_url || '');
    }

    loadUser();
  }, [status, session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('📸 New avatar selected:', file.name);
      setAvatarFile(file);
    }
  };

  const handleSubmit = () => {
    if (!form.id) return;

    startTransition(async () => {
      try {
        let uploadedAvatarUrl = originalAvatarUrl;

        if (avatarFile) {
          const formData = new FormData();
          formData.append('avatar', avatarFile);
          formData.append('userId', form.id);

          const uploadRes = await fetch('/api/avatar', {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) throw new Error('Upload failed');
          const data = await uploadRes.json();
          uploadedAvatarUrl = data.url;
          console.log('✅ Avatar uploaded to:', uploadedAvatarUrl);
        }

        const updateForm = new FormData();
        updateForm.append('id', form.id);
        updateForm.append('first_name', form.first_name);
        updateForm.append('last_name', form.last_name);
        updateForm.append('email', form.email);
        updateForm.append('phone', form.phone);
        updateForm.append('chat_app', form.chat_app);
        updateForm.append('avatar_url', uploadedAvatarUrl);

        const updateRes = await fetch('/api/user/update', {
          method: 'POST',
          body: updateForm,
        });

        const result = await updateRes.json();
        console.log('✅ Update result:', result);

        if (!updateRes.ok) throw new Error('Update failed');
        toast.success('Profile updated');
        router.push('/user');
      } catch (err) {
        console.error('❌ Submit failed:', err);
        toast.error('Update failed');
      }
    });
  };

  if (!form.id) return <p>Loading profile...</p>;

  const previewUrl = avatarFile ? URL.createObjectURL(avatarFile) : null;

  const avatarStyle = {
    width: 100,
    height: 100,
    borderRadius: '50%',
    objectFit: 'cover',
    position: 'relative',
    overflow: 'hidden'
  };

  return (
    <div className="user-update-page">
      <h1>✏️ Update Profile</h1>

      <div className="form-stack">
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

        <label>Current Avatar:</label>
        <div style={avatarStyle}>
          <ImageWithFallback
            src={originalAvatarUrl}
            alt="Current avatar"
            imageType="avatar"
            className="fallback-image-avatar"
            wrapperClassName=""
          />
        </div>

        <input type="file" accept="image/*" onChange={handleFileChange} />

        {previewUrl && (
          <>
            <label>New Avatar Preview:</label>
            <div style={avatarStyle}>
              <ImageWithFallback
                src={previewUrl}
                alt="New avatar preview"
                imageType="avatar"
                className="fallback-image-avatar"
                wrapperClassName=""
              />
            </div>
          </>
        )}

        <ActionButton onClick={handleSubmit} loading={isPending}>
          Save
        </ActionButton>
      </div>
    </div>
  );
}
