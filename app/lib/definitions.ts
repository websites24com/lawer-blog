export type Comment = {
  id: number;
  name: string;
  email: string | null;
  message: string;
  created_at: string;
};

export type PostDetails = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  author: string;
  category: string;
  comments: Comment[];
};
