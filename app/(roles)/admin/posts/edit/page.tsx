import { getPostById } from '@/app/actions/admin-posts';
import { getAllCategories } from '@/app/lib/admin';
import EditPostForm from '@/app/components/EditPostForm';

type Props = {
  searchParams: { id?: string };
};

export default async function AdminPostEditPage({ searchParams }: Props) {
  const postId = Number(searchParams.id);
  if (!postId) return <p>Missing or invalid post ID</p>;

  const [post, categories] = await Promise.all([
    getPostById(postId),
    getAllCategories(),
  ]);

  return (
    <div>
      <h1>Edit Post</h1>
      <EditPostForm
        postId={postId}
        categories={categories}
        initialForm={{
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          category: post.category,
          status: post.status,
          featured_photo: post.featured_photo || '',
        }}
      />
    </div>
  );
}
