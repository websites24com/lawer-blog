'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

import ImageWithFallback from '@/app/components/global/ImageWithFallback';
import TimeFromDate from '@/app/components/global/date/TimeFromDate';
import ActionButton from '@/app/components/global/ActionButton';
import FollowUserButton from '../user/FollowUserButton';
import SimpleMessageDialog from '@/app/components/global/SimpleMessageDialog';

import { fetchPostReactions, handlePostReaction } from '@/app/actions/reactions';

import type { ReactionEntry, ReactionType } from '@/app/lib/definitions';

type PostReactionsListProps = {
  postId: number;
};

const emojiReactions: Record<ReactionType, string> = {
  like: '👍',
  love: '❤️',
  haha: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😡',
  dislike: '👎',
};

export default function PostReactionsList({ postId }: PostReactionsListProps) {
  const { data: session } = useSession();
  const [reactions, setReactions] = useState<ReactionEntry[]>([]);
  const [expandedReaction, setExpandedReaction] = useState<ReactionType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const loadReactions = useCallback(async () => {
    const result = await fetchPostReactions(postId);
    setReactions(result);
  }, [postId]);

  useEffect(() => {
    loadReactions();
  }, [loadReactions]);

  const grouped = reactions.reduce<Record<ReactionType, ReactionEntry[]>>((acc, reaction) => {
    if (!acc[reaction.reaction]) acc[reaction.reaction] = [];
    acc[reaction.reaction].push(reaction);
    return acc;
  }, {} as Record<ReactionType, ReactionEntry[]>);

  const toggleReaction = (type: ReactionType) => {
    setExpandedReaction((prev) => (prev === type ? null : type));
  };

  const handleReact = async (reaction: ReactionType) => {
    if (!session?.user) {
      setShowLoginDialog(true);
      return;
    }

    try {
      setSubmitting(true);
      const success = await handlePostReaction(postId, reaction);
      if (success) await loadReactions();
    } catch (err) {
      console.error('Reaction failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reactions-list">
      <div className="reaction-submit-bar">
        <p className="reaction-submit-title">React to this post:</p>
        <div className="reaction-summary">
          {(Object.keys(emojiReactions) as ReactionType[]).map((type) => (
            <ActionButton
              key={type}
              onClick={() => handleReact(type)}
              type="button"
              disabled={submitting}
              title={type}
              className={`reaction-button ${type}`}
            >
              <span className="reaction-emoji">{emojiReactions[type]}</span>
            </ActionButton>
          ))}
        </div>
      </div>

      <div className="reaction-summary">
        {Object.entries(grouped).length > 0 ? (
          Object.entries(grouped).map(([type, users]) => (
            <button
              key={type}
              onClick={() => toggleReaction(type as ReactionType)}
              className="reaction-button"
              type="button"
            >
              <span className="reaction-emoji">{emojiReactions[type as ReactionType]}</span>
              <span className="reaction-count">{users.length}</span>
            </button>
          ))
        ) : (
          <p className="reaction-empty">No reactions yet.</p>
        )}
      </div>

      {expandedReaction && grouped[expandedReaction] && (
        <div className="reaction-popup">
          <div className="reaction-popup-header">
            <h4>
              {emojiReactions[expandedReaction]} {expandedReaction.toUpperCase()} ({grouped[expandedReaction].length})
            </h4>
            <button
              className="reaction-popup-close"
              type="button"
              onClick={() => setExpandedReaction(null)}
            >
              ✖
            </button>
          </div>
          <div className="reaction-popup-body">
            <ul>
              {grouped[expandedReaction].map((user) => {
                const isCurrentUser = user.user_id === session?.user?.id;
                const userName = `${user.first_name} ${user.last_name}`;

                return (
                  <li key={user.user_id} className="reaction-user">
                    <Link
                      href={`/users/${user.user_slug}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        <ImageWithFallback
                          src={user.avatar_url || '/uploads/avatars/default.jpg'}
                          alt={userName}
                          imageType="avatar"
                          className="fallback-image-avatar"
                          wrapperClassName="image-wrapper-avatar"
                        />
                      </div>
                    </Link>

                    <div className="reaction-meta">
                      <strong>{userName}{isCurrentUser && ' (You)'}</strong>
                      <TimeFromDate date={user.created_at} />
                    </div>

                    {!isCurrentUser && (
                      <FollowUserButton
                        followedId={user.user_id}
                        initiallyFollowing={user.is_followed === 1}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <SimpleMessageDialog
        open={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        title="Login Required"
        message="You must be logged in to react to posts."
      />
    </div>
  );
}
