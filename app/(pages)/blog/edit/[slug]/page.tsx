import { getPostBySlug, getAllCategories } from '@/app/lib/posts';
import EditPostForm from '@/app/components/posts/EditPostForm';
import { notFound, redirect } from 'next/navigation';

import { requireAuth } from '@/app/lib/auth/requireAuth';
import { ROLES } from '@/app/lib/definitions';

type Props = {
  params: { slug: string };
};

export default async function EditPostPage({ params }: Props) {
  const { slug } = params;

  // ✅ Require user and role (returns { session, user })
  const { user } = await requireAuth({
    roles: [ROLES.USER, ROLES.MODERATOR, ROLES.ADMIN],
  });

  // ✅ Load post without filtering by user
  const post = await getPostBySlug(slug);
  if (!post) return notFound();

  // ✅ Access check: owner or elevated role
  const isOwner = post.user_id === user.id;
  const isPrivileged = [ROLES.ADMIN, ROLES.MODERATOR].includes(user.role);

  if (!isOwner && !isPrivileged) {
    redirect('/unauthorized');
  }

  // ✅ Load categories
  const categories = await getAllCategories();

  return <EditPostForm post={post} categories={categories} />;
}
