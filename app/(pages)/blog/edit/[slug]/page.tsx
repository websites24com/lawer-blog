import {
  getPostBySlug,
  getAllCategories,
  getAllLanguages,
  getAllCountries,
} from '@/app/lib/posts';

import EditPostForm from '@/app/components/blog/posts/EditPostForm';
import { notFound, redirect } from 'next/navigation';
import { requireAuth } from '@/app/lib/auth/requireAuth';
import { ROLES } from '@/app/lib/definitions';

type Props = {
  params: { slug: string };
};

export default async function EditPostPage({ params }: Props) {
  const { slug } = params;

  // ✅ Require login and role
  const { user } = await requireAuth({
    roles: [ROLES.USER, ROLES.MODERATOR, ROLES.ADMIN],
  });

  // ✅ Load post with user context
  const post = await getPostBySlug(slug, user.id);
  if (!post) return notFound();

  // ✅ Allow only post owner or privileged roles
  const isOwner = post.user_id === user.id;
  const isPrivileged = ['MODERATOR', 'ADMIN'];
  if (!isOwner && !isPrivileged) {
    redirect('/unauthorized');
  }

  // ✅ Load select field data
  const categories = await getAllCategories();
  const languages = await getAllLanguages();
  const countries = await getAllCountries();

  // ✅ Render form with all props
  return (
    <EditPostForm
      post={post}
      categories={categories}
      languages={languages}
      countries={countries}
    />
  );
}
