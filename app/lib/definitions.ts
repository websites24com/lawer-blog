export type UserRow = {
  id: number;
  first_name: string;
  last_name: string;
  slug: string;
  email: string | null;
  password: string | null;
  phone: string | null;
  chat_app: 'WhatsApp' | 'Telegram' | 'Signal' | 'None';
  avatar_url: string | null;
  avatar_alt: string | null;
  avatar_title: string | null;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  status: 'pending' | 'approved' | 'declined' | 'frozen';
  provider: string | null;
  provider_account_id: string | null;
  website: string | null;
  about_me: string | null;
  created_at: string;
};

export type SimpleUser = {
  id: number;
  first_name: string;
  last_name: string;
  slug: string;
  avatar_url: string | null;
};

export type PostSummary = {
  id: number;
  slug: string;
  title: string;
  status: string;
  featured_photo: string | null;
};

export type Comment = {
  id: number;
  post_id: number;
  user_id: number | null;
  name: string;
  email: string | null;
  message: string;
  created_at: string;
};

export type FullUserData = UserRow & {
  posts: PostSummary[];
  comments: Comment[];
  followed_posts: PostSummary[];
  followers: SimpleUser[];
};

export type Category = {
  id: number;
  name: string;
  slug: string;
};

export type PostWithDetails = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featured_photo: string | null;
  photo_alt: string | null;
  photo_title: string | null;
  status: 'pending' | 'approved' | 'draft' | 'declined';
  user_id: number | null;
  category_id: number | null;
  created_at: string;
  updated_at: string;
};
