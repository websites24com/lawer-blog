'use client';

import { useEffect, useState, useTransition } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import ImageWithFallback from '@/app/components/ImageWithFallback';
import FollowButton from '@/app/components/FollowButton';
import ActionButton from '@/app/components/ActionButton';
import { unfollowPost } from '@/app/actions/posts';

export default function UserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const query = session.user.email
        ? `email=${encodeURIComponent(session.user.email)}`
        : session.user.id
        ? `providerId=${encodeURIComponent(session.user.id)}`
        : '';
  
      if (!query) return;
  
      fetch(`/api/user?${query}`)
        .then(res => res.json())
        .then(data => setUserData(data))
        .catch(err => console.error('❌ Failed to fetch user data', err));
    }
  }, [status, session]);
  

  if (status === 'loading') return <p>Loading...</p>;
  if (!session) {
    router.push('/login');
    return null;
  }

  if (!userData) return <p>No user data found.</p>;

  const handleUnfollow = async (postId: number) => {
    startTransition(async () => {
      try {
        await unfollowPost(postId);
        setUserData((prev: any) => ({
          ...prev,
          followed_posts: prev.followed_posts.filter((p: any) => p.id !== postId),
        }));
      } catch (err) {
        console.error('❌ Failed to unfollow post', err);
      }
    });
  };

  return (
    <div className="user-dashboard">
      <h1>👤 My Account</h1>

      <section>
        {userData.avatar_url && (
          <div className="avatar-wrapper">
            <ImageWithFallback
              src={userData.avatar_url}
              alt={`${userData.first_name} ${userData.last_name}`}
              className="fallback-image-avatar"
              wrapperClassName="image-wrapper-avatar"
              imageType="avatar"
            />
          </div>
        )}

        <p><strong>Name:</strong> {userData.first_name} {userData.last_name}</p>
        <p><strong>Email:</strong> {userData.email || '—'}</p>
        <p><strong>Phone:</strong> {userData.phone || '—'} ({userData.chat_app || 'None'})</p>

        <div className="actions">
          <ActionButton onClick={() => router.push('/user/update')} title="Update Profile">✏️ Update Profile</ActionButton>
          <ActionButton onClick={() => router.push('/user/delete')} title="Delete Account">🗑 Delete Account</ActionButton>
        </div>
      </section>

      <section>
        <h2>📝 My Posts</h2>
        <ActionButton onClick={() => router.push('/blog/new')} title="New Post">➕ New Post</ActionButton>
        {userData.posts?.length === 0 ? (
          <p>You haven’t written any posts yet.</p>
        ) : (
          <ul>
            {userData.posts.map((post: any) => (
              <li key={post.id}>
                <strong>{post.title}</strong> — {new Date(post.created_at).toLocaleDateString()} ({post.category})
                <div>
                  <ActionButton onClick={() => router.push(`/blog/${post.slug}`)}>View</ActionButton>
                  <ActionButton onClick={() => router.push(`/blog/${post.id}/edit`)}>Edit</ActionButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>💬 My Comments</h2>
        {userData.comments?.length === 0 ? (
          <p>You haven’t commented on any posts yet.</p>
        ) : (
          <ul>
            {userData.comments.map((comment: any) => (
              <li key={comment.id}>
                <p>
                  <strong>{new Date(comment.created_at).toLocaleDateString()}</strong> on <em>{comment.post_title}</em>
                </p>
                <p>{comment.message}</p>
                <div>
                  <ActionButton onClick={() => router.push(`/comments/${comment.id}/edit`)}>✏️ Edit</ActionButton>
                  <ActionButton onClick={() => router.push(`/blog/${comment.post_slug}`)}>View Post</ActionButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>⭐ Followed Posts</h2>
        {userData.followed_posts?.length === 0 ? (
          <p>You haven’t followed any posts yet.</p>
        ) : (
          <ul>
            {userData.followed_posts.map((post: any) => (
              <li key={post.id}>
                <strong>{post.title}</strong> — {new Date(post.created_at).toLocaleDateString()} ({post.category})
                <div>
                  <ActionButton onClick={() => router.push(`/blog/${post.slug}`)}>View</ActionButton>
                  <FollowButton postId={post.id} initiallyFollowing={true} onToggle={() => handleUnfollow(post.id)} />

                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="logout-section">
        <ActionButton onClick={() => signOut({ callbackUrl: '/' })}>🚪 Logout</ActionButton>
      </section>
    </div>
  );
}
