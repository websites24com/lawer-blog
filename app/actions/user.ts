'use server';

import { db } from '@/app/lib/db';

type UpdateUserData = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  chat_app: 'None' | 'WhatsApp' | 'Telegram' | 'Signal' | 'Messenger';
  avatar_url?: string;
};

// ✅ Update user profile
export async function updateUserInfo(id: number, data: UpdateUserData) {
  const {
    first_name,
    last_name,
    email,
    phone = '',
    chat_app = 'None',
    avatar_url = '',
  } = data;

  await db.query(
    `UPDATE users
     SET first_name = ?, last_name = ?, email = ?, phone = ?, chat_app = ?, avatar_url = ?
     WHERE id = ?`,
    [first_name, last_name, email, phone, chat_app, avatar_url, id]
  );
}

// ✅ Follow another user
export async function followUser(followedId: number, followerId: number) {
  if (!followedId || !followerId || followedId === followerId) return;

  await db.query(
    `INSERT IGNORE INTO user_followers (follower_id, followed_id)
     VALUES (?, ?)`,
    [followerId, followedId]
  );
}

// ✅ Unfollow a user
export async function unfollowUser(followedId: number, followerId: number) {
  if (!followedId || !followerId || followedId === followerId) return;

  await db.query(
    `DELETE FROM user_followers
     WHERE follower_id = ? AND followed_id = ?`,
    [followerId, followedId]
  );
}
