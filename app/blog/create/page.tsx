import { db } from '@/app/lib/db';
import CreatePostForm from '@/app/components/posts/CreatePostForm';

type Category = { id: number; name: string };

export default async function NewPostPage() {
  const [rows] = await db.query('SELECT id, name FROM categories');
  const categories = JSON.parse(JSON.stringify(rows)) as Category[];

  return <CreatePostForm categories={categories} />;
}
