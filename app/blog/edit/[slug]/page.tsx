import { getPostBySlug, getAllCategories } from '@/app/lib/posts';
import EditPostForm from '@/app/components/EditPostForm';
import { notFound } from 'next/navigation';
import { auth } from '@/app/lib/auth';

type Props = {
  params: { slug: string };
};

export default async function EditPostPage({ params }: Props) {
  const { slug } = params;

  // ✅ Get current user session to extract userId
  const session = await auth();
  const userId = session?.user?.id || 0;

  // ✅ Pass userId to getPostBySlug
  const post = await getPostBySlug(slug, userId);
  if (!post) return notFound();

  const categories = await getAllCategories();

  return <EditPostForm post={post} categories={categories} />;
}
