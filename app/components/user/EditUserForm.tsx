'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import ActionButton from '@/app/components/global/ActionButton';
import ImageWithFallback from '@/app/components/global/ImageWithFallback';
import PhoneNumberInput from '@/app/components/global/PhoneNumberInput';
import AvatarCropModal from '@/app/components/user/images/AvatarCropModal';
import AvatarMetaModal from '@/app/components/user/images/AvatarMetaModal';
import Spinner from '@/app/components/global/Spinner';

import { MessageCircle, Smartphone, Send, Trash2 } from 'lucide-react';

export default function EditUserForm({ userId }: { userId: number }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();

  // 🧠 Form state initialization
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    chat_app: 'None',
    website: '',
    about_me: '',
    avatar_url: '',
    avatar_alt: '',
    avatar_title: '',
  });

  const [previewUrl, setPreviewUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);

  // ⭐️ AMENDMENT ✅ Fallback to provider_account_id if email is missing
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return;

    const url = session.user.email
      ? `/api/user?email=${session.user.email}`
      : session.user.provider_account_id // ⭐️ ✅ fallback logic added here
      ? `/api/user?providerId=${session.user.provider_account_id}`
      : null;

    if (!url) {
      console.error('No identifier to fetch user');
      return;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          chat_app: data.chat_app || 'None',
          website: data.website || '',
          about_me: data.about_me || '',
          avatar_url: data.avatar_url || '',
          avatar_alt: data.avatar_alt || '',
          avatar_title: data.avatar_title || '',
        });
        setPreviewUrl(data.avatar_url || '');
        setLoading(false);
      })
      .catch((err) => {
        console.error('❌ Failed to load user:', err);
        setLoading(false);
      });
  }, [status, session?.user]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && countdown < 5) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else if (countdown === 0) {
      router.push('/user');
    }
    return () => clearTimeout(timer);
  }, [countdown, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (value: string) => {
    setForm((prev) => ({ ...prev, phone: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setShowCropper(true);
  };

  const handleDeleteAvatar = async () => {
    try {
      const res = await fetch('/api/avatar/delete', {
        method: 'POST',
        body: JSON.stringify({ url: form.avatar_url }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error();

      const updateRes = await fetch('/api/user/edit', {
        method: 'POST',
        body: (() => {
          const body = new FormData();
          body.append('id', userId.toString());
          body.append('first_name', form.first_name);
          body.append('last_name', form.last_name);
          body.append('email', form.email);
          body.append('phone', '');
          body.append('chat_app', form.chat_app);
          body.append('website', form.website);
          body.append('about_me', form.about_me);
          body.append('avatar_url', '/uploads/avatars/default.jpg');
          body.append('avatar_alt', '');
          body.append('avatar_title', '');
          return body;
        })(),
      });

      if (!updateRes.ok) throw new Error();

      setForm((prev) => ({
        ...prev,
        avatar_url: '/uploads/avatars/default.jpg',
        avatar_alt: '',
        avatar_title: '',
        phone: '',
      }));
      setPreviewUrl('/uploads/avatars/default.jpg');
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Avatar deleted');
    } catch (err) {
      toast.error('Failed to delete avatar');
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const body = new FormData();
        body.append('id', userId.toString());
        Object.entries(form).forEach(([key, val]) => {
          body.append(key, val || '');
        });

        const res = await fetch('/api/user/edit', {
          method: 'POST',
          body,
        });

        if (!res.ok) {
          const text = await res.text();
          console.error('❌ Response text:', text);
          throw new Error('❌ Failed to save user');
        }

        toast.success('Profile updated — redirecting in 3s...');
        setCountdown(2);
      } catch (err) {
        toast.error('Failed to update profile');
        console.error(err);
      }
    });
  };

  if (status === 'loading' || loading) return <Spinner />;
  if (!session) return null;

  return (
    <form onSubmit={handleSubmit} className="user-edit-form">
      <h1>Update Profile</h1>

      <div className="user-avatar-section">
        <div className="image-wrapper-avatar">
          <ImageWithFallback
            src={previewUrl}
            alt={form.avatar_alt || 'User avatar'}
            title={form.avatar_title || ''}
            className="fallback-image-avatar"
            imageType="avatar"
            wrapperClassName="image-wrapper-avatar"
          />
        </div>
        {previewUrl && (
          <button type="button" className="delete-avatar-button" onClick={handleDeleteAvatar} title="Delete avatar">
            <Trash2 size={16} /> Remove
          </button>
        )}
      </div>

      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} />
      <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="First Name" required />
      <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last Name" required />
      <input name="email" value={form.email} onChange={handleChange} placeholder="Email" type="email" required />

      <label htmlFor="phone">Phone</label>
      <PhoneNumberInput value={form.phone} onChange={handlePhoneChange} name="phone" />

      <label htmlFor="chat_app">Chat App</label>
      <div className="chat-app-wrapper">
        <select name="chat_app" value={form.chat_app} onChange={handleChange}>
          <option value="None">None</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Telegram">Telegram</option>
          <option value="Signal">Signal</option>
        </select>
        <span className="chat-icon">
          {form.chat_app === 'WhatsApp' && <Smartphone size={16} />}
          {form.chat_app === 'Telegram' && <Send size={16} />}
          {form.chat_app === 'Signal' && <MessageCircle size={16} />}
        </span>
      </div>

      <input name="website" value={form.website} onChange={handleChange} placeholder="Website" type="url" />
      <textarea name="about_me" value={form.about_me} onChange={handleChange} placeholder="About Me" />

      <ActionButton type="submit" loading={isPending}>💾 Save Changes</ActionButton>

      {showCropper && photoFile && (
        <AvatarCropModal
          file={photoFile}
          onClose={() => setShowCropper(false)}
          onUploadSuccess={(url) => {
            setForm((prev) => ({ ...prev, avatar_url: url }));
            setPreviewUrl(url);
            setPhotoFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setShowMetaModal(true);
          }}
          currentAvatarUrl={previewUrl}
        />
      )}

      {showMetaModal && (
        <AvatarMetaModal
          imageUrl={form.avatar_url}
          onConfirm={(alt, title) => {
            setForm((prev) => ({ ...prev, avatar_alt: alt, avatar_title: title }));
            setShowMetaModal(false);
          }}
          onCancel={() => setShowMetaModal(false)}
        />
      )}
    </form>
  );
}
