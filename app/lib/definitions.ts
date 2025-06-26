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

type PaginationParams = {
  postsPage?: number;
  commentsPage?: number;
  followersPage?: number;
  followedPage?: number;
  pageSize?: number;
};


export type Comment = {
  id: number;
  post_id: number;
  parent_id: number | null;
  message: string;
  created_at: string;
  status?: 'pending' | 'approved' | 'declined';
  edited_by?: number | null;
  edited_at?: string | null;

  // 👇 Required for showing post info in user profile
  post_slug: string;
  post_title?: string;

  // 👇 Optional: if you're showing user info inside comments
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
};


export type CommentWithUser = {
  id: number;
  post_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  message: string;
  parent_id: number | null;
  status: 'pending' | 'approved' | 'declined';
  created_at: string;
  edited_by: number | null;
  edited_at: string | null;
  replies: CommentWithUser[]; // ✅ Nested support
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
  edited_by: number | null;
  edited_at: string | null;
  user: SimpleUser;
  category: Category;
  followed_by_current_user?: boolean;
  comments: CommentWithUser[];
};


// Geolocation

export type formRef = React.RefObject<HTMLFormElement>;