'use client';

import { useEffect, useState, useTransition } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

import ImageWithFallback from '@/app/components/global/ImageWithFallback';
import FollowPostButton from '@/app/components/posts/FollowPostButton';
import ActionButton from '@/app/components/global/ActionButton';
import Spinner from '@/app/components/global/Spinner';
import FancyDate from '@/app/components/global/date/FancyDate';
import TimeFromDate from '@/app/components/global/date/TimeFromDate';
import RenderWebsite from '@/app/components/global/RenderWebsite';
import RenderPhone from '@/app/components/global/RenderPhone';
import RenderEmail from '@/app/components/global/RenderEmail';
import { unfollowPost } from '@/app/actions/posts';
import { formatOrDash } from '@/app/utils/formatOrDash';

import CommentEditForm from '@/app/components/comments/CommentEditForm';
import CommentDeleteButton from '@/app/components/comments/CommentDeleteButton';
import CommentsPagination from '@/app/components/comments/CommentsPagination';
import PaginatedList from '@/app/components/global/pagination/PaginatedList';

import type { UserRow, PostSummary, Comment, SimpleUser } from '@/app/lib/definitions';

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

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [commentPage, setCommentPage] = useState(1);
  const commentsPerPage = 5;

  const fetchUserData = async () => {
    if (!session || !session.user) return;

    const query = session.user.email
      ? `email=${encodeURIComponent(session.user.email)}`
      : session.user.provider_account_id
      ? `providerId=${encodeURIComponent(session.user.provider_account_id)}`
      : '';

    if (!query) return;

    try {
      const res = await fetch(`/api/user?${query}`);
      if (!res.ok) throw new Error('Failed to fetch user data');
      const data = await res.json();
      setUserData(data);
    } catch {
      toast.error('Failed to refresh user data');
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchUserData().then(() => setLoading(false));
    }
  }, [status, session]);

  if (status === 'loading' || loading) return <Spinner />;
  if (!session || !session.user) {
    router.push('/login');
    return null;
  }
  if (!userData) return <p>Error loading user data.</p>;

  const resolvedAvatarUrl =
    userData.avatar_url?.startsWith('http') || userData.avatar_url?.startsWith('/uploads/avatars/')
      ? userData.avatar_url
      : `/uploads/avatars/${userData.avatar_url}`;

  const handleUnfollow = async (postId: number) => {
    startTransition(async () => {
      try {
        await unfollowPost(postId);
        setUserData((prev) =>
          prev ? { ...prev, followed_posts: prev.followed_posts.filter((p) => p.id !== postId) } : prev
        );
        toast.success('Post unfollowed');
      } catch {
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
                const res = await fetch(`/api/user/posts/delete/${postId}`, { method: 'DELETE' });
                if (!res.ok) throw new Error();
                setUserData((prev) =>
                  prev ? { ...prev, posts: prev.posts.filter((p) => p.id !== postId) } : prev
                );
                toast.success('Post deleted');
              } catch {
                toast.error('Failed to delete post');
              }
            });
          },
        },
        { label: 'No' },
      ],
    });
  };

  const totalPages = Math.ceil(userData.comments.length / commentsPerPage);
  const paginatedComments = userData.comments.slice(
    (commentPage - 1) * commentsPerPage,
    commentPage * commentsPerPage
  );

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

      {/* My Posts */}
     {/* My Posts */}
<div className="user-section">
  <h2>📝 My Posts</h2>
  <ActionButton onClick={() => router.push('/blog/create')} title="Create a new blog post">
    ➕ Create Post
  </ActionButton>
  {userData.posts?.length > 0 ? (
    <PaginatedList
      items={userData.posts}
      noItemsMessage="You haven’t published any posts."
      renderItem={(post) => {
        // ✅ Debugging each post
        console.log('🧪 DEBUG POST:', post.id, post.slug);

        return (
          <li
            key={post.id}
            style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #ccc' }}
          >
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
              <ActionButton onClick={() => router.push(`/blog/${post.slug}`)}>👁️ View</ActionButton>
              <ActionButton onClick={() => router.push(`/blog/edit/${post.slug}`)}>✏️ Edit</ActionButton>
              <ActionButton onClick={() => handleDeletePost(post.id)}>🗑️ Delete</ActionButton>
            </div>
          </li>
        );
      }}
    />
  ) : (
    <p>You haven’t published any posts.</p>
  )}
</div>


      {/* Followed Posts */}
      <div className="user-section">
        <h2>⭐ Followed Posts</h2>
        {userData.followed_posts?.length > 0 ? (
          <PaginatedList
            items={userData.followed_posts}
           
            noItemsMessage="You haven’t followed any posts yet."
            renderItem={(post) => (
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
            )}
          />
        ) : (
          <p>You haven’t followed any posts yet.</p>
        )}
      </div>

      {/* Comments */}
      <div className="user-section">
        <h2>🗨️ My Comments</h2>
        {userData.comments.length > 0 ? (
          <>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {paginatedComments.map((comment) => {
                const isEditing = editingCommentId === comment.id;
                return (
                  <li key={comment.id} style={{ marginBottom: '1.5rem', borderBottom: '1px solid #ddd', paddingBottom: '1rem' }}>
                    <p style={{ marginBottom: '0.5rem' }}>
                      <strong>{comment.name}</strong> — <FancyDate dateString={comment.created_at} />
                    </p>

                    {isEditing ? (
                      <CommentEditForm
                        commentId={comment.id}
                        initialContent={comment.message}
                        onCancel={() => setEditingCommentId(null)}
                        onSuccess={fetchUserData}
                      />
                    ) : (
                      <>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{comment.message}</p>
                        {comment.post_slug && (
                          <p style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>
                            Comment on: <a href={`/blog/${comment.post_slug}`} target="_blank" rel="noopener noreferrer">🔗 {comment.post_title}</a>
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <ActionButton onClick={() => setEditingCommentId(comment.id)}>✏️ Edit</ActionButton>
                          <CommentDeleteButton commentId={comment.id} onDeleted={fetchUserData} />
                          {comment.post_slug && (
                            <ActionButton onClick={() => window.open(`/blog/${comment.post_slug}`, '_blank')}>
                              👁️ View Post
                            </ActionButton>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
            <CommentsPagination
              currentPage={commentPage}
              totalPages={totalPages}
              onPageChange={setCommentPage}
            />
          </>
        ) : (
          <p>You haven’t posted any comments yet.</p>
        )}
      </div>

      {/* Followers */}
      <div className="user-section">
        <h2>👥 Followers</h2>
        {userData.followers?.length > 0 ? (
          <PaginatedList
            items={userData.followers}
           
            noItemsMessage="No followers yet."
            renderItem={(follower) => {
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
            }}
          />
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
