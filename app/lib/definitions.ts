// ==========================
// POSTS
// ==========================

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
  slug: string;
};

export type CategoryRow = {
  id: number;
};

export type PostRow = {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  created_at: string; // or Date if you're returning raw Date
  updated_at: string;
  featured_photo: string;
  status: 'pending' | 'approved' | 'draft' | 'declined';
  category: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
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
  featured_photo: string | null;
  status: 'pending' | 'approved' | 'draft' | 'declined';
  followed_by_current_user: boolean;
};

export type PostWithDetails = {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  created_at: string;
  updated_at: string;
  featured_photo: string | null;
  status: 'pending' | 'approved' | 'draft' | 'declined';
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

// ==========================
// USERS
// ==========================

export type UserRecord = {
  id: number;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
};

export type UserSummary = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  chat_app: 'WhatsApp' | 'Telegram' | 'Signal' | 'Messenger' | 'None';
  avatar_url: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  status: 'pending' | 'approved' | 'declined' | 'banned';
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
  status: 'pending' | 'approved' | 'declined' | 'banned';
  created_at: string;
};
