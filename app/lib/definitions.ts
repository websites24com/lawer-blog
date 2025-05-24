export type Comment = {
  id: number;
  name: string;
  email: string | null;
  message: string;
  created_at: string;
};

export type Category = {
  id: number;
  name: string;
};

export type PostSummary = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  created_at: string;
  category: string;
  user: {
    first_name: string;
    last_name: string;
  };
  avatar_url: string | null;
  followed_by_current_user: boolean; // ✅ NEW
};

export type PostWithDetails = {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  created_at: string;
  updated_at: string;
  featured_photo: string | null; // ✅ add this
  status: 'pending' | 'approved' | 'draft' | 'declined'; // ✅ optional if you want status
  category: string;
  followed_by_current_user: boolean;
  user: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  comments: {
    name: string;
    email: string | null;
    message: string;
    created_at: string;
  }[];
};


// Auth user row
export type UserRecord = {
  id: number;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
};

// User (Advertiser) Info
export type UserSummary = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  chat_app: 'WhatsApp' | 'Telegram' | 'Signal' | 'Messenger' | 'None';
  avatar_url: string;
};

export type UserRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  password: string | null;
  phone: string | null;
  chat_app: 'WhatsApp' | 'Telegram' | 'Signal' | 'Messenger' | 'None';
  avatar_url: string | null;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  provider: string | null;
  provider_account_id: string | null;
  created_at: string;
};
