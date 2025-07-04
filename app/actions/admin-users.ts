'use server';

import { db } from '@/app/lib/db';
import { auth } from '@/app/lib/auth/auth';
import type { UserRow, UserSummary } from '@/app/lib/definitions';

export async function getAllUsers(filter: string = ''): Promise<UserSummary[]> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  let query = `
    SELECT id, first_name, last_name, email, phone, chat_app, avatar_url, role, status 
    FROM users 
  `;

  const values: string[] = [];

  if (filter) {
    query += `WHERE 
      first_name LIKE ? OR 
      last_name LIKE ? OR 
      email LIKE ? OR 
      role LIKE ? OR 
      status LIKE ?
    `;

    const like = `%${filter}%`;
    values.push(like, like, like, like, like);
  }

  query += ` ORDER BY created_at DESC`;

  const [rows] = await db.query(query, values) as [UserRow[], any];

  return rows.map((row) => ({
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email ?? '',
    phone: row.phone ?? '',
    chat_app: row.chat_app,
    avatar_url: row.avatar_url ?? '',
    role: row.role,
    status: row.status,
  }));
}

export async function updateUserStatus(id: number, status: 'approved' | 'declined' | 'banned'): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  await db.query(
    `UPDATE users SET status = ? WHERE id = ?`,
    [status, id]
  );
}

export async function deleteUser(id: number): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  await db.query(`DELETE FROM users WHERE id = ?`, [id]);
}

export async function updateUserInfo(
  id: number,
  data: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    chat_app: 'WhatsApp' | 'Telegram' | 'Signal' | 'Messenger' | 'None';
    role: 'USER' | 'MODERATOR' | 'ADMIN';
    avatar_url: string;
  }
): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  await db.query(
    `UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, chat_app = ?, role = ?, avatar_url = ? WHERE id = ?`,
    [
      data.first_name,
      data.last_name,
      data.email,
      data.phone,
      data.chat_app,
      data.role,
      data.avatar_url,
      id,
    ]
  );
}
