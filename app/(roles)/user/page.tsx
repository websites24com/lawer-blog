'use client';

import { useEffect, useState, useTransition } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

import ImageWithFallback from '@/app/components/ImageWithFallback';
import FollowButton from '@/app/components/FollowButton';
import ActionButton from '@/app/components/ActionButton';
import { unfollowPost } from '@/app/actions/posts';

import type { UserRow, PostSummary, Comment } from '@/app/lib/definitions';

export default function UserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<(UserRow & {
    posts: PostSummary[];
    comments: Comment[];
    followed_posts: PostSummary[];
  }) | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'USER') {
        router.push('/admin');
        return;
      }

      const query = session.user.email
        ? `email=${encodeURIComponent(session.user.email)}`
        : session.user.id
        ? `providerId=${encodeURIComponent(session.user.id)}`
        : '';

      if (!query) return;

      fetch(`/api/user?${query}`)
        .then((res) => res.json())
        .then((data) => {
          setUserData(data);
        })
        .catch((err) => {
          console.error('❌ Failed to fetch user data:', err);
        });
    }
  }, [status, session, router]);

  if (status === 'loading' || (status === 'authenticated' && !userData)) {
    return <p>Loading user data...</p>;
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  const handleUnfollow = async (postId: number) => {
    startTransition(async () => {
      try {
        await unfollowPost(postId);
        setUserData((prev) =>
          prev
            ? {
                ...prev,
                followed_posts: prev.followed_posts.filter((p) => p.id !== postId),
              }
            : prev
        );
        toast.success('Post unfollowed');
      } catch (err) {
        console.error('❌ Failed to unfollow post', err);
        toast.error('Failed to unfollow post');
      }
    });
  };

  const handleDeletePost = (postId: number) => {
    confirmAlert({
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this post?',
      buttons: [
        {
          label: 'Yes',
          onClick: () => {
            startTransition(async () => {
              try {
                const res = await fetch(`/api/user/posts/delete/${postId}`, {
                  method: 'DELETE',
                });

                if (!res.ok) throw new Error('Failed to delete post');

                setUserData((prev) =>
                  prev ? { ...prev, posts: prev.posts.filter((p) => p.id !== postId) } : prev
                );
                toast.success('Post deleted');
              } catch (err) {
                console.error('❌ Failed to delete post', err);
                toast.error('Failed to delete post');
              }
            });
          },
        },
        {
          label: 'No',
        },
      ],
    });
  };

  const createdDisplay = new Date(userData!.created_at).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className="user-dashboard">
      <h1>👤 My Account</h1>

      <section>
        <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
          <ImageWithFallback
            src={userData!.avatar_url || ''}
            alt={`${userData!.first_name} ${userData!.last_name}`}
            className="fallback-image-avatar"
            wrapperClassName=""
            imageType="avatar"
          />
        </div>

        <p><strong>Name:</strong> {userData!.first_name} {userData!.last_name}</p>
        <p><strong>Email:</strong> {userData!.email || '—'}</p>
        <p><strong>Phone:</strong> {userData!.phone || '—'} ({userData!.chat_app || 'None'})</p>
        <p><strong>Status:</strong> {userData!.status}</p>
        <p><strong>Role:</strong> {userData!.role}</p>
        <p><strong>Provider:</strong> {userData!.provider || '—'}</p>
        <p><strong>Account ID:</strong> {userData!.provider_account_id || '—'}</p>
        <p><strong>Created:</strong> {createdDisplay}</p>

        <div className="actions">
          <ActionButton onClick={() => router.push('/user/update')}>✏️ Update Profile</ActionButton>
          <ActionButton onClick={() => router.push('/user/delete')}>🗑 Delete Account</ActionButton>
        </div>
      </section>

      <section>
        <h2>📝 My Posts</h2>
        <ActionButton onClick={() => router.push('/blog/create')}>➕ Create Post</ActionButton>
        {userData!.posts?.length === 0 ? (
          <p>You haven’t written any posts yet.</p>
        ) : (
          <ul className="user-post-list">
            {userData!.posts.map((post) => (
              <li key={post.id} className="user-post-item">
                <ImageWithFallback
                  src={post.featured_photo || '/uploads/posts/default.jpg'}
                  alt={post.title}
                  className="post-thumbnail"
                  imageType="bike"
                />
                <div>
                  <strong>{post.title}</strong> — {new Date(post.created_at).toLocaleDateString()} ({post.category})
                  <div>
                    <ActionButton onClick={() => router.push(`/blog/${post.slug}`)}>View</ActionButton>
                    <ActionButton onClick={() => router.push(`/blog/edit/${post.slug}`)}>Edit</ActionButton>
                    <ActionButton onClick={() => handleDeletePost(post.id)}>Delete</ActionButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>💬 My Comments</h2>
        {userData!.comments?.length === 0 ? (
          <p>You haven’t commented on any posts yet.</p>
        ) : (
          <ul>
            {userData!.comments.map((comment) => (
              <li key={comment.id}>
                <p><strong>{new Date(comment.created_at).toLocaleDateString()}</strong></p>
                <p>{comment.message}</p>
                <div>
                  <ActionButton onClick={() => router.push(`/comments/${comment.id}/edit`)}>✏️ Edit</ActionButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>⭐ Followed Posts</h2>
        {userData!.followed_posts?.length === 0 ? (
          <p>You haven’t followed any posts yet.</p>
        ) : (
          <ul>
            {userData!.followed_posts.map((post) => (
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
