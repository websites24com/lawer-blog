export type Category = {
  id: number;
  name: string;
};

export type PostWithDetails = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  created_at: string;
  updated_at: string;
  featured_photo: string;
  status: 'pending' | 'approved' | 'declined' | 'draft';
  category: string;
  followed_by_current_user: boolean;
  user: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
  comments: {
    name: string;
    email: string;
    message: string;
    created_at: string;
  }[];
};
