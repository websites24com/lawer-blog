'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import toast from 'react-hot-toast';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

import Link from 'next/link';

import ImageWithFallback from '@/app/components/global/ImageWithFallback';
import FollowPostButton from '@/app/components/blog/posts/FollowPostButton';
import ActionButton from '@/app/components/global/ActionButton';
import Spinner from '@/app/components/layout/Spinner';
import FancyDate from '@/app/components/global/date/FancyDate';
import TimeFromDate from '@/app/components/global/date/TimeFromDate';
import RenderWebsite from '@/app/components/global/RenderWebsite';
import RenderPhone from '@/app/components/global/RenderPhone';
import RenderEmail from '@/app/components/global/RenderEmail';
import { formatOrDash } from '@/app/utils/formatOrDash';

import CommentEditForm from '@/app/components/comments/CommentEditForm';
import CommentDeleteButton from '@/app/components/comments/CommentDeleteButton';
import CommentsPagination from '@/app/components/comments/CommentsPagination';
import PaginatedList from '@/app/components/global/pagination/PaginatedList';

import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import FollowUserButton from '@/app/components/user/FollowUserButton';
import BlockUserButton from '@/app/components/user/BlockUserButton';

export default function UserPage() {
  const { userData, loading, error, resolved, status, refetch } = useCurrentUser();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [commentPage, setCommentPage] = useState(1);
  const commentsPerPage = 5;

  useEffect(() => {
    if (!loading && resolved && !userData) {
      router.push('/login');
    }
  }, [loading, resolved, userData, router]);

  if (status === 'loading' || loading || !resolved) return <Spinner />;
  if (!userData) return null;

  const resolvedAvatarUrl =
    userData.avatar_url?.startsWith('http') || userData.avatar_url?.startsWith('/uploads/avatars/')
      ? userData.avatar_url
      : `/uploads/avatars/${userData.avatar_url}`;

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
                if (!res.ok) throw new Error();
                toast.success('Post deleted');
                await refetch();
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

  const followedPosts = userData.followed_posts;

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
        <p><strong>Country:</strong> {formatOrDash(userData.country_name)}</p>
        <p><strong>State:</strong> {formatOrDash(userData.state_name)}</p>
        <p><strong>The closest city:</strong> {formatOrDash(userData.city_name)}</p>
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
          <PaginatedList
            items={userData.posts}
            noItemsMessage="You haven’t published any posts."
            renderItem={(post) => (
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
                  <ActionButton onClick={() => router.push(`/blog/${post.slug}`)}>👁️ View</ActionButton>
                  <ActionButton onClick={() => router.push(`/blog/edit/${post.slug}`)}>✏️ Edit</ActionButton>
                  <ActionButton onClick={() => handleDeletePost(post.id)}>🗑️ Delete</ActionButton>
                </div>
              </li>
            )}
          />
        ) : (
          <p>You haven’t published any posts.</p>
        )}
      </div>

      <div className="user-section">
        <h2>⭐ Followed Posts</h2>
        {followedPosts?.length > 0 ? (
          <PaginatedList
            items={followedPosts}
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
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                <FollowPostButton
                  postId={post.id}
                  initiallyFollowing={true}
                  onUnfollow={refetch} />
              </li>
            )}
          />
        ) : (
          <p>You haven’t followed any posts yet.</p>
        )}
      </div>

     <div className="user-section">
  <h2>🗨️ My Comments</h2>

  {userData.comments?.length > 0 ? (() => {
    // Filter out comments from users you blocked
    const visibleComments = userData.comments.filter(
      (comment) => !userData.blocked_users.some((b) => b.id === comment.user_id)
    );

    if (visibleComments.length === 0) {
      return <p>All your comments are hidden because they are on posts by users you've blocked.</p>;
    }

    const totalPages = Math.ceil(visibleComments.length / commentsPerPage);
    const paginatedComments = visibleComments.slice(
      (commentPage - 1) * commentsPerPage,
      commentPage * commentsPerPage
    );

    return (
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
                    onSuccess={refetch}
                  />
                ) : (
                  <>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{comment.message}</p>
                    {comment.post_slug && (
                      <p style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>
                        Comment on: <Link href={`/blog/${comment.post_slug}`}>🔗 {comment.post_title}</Link>
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <ActionButton onClick={() => setEditingCommentId(comment.id)}>✏️ Edit</ActionButton>
                      <CommentDeleteButton commentId={comment.id} onDeleted={refetch} />
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
    );
  })() : (
    <p>You haven’t posted any comments yet.</p>
  )}
</div>


      <div className="user-section">
  <h2>📌 Following</h2>
  {userData.following?.filter((u) => !userData.blocked_users.some((b) => b.id === u.id)).length > 0 ? (
    <PaginatedList
      items={userData.following.filter((u) => !userData.blocked_users.some((b) => b.id === u.id))}
      noItemsMessage="You’re not following any users yet."
      renderItem={(followedUser) => {
        const avatar =
          followedUser.avatar_url?.startsWith('http') || followedUser.avatar_url?.startsWith('/uploads/avatars/')
            ? followedUser.avatar_url
            : `/uploads/avatars/${followedUser.avatar_url}`;
        return (
          <li key={followedUser.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="image-wrapper-avatar">
              <ImageWithFallback
                src={avatar || '/uploads/avatars/default.jpg'}
                alt={`${followedUser.first_name} ${followedUser.last_name}`}
                className="fallback-image-avatar"
                wrapperClassName="image-wrapper-avatar"
                imageType="avatar"
              />
            </div>
            <div>
              <Link href={`/users/${followedUser.slug}`}>
                {followedUser.first_name} {followedUser.last_name}
              </Link>
              <div style={{ marginTop: '0.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <FollowUserButton
                  followedId={followedUser.id}
                  initiallyFollowing={true}
                  onUnfollow={refetch}
                />
                <BlockUserButton
                  blockedId={followedUser.id}
                  initiallyBlocked={followedUser.is_blocked ?? false}
                  onToggle={refetch}
                  refresh={true}
                />
              </div>
            </div>
          </li>
        );
      }}
    />
  ) : (
    <p>You’re not following any users yet.</p>
  )}
</div>


<div className="user-section">
  <h2>👥 Followers</h2>
  {userData.followers?.filter((u) => !userData.blocked_users.some((b) => b.id === u.id)).length > 0 ? (
    <PaginatedList
      items={userData.followers.filter((u) => !userData.blocked_users.some((b) => b.id === u.id))}
      noItemsMessage="No followers yet."
      renderItem={(follower) => {
        const avatar =
          follower.avatar_url?.startsWith('http') || follower.avatar_url?.startsWith('/uploads/avatars/')
            ? follower.avatar_url
            : `/uploads/avatars/${follower.avatar_url}`;
        return (
          <li key={follower.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="image-wrapper-avatar">
              <ImageWithFallback
                src={avatar || '/uploads/avatars/default.jpg'}
                alt={`${follower.first_name} ${follower.last_name}`}
                className="fallback-image-avatar"
                wrapperClassName="image-wrapper-avatar"
                imageType="avatar"
              />
            </div>
            <div>
              <Link href={`/users/${follower.slug}`}>
                {follower.first_name} {follower.last_name}
              </Link>
              <div style={{ marginTop: '0.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <FollowUserButton
                  followedId={follower.id}
                  initiallyFollowing={follower.is_followed ?? false}
                  onUnfollow={refetch}
                />
                <BlockUserButton
                  blockedId={follower.id}
                  initiallyBlocked={follower.is_blocked ?? false}
                  onToggle={refetch}
                  refresh={true}
                />
              </div>
            </div>
          </li>
        );
      }}
    />
  ) : (
    <p>No followers yet.</p>
  )}
</div>

<div className="user-section">
  <h2>🚫 Blocked Users</h2>
  {userData.blocked_users?.length > 0 ? (
    <PaginatedList
      items={userData.blocked_users}
      noItemsMessage="You haven’t blocked anyone yet."
      renderItem={(blockedUser) => {
        const avatar =
          blockedUser.avatar_url?.startsWith('http') || blockedUser.avatar_url?.startsWith('/uploads/avatars/')
            ? blockedUser.avatar_url
            : `/uploads/avatars/${blockedUser.avatar_url}`;

        return (
          <li key={blockedUser.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="image-wrapper-avatar">
              <ImageWithFallback
                src={avatar || '/uploads/avatars/default.jpg'}
                alt={`${blockedUser.first_name} ${blockedUser.last_name}`}
                className="fallback-image-avatar"
                wrapperClassName="image-wrapper-avatar"
                imageType="avatar"
              />
            </div>
            <div>
              <Link href={`/users/${blockedUser.slug}`}>
                {blockedUser.first_name} {blockedUser.last_name}
              </Link>
              <div style={{ marginTop: '0.25rem' }}>
                <BlockUserButton
                  blockedId={blockedUser.id}
                  initiallyBlocked={true}
                  refresh={true}
                  onToggle={refetch}
                />
              </div>
            </div>
          </li>
        );
      }}
    />
  ) : (
    <p>You haven’t blocked anyone yet.</p>
  )}
</div>



      <div className="user-section" style={{ marginTop: '2rem' }}>
        <button onClick={() => signOut({ callbackUrl: '/' })}>🔒 Log Out</button>
      </div>
    </div>
  );
}
