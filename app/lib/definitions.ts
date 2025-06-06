// ✅ Category used for post classification
export type Category = {
  id: number;
  name: string;
};

// ✅ Lightweight user for follow lists
export type SimpleUser = {
  id: number;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  created_at: string;
};

// ✅ Summary of a post, shown in lists/dashboards
export type PostSummary = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  created_at: string;
  category: string | null;
  featured_photo: string | null;
  followed_by_current_user: boolean;
  user: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    slug: string; // ✅ required for author links
  };
};

// ✅ Full post detail with content and comments
export type PostWithDetails = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  created_at: string;
  updated_at: string;
  featured_photo: string | null;
  photo_alt?: string | null;
  photo_title?: string | null;
  status: 'pending' | 'approved' | 'declined' | 'draft';
  category: string | null;
  category_id: number | null; // ✅ required in edit form
  followed_by_current_user: boolean;
  user: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    slug: string; // ✅ required for author links
  };
  comments: {
    name: string;
    email: string;
    message: string;
    created_at: string;
  }[];
};

// ✅ Comment structure
export type Comment = {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
};

// ✅ User table (MySQL structure)
export type UserRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string | null;
  phone: string | null;
  chat_app: string | null;
  avatar_url: string | null;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  status: 'active' | 'pending' | 'declined';
  provider: string | null;
  provider_account_id: string | null;
  created_at: string;
  website?: string | null;
  about_me?: string | null;
  slug: string; // ✅ required for profile URLs
  avatar_alt?: string | null;
  avatar_title?: string | null;
};

// ✅ User + relationships (for dashboards/profiles)
export type FullUserData = UserRow & {
  posts: {
    id: number;
    title: string;
    status: 'pending' | 'approved' | 'declined' | 'draft';
  }[];
  comments: Comment[];
  followed_posts: {
    id: number;
    title: string;
    slug: string;
  }[];
  followers: SimpleUser[];
};
