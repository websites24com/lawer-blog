// ---------- USER ROLES ----------
export const ROLES = {
  USER: 'USER',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
export const ALL_ROLES: UserRole[] = Object.values(ROLES);

// ---------- SESSION ----------
export type SessionUser = {
  id: number;
  email: string | null;
  role: UserRole;
  avatar_url: string | null;
  provider: string | null;
  provider_account_id: string | null;
};

// ---------- USER TYPES ----------
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
  role: UserRole;
  status: 'pending' | 'approved' | 'declined' | 'frozen';
  provider: string | null;
  provider_account_id: string | null;
  website: string | null;
  about_me: string | null;
  country_id: number | null;
  state_id: number | null;
  city_id: number | null;
  location: { lat: number; lon: number };
  created_at: string;
};

export type SimpleUser = {
  id: number;
  first_name: string;
  last_name: string;
  slug: string;
  avatar_url: string | null;
};

export type FullUserData = UserRow & {
  country_name: string | null;
  state_name: string | null;
  city_name: string | null;
  posts: PostSummary[];
  comments: Comment[];
  followed_posts: PostSummary[];
  followers: SimpleUser[];
};

// ---------- POST TYPES ----------
export type PostSummary = {
  id: number;
  slug: string;
  created_at: string;
  title: string;
  excerpt: string;
  status: 'approved'; // enforced in getPostsByCategorySlug
  featured_photo: string | null;
  photo_alt: string | null;
  country_name?: string | null;
  state_name?: string | null;
  city_name?: string | null;
 category: Category | null;

  followed_by_current_user: boolean;
  tags: string[];
  user: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    slug: string;
  };
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
  country_id: number | null;
  state_id: number | null;
  city_id: number | null;
  country_name: string | null;
  state_name: string | null;
  city_name: string | null;
  location: { lat: number; lon: number };
  user: SimpleUser;
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
  followed_by_current_user: boolean;
  comments: CommentWithUser[];
  tags: string[];
};

// ---------- COMMENT TYPES ----------
export type Comment = {
  id: number;
  post_id: number;
  parent_id: number | null;
  message: string;
  created_at: string;
  status: 'pending' | 'approved' | 'declined';
  edited_by: number | null;
  edited_at: string | null;
  post_slug: string;
  post_title: string | null;
};

export type CommentWithUser = Comment & {
  user: SimpleUser;
  replies: CommentWithUser[];
};

// ---------- CATEGORY ----------
export type Category = {
  id: number;
  name: string;
  slug: string;
};

// ---------- PAGINATION ----------
export type PaginationParams = {
  postsPage?: number;
  commentsPage?: number;
  followersPage?: number;
  followedPage?: number;
  pageSize?: number;
};

// ---------- REFS ----------
export type formRef = React.RefObject<HTMLFormElement>;
