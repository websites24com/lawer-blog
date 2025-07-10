'use client';

import { useState, useRef, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ActionButton from '@/app/components/global/ActionButton';
import ImageWithFallback from '@/app/components/global/ImageWithFallback';
import RichTextEditor from '@/app/components/global/RichTextEditor';
import ImageCropModal from '@/app/components/posts/images/ImageCropModal';
import TagInput from '@/app/components/posts/TagInput'; // ✅ NEW
import { Icon } from '@iconify/react';
import type { Category, Language, Country, State, City } from '@/app/lib/definitions'; 


let previewWindow: Window | null = null;

interface CreatePostFormProps {
  categories: Category[];
  languages: Language[];
  countries: Country[];
}


export default function CreatePostForm({ categories, languages, countries: initialCountries }: CreatePostFormProps) {
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    country_id: '',
    state_id: '',
    city_id: '',
    content: '',
    category_id: categories[0]?.id.toString() || '1',
    language_id: languages[0]?.id.toString() || '1',
    featured_photo: '/uploads/posts/default.jpg',
    tags: '',
  });

  // States

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const [excerptCount, setExcerptCount] = useState(0);
  const [titleCount, setTitleCount] = useState(0);
  const [contentCount, setContentCount] = useState(0);
  const [isPreviewReady, setIsPreviewReady] = useState(false);

  const countries = initialCountries;

  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingStates, setLoadingStates] = useState(false); // 🔄 new line
  const [loadingCities, setLoadingCities] = useState(false); // 🔄 new line



  

 async function fetchStatesClient(countryId: number): Promise<State[]> {
  setLoadingStates(true); // ⏳ start spinner
  try {
    const res = await fetch(`/api/locations/states/${countryId}`);
    const data = await res.json();
    console.log(`🏙️ Loaded states for country ${countryId}:`, data);
    return data;
  } finally {
    setLoadingStates(false); // ✅ stop spinner
  }
}


 async function fetchCitiesClient(stateId: number): Promise<City[]> {
  setLoadingCities(true); // ⏳ start spinner
  try {
    const res = await fetch(`/api/locations/cities/${stateId}`);
    const data = await res.json();
    console.log(`🏘️ Loaded cities for state ${stateId}:`, data);
    return data;
  } finally {
    setLoadingCities(false); // ✅ stop spinner
  }
}

