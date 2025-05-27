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
