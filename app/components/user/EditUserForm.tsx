'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getUserFromSession } from '@/app/lib/auth/getUserFromSession';
import ActionButton from '@/app/components/global/ActionButton';
import ImageWithFallback from '@/app/components/global/ImageWithFallback';
import PhoneNumberInput from '@/app/components/global/PhoneNumberInput';
import AvatarCropModal from '@/app/components/user/images/AvatarCropModal';
import AvatarMetaModal from '@/app/components/user/images/AvatarMetaModal';
import Spinner from '@/app/components/layout/Spinner';

import { MessageCircle, Smartphone, Send, Trash2 } from 'lucide-react';

interface Country { id: number; name: string }
interface State { id: number; name: string }
interface City { id: number; name: string }

export default function EditUserForm({ userId }: { userId: number }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();

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
    country_id: '',
    state_id: '',
    city_id: '',
  });

  const [previewUrl, setPreviewUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [showMetaModal, setShowMetaModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);

  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  async function fetchCountriesClient(): Promise<Country[]> {
    const res = await fetch('/api/locations/countries');
    const data = await res.json();
    console.log('🌍 Loaded countries:', data);
    return data;
  }

  async function fetchStatesClient(countryId: number): Promise<State[]> {
    const res = await fetch(`/api/locations/states/${countryId}`);
    const data = await res.json();
    console.log(`🏙️ Loaded states for country ${countryId}:`, data);
    return data;
  }

  async function fetchCitiesClient(stateId: number): Promise<City[]> {
    const res = await fetch(`/api/locations/cities/${stateId}`);
    const data = await res.json();
    console.log(`🏘️ Loaded cities for state ${stateId}:`, data);
    return data;
  }

useEffect(() => {
  async function loadUserData() {
    if (status !== 'authenticated' || !session?.user) return;

    try {
      const [user, countriesData] = await Promise.all([
        getUserFromSession(session),
        fetchCountriesClient(),
      ]);

      if (!user) {
        console.error('❌ No user returned from session');
        return;
      }

      const updatedForm = {
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        chat_app: user.chat_app ?? 'None',
        website: user.website ?? '',
        about_me: user.about_me ?? '',
        avatar_url: user.avatar_url ?? '',
        avatar_alt: user.avatar_alt ?? '',
        avatar_title: user.avatar_title ?? '',
        country_id: user.country_id != null ? String(user.country_id) : '',
        state_id: user.state_id != null ? String(user.state_id) : '',
        city_id: user.city_id != null ? String(user.city_id) : '',
      };

      console.log('✅ Updated form:', updatedForm);
      setForm(updatedForm);
      setPreviewUrl(user.avatar_url ?? '');
      setCountries(countriesData);

      if (user.country_id != null) {
        const loadedStates = await fetchStatesClient(user.country_id);
        setStates(loadedStates);
      }

      if (user.state_id != null) {
        const loadedCities = await fetchCitiesClient(user.state_id);
        setCities(loadedCities);
      }

    } catch (err) {
      console.error('❌ Failed to load user or location data', err);
    } finally {
      setLoading(false);
    }
  }

  loadUserData();
}, [status, session]);



  useEffect(() => {
    if (countdown > 0 && countdown < 5) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      router.push('/user');
    }
  }, [countdown, router]);

  const handleChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    console.log(`✏️ Field changed: ${name} → ${value}`);
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'country_id') {
      const countryId = Number(value);
      if (!isNaN(countryId)) {
        console.log(`🔁 Reloading states for country_id ${countryId}`);
        const loadedStates = await fetchStatesClient(countryId);
        setStates(loadedStates);
        setCities([]);
        setForm((prev) => ({ ...prev, state_id: '', city_id: '' }));
      }
    }

    if (name === 'state_id') {
      const stateId = Number(value);
      if (!isNaN(stateId)) {
        console.log(`🔁 Reloading cities for state_id ${stateId}`);
        const loadedCities = await fetchCitiesClient(stateId);
        setCities(loadedCities);
        setForm((prev) => ({ ...prev, city_id: '' }));
      }
    }
  };

  const handlePhoneChange = (value: string) => {
    console.log('📞 Phone changed:', value);
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
      console.log('🗑️ Deleting avatar:', form.avatar_url);
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
          Object.entries({
            ...form,
            avatar_url: '/uploads/avatars/default.jpg',
            avatar_alt: '',
            avatar_title: '',
          }).forEach(([k, v]) => body.append(k, v || ''));
          return body;
        })(),
      });

      if (!updateRes.ok) throw new Error();

      setForm((prev) => ({
        ...prev,
        avatar_url: '/uploads/avatars/default.jpg',
        avatar_alt: '',
        avatar_title: '',
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
    console.log('📤 Submitting form data:', form);
    startTransition(async () => {
      try {
        const body = new FormData();
        body.append('id', userId.toString());
        Object.entries(form).forEach(([key, val]) => body.append(key, val || ''));

        const res = await fetch('/api/user/edit', {
          method: 'POST',
          body,
        });

        if (!res.ok) throw new Error('Failed to save user');
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
          <button type="button" className="delete-avatar-button" onClick={handleDeleteAvatar}>
            <Trash2 size={16} /> Remove
          </button>
        )}
      </div>

      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} />
      <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="First Name" required />
      <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last Name" required />
      <input name="email" value={form.email} onChange={handleChange} placeholder="Email" required type="email" />

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

      <label>Country</label>
      <select name="country_id" value={form.country_id} onChange={handleChange} required>
        <option value="">Select Country</option>
        {countries.map((c) => (
          <option key={c.id} value={String(c.id)}>{c.name}</option>
        ))}
      </select>

      <label>State</label>
      <select name="state_id" value={form.state_id} onChange={handleChange} required>
        <option value="">Select State</option>
        {states.map((s) => (
          <option key={s.id} value={String(s.id)}>{s.name}</option>
        ))}
      </select>

      <label>City</label>
      <select name="city_id" value={form.city_id} onChange={handleChange} required>
        <option value="">Select City</option>
        {cities.map((c) => (
          <option key={c.id} value={String(c.id)}>{c.name}</option>
        ))}
      </select>

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