const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  const { name, value } = e.target;
  setForm(prev => {
    const updated = { ...prev, [name]: value };
    sendPreviewData(updated);
    return updated;
  });

  if (name === 'country_id') {
    const countryId = Number(value);
    if (!isNaN(countryId)) {
      const loadedStates = await fetchStatesClient(countryId);
      setStates(loadedStates);
      setCities([]);
      setForm(prev => ({ ...prev, state_id: '', city_id: '' }));
    }
  }

  if (name === 'state_id') {
    const stateId = Number(value);
    if (!isNaN(stateId)) {
      const loadedCities = await fetchCitiesClient(stateId);
      setCities(loadedCities);
      setForm(prev => ({ ...prev, city_id: '' }));
    }
  }

  if (name === 'excerpt') setExcerptCount(value.length);
  if (name === 'title') setTitleCount(value.length);
};


  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
      setShowCropper(true);
    }
  };

  const handleDeletePhoto = () => {
    setForm(prev => {
      const updated = { ...prev, featured_photo: '/uploads/posts/default.jpg' };
      sendPreviewData(updated);
      return updated;
    });
    setPhotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleContentChange = (value: string) => {
    setForm(prev => {
      const updated = { ...prev, content: value };
      sendPreviewData(updated);
      return updated;
    });
    setContentCount(value.length);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('excerpt', form.excerpt);
        formData.append('content', form.content);
        formData.append('category_id', form.category_id);
        formData.append('featured_photo_url', form.featured_photo);
        formData.append('tags', form.tags || '');
        formData.append('country_id', form.country_id);
        formData.append('language_id', form.language_id);
        formData.append('state_id', form.state_id);
        formData.append('city_id', form.city_id);


        if (previewWindow && !previewWindow.closed) previewWindow.close();

        const res = await fetch('/api/user/posts/create', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unknown error');
        router.refresh();
        router.push('/user');
      } catch (err) {
        console.error('🛑 CreatePost error:', err);
      }
    });
  };

  const sendPreviewData = (customForm?: typeof form) => {
    if (previewWindow && !previewWindow.closed) {
      previewWindow.postMessage(
        {
          type: 'preview-data',
          payload: {
            ...(customForm || form),
            user: {
              first_name: 'User',
              last_name: 'Preview',
              avatar_url: '/uploads/avatars/default.jpg',
            },
            comments: [],
            followed_by_current_user: false,
            id: 0,
            slug: 'live-preview',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        },
        window.location.origin
      );
    }
  };

  const openLivePreview = () => {
    if (!previewWindow || previewWindow.closed) {
      previewWindow = window.open('/blog/posts/preview', 'livePreview', 'width=1024,height=800');
    } else {
      sendPreviewData();
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data?.type === 'ready-for-preview') {
        setIsPreviewReady(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (isPreviewReady) {
      sendPreviewData();
    }
  }, [form, isPreviewReady]);

  return (
    <form className="post-form" onSubmit={handleSubmit}>
      <label htmlFor="title">Title:</label>
      <input
        id="title"
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="SEO-friendly title (max 70 characters)"
        maxLength={70}
        required
      />
      <small className="char-counter">{titleCount}/70</small>

      <label htmlFor="excerpt">Excerpt:</label>
      <textarea
        id="excerpt"
        name="excerpt"
        value={form.excerpt}
        onChange={handleChange}
        placeholder="Brief excerpt (max 160 characters)"
        maxLength={160}
        required
      />
      <small className="char-counter">{excerptCount}/160</small>

      <label htmlFor="content">Content:</label>
      <RichTextEditor value={form.content} onChange={handleContentChange} />
      <small className="char-counter">{contentCount}/10000</small>

      <label htmlFor="tags">Tags (hashtags):</label>
      <TagInput
        value={form.tags}
        onChange={(tagsString) => {
          setForm(prev => {
            const updated = { ...prev, tags: tagsString };
            sendPreviewData(updated);
            return updated;
          });
        }}
      />
      <small className="char-hint">
        Separate with spaces – max 10 – must begin with <strong>#</strong>
      </small>

      <label>Country</label>
<select name="country_id" value={form.country_id} onChange={handleChange} required>
  <option value="">Select Country</option>
  {countries.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
</select>

<label>State</label>
{loadingStates ? (
  <div >Loading states...</div> // 🌀 You can replace with <Spinner /> component if you have one
) : (
  <select name="state_id" value={form.state_id} onChange={handleChange} required>
    <option value="">Select State</option>
    {states.map(s => (
      <option key={s.id} value={String(s.id)}>{s.name}</option>
    ))}
  </select>
)}

<label>City</label>
{loadingCities ? (
  <div >Loading cities...</div> // 🌀 Replace with your <Spinner /> if available
) : (
  <select name="city_id" value={form.city_id} onChange={handleChange} required>
    <option value="">Select City</option>
    {cities.map(c => (
      <option key={c.id} value={String(c.id)}>{c.name}</option>
    ))}
  </select>
)}


<label htmlFor="category_id">Category:</label>
      <select name="category_id" value={form.category_id} onChange={handleChange}>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
<label htmlFor="language_id">Language:</label>
<select
  name="language_id"
  value={form.language_id}
  onChange={handleChange}
  required
>
  <option value="">Select Language</option>
  {languages.map((lang) => (
    <option key={lang.id} value={String(lang.id)}>
      {lang.name}
    </option>
  ))}
</select>


      <label>Current Photo:</label>
      <div className="image-wrapper">
        <ImageWithFallback
          key={form.featured_photo}
          src={form.featured_photo || '/uploads/posts/default.jpg'}
          alt="Post photo preview"
          imageType="post"
        />
      </div>

      <div className="photo-actions">
        <ActionButton type="button" onClick={handleDeletePhoto} disabled={isPending} title="Delete Photo">
          <Icon icon="twemoji:wastebasket" width="20" height="20" /> Delete
        </ActionButton>
        <ActionButton type="button" onClick={openLivePreview} disabled={isPending} title="Live Preview">
          <Icon icon="twemoji:eye" width="20" height="20" /> Preview
        </ActionButton>
      </div>

      <input type="file" accept="image/*" onChange={handlePhotoChange} ref={fileInputRef} disabled={isPending} />

      <ActionButton type="submit" loading={isPending} disabled={isPending} title="Create Post">
        <Icon icon="twemoji:rocket" width="20" height="20" /> Create Post
      </ActionButton>

      {showCropper && photoFile && (
        <ImageCropModal
          file={photoFile}
          currentPhotoUrl={form.featured_photo}
          onClose={() => setShowCropper(false)}
          onUploadSuccess={(url) => {
            setForm(prev => {
              const updated = { ...prev, featured_photo: url };
              sendPreviewData(updated);
              return updated;
            });
            setPhotoFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
        />
      )}
    </form>
  );
}
