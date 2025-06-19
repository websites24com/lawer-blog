'use client';

import { useEffect, useState, useTransition } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

import ImageWithFallback from '@/app/components/ImageWithFallback';
import FollowPostButton from '@/app/components/posts/FollowPostButton';
import ActionButton from '@/app/components/ActionButton';
import Spinner from '@/app/components/Spinner';
import FancyDate from '@/app/components/FancyDate';
import { unfollowPost } from '@/app/actions/posts';

import type { UserRow, PostSummary, Comment, SimpleUser } from '@/app/lib/definitions';
import RenderWebsite from '@/app/components/RenderWebsite';
import TimeFromDate from '@/app/components/TimeFromDate';
import RenderPhone from '@/app/components/RenderPhone';
import { formatOrDash } from '@/app/utils/formatOrDash';
import RenderEmail from '@/app/components/RenderEmail';

type FullUserData = UserRow & {
  posts: PostSummary[];
  comments: Comment[];
  followed_posts: PostSummary[];
  followers: SimpleUser[];
};

export default function UserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<FullUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const query = session.user.email
        ? `email=${encodeURIComponent(session.user.email)}`
        : session.user.provider_account_id
        ? `providerId=${encodeURIComponent(session.user.provider_account_id)}`
        : '';

      if (!query) return;

      fetch(`/api/user?${query}`)
        .then((res) => res.json())
        .then((data) => {
          setUserData(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('❌ Failed to fetch user data:', err);
          setLoading(false);
        });
    }
  }, [status, session]);

  if (status === 'loading' || loading) return <Spinner />;
  if (!session || !session.user) {
    router.push('/login');
    return null;
  }
  if (!userData) return <p>Error loading user data.</p>;

  // ✅ Ensure correct avatar display for uploads, external URLs, and fallback
  const resolvedAvatarUrl =
    userData.avatar_url?.startsWith('http') || userData.avatar_url?.startsWith('/uploads/avatars/')
      ? userData.avatar_url
      : `/uploads/avatars/${userData.avatar_url}`;

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
        { label: 'No' },
      ],
    });
  };

  return (
    <div className="user-profile-container">
      <h1>👤 My Account</h1>

      <div className="user-avatar-section">
        <div className="image-wrapper-avatar">
          <ImageWithFallback
            src={resolvedAvatarUrl || '/uploads/avatars/default.jpg'}
            alt={`${userData.first_name} ${userData.last_name}`}
            className="fallback-image-avatar"
            wrapperClassName="image-wrapper-avatar"
            imageType="avatar"
          />
        </div>
        <p className="user-name">
          {userData.first_name} {userData.last_name}
        </p>
      </div>

      <div className="user-info-block">
        <p><strong>Email:</strong> <RenderEmail email={userData.email} /></p>
        <p><strong>Phone:</strong> <RenderPhone phone={userData.phone}/> {userData.chat_app ? `(${userData.chat_app})` : ''}</p>
        <p><strong>Website:</strong> <RenderWebsite url={userData.website}/></p>
        <p><strong>About Me:</strong> {formatOrDash(userData.about_me)}</p>
        <p><strong>Provider:</strong> {formatOrDash(userData.provider)}</p>
        <p><strong>Account ID:</strong> {userData.provider_account_id || userData.id}</p>
        <p><strong>Role:</strong> {formatOrDash(userData.role)}</p>
        <p><strong>Status:</strong> {formatOrDash(userData.status)}</p>
        <p><strong>Created At:</strong> <FancyDate dateString={userData.created_at} /></p>
        <p><strong>User is with us from:</strong> <TimeFromDate date={userData.created_at} /></p>
        <div className="actions">
          <ActionButton onClick={() => router.push('/user/edit')}>✏️ Update Profile</ActionButton>
          <ActionButton onClick={() => router.push('/user/delete')}>🗑 Delete Account</ActionButton>
        </div>
      </div>

      <div className="user-section">
        <h2>📝 My Posts</h2>
        <ActionButton onClick={() => router.push('/blog/create')} title="Create a new blog post">
          ➕ Create Post
        </ActionButton>
        {userData.posts?.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {userData.posts.map((post) => (
              <li key={post.id} style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #ccc' }}>
                <div style={{ maxWidth: '300px', marginBottom: '0.5rem' }}>
                  <ImageWithFallback
                    src={post.featured_photo || '/uploads/posts/default.jpg'}
                    alt={post.title}
                    className="fallback-image"
                    wrapperClassName="image-wrapper"
                    imageType="post"
                  />
                </div>
                <strong>{post.title}</strong> ({post.status})
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <ActionButton onClick={() => router.push(`/blog/${post.slug}`)} title="View this post">👁️ View</ActionButton>
                  <ActionButton onClick={() => router.push(`/blog/edit/${post.slug}`)} title="Edit this post">✏️ Edit</ActionButton>
                  <ActionButton onClick={() => handleDeletePost(post.id)} title="Delete this post">🗑️ Delete</ActionButton>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>You haven’t published any posts.</p>
        )}
      </div>

      <div className="user-section">
        <h2>⭐ Followed Posts</h2>
        {userData.followed_posts?.length > 0 ? (
          <ul>
            {userData.followed_posts.map((post) => (
              <li key={post.id}>
                <div style={{ maxWidth: '300px', marginBottom: '0.5rem' }}>
                  <ImageWithFallback
                    src={post.featured_photo || '/uploads/posts/default.jpg'}
                    alt={post.title}
                    className="fallback-image"
                    wrapperClassName="image-wrapper"
                    imageType="post"
                  />
                </div>
                <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">{post.title}</a>
                <FollowPostButton postId={post.id} initiallyFollowing={true} onUnfollow={() => handleUnfollow(post.id)} />
              </li>
            ))}
          </ul>
        ) : (
          <p>You haven’t followed any posts yet.</p>
        )}
      </div>

      <div className="user-section">
        <h2>🗨️ My Comments</h2>
        {userData.comments?.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {userData.comments.map((comment, idx) => (
              <li key={idx} style={{ marginBottom: '1.5rem', borderBottom: '1px solid #ddd', paddingBottom: '1rem' }}>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>{comment.name}</strong>{' '}
                  <span style={{ color: '#666' }}>— <FancyDate dateString={comment.created_at} /></span>
                </p>
                <p style={{ whiteSpace: 'pre-wrap' }}>{comment.message}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>You haven’t posted any comments yet.</p>
        )}
      </div>

      <div className="user-section">
        <h2>👥 Followers</h2>
        {userData.followers?.length > 0 ? (
          <ul>
            {userData.followers.map((follower) => {
              const avatar =
                follower.avatar_url?.startsWith('http') || follower.avatar_url?.startsWith('/uploads/avatars/')
                  ? follower.avatar_url
                  : `/uploads/avatars/${follower.avatar_url}`;

              return (
                <li key={follower.id}>
                  <div className="image-wrapper-avatar">
                    <ImageWithFallback
                      src={avatar || '/uploads/avatars/default.jpg'}
                      alt={`${follower.first_name} ${follower.last_name}`}
                      className="fallback-image-avatar"
                      wrapperClassName="image-wrapper-avatar"
                      imageType="avatar"
                    />
                  </div>
                  <a href={`/users/${follower.slug}`}>{follower.first_name} {follower.last_name}</a>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>No followers yet.</p>
        )}
      </div>

      <div className="user-section" style={{ marginTop: '2rem' }}>
        <button onClick={() => signOut({ callbackUrl: '/' })}>🔒 Log Out</button>
      </div>
    </div>
  );
}
