import type { ReactionEntry } from '@/app/lib/definitions';

export async function handlePostReaction(postId: number, reaction: string): Promise<boolean> {
  try {
    const res = await fetch('/api/posts/reactions/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, reaction }),
    });

    const data = await res.json();
    console.log('✅ Reaction submitted:', data);

    return res.ok;
  } catch (err) {
    console.error('❌ Failed to submit reaction:', err);
    return false;
  }
}





export async function fetchPostReactions(postId: number): Promise<ReactionEntry[]> {
  try {
    const res = await fetch(`/api/posts/reactions/post/${postId}`);
    if (!res.ok) {
      console.error('❌ GET /reactions/post failed:', res.status);
      return [];
    }

    const data = await res.json();

    if (Array.isArray(data.reactions)) {
      return data.reactions;
    }

    console.warn('⚠️ Unexpected reaction data format:', data);
    return [];
  } catch (err) {
    console.error('❌ Error fetching reactions:', err);
    return [];
  }
}

