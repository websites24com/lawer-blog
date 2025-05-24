import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import type { UserRow } from '@/app/lib/definitions';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get('email');
  const providerId = url.searchParams.get('providerId');

  try {
    let userQuery = '';
    let param = '';

    if (email) {
      userQuery = `
        SELECT id, first_name, last_name, email, phone, chat_app, avatar_url
        FROM users WHERE email = ? LIMIT 1
      `;
      param = email;
    } else if (providerId) {
      userQuery = `
        SELECT id, first_name, last_name, email, phone, chat_app, avatar_url
        FROM users WHERE provider_account_id = ? LIMIT 1
      `;
      param = providerId;
    } else {
      return NextResponse.json({ error: 'Missing identifier' }, { status: 400 });
    }

    const [userRows] = await db.query<UserRow[]>(userQuery, [param]);

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userRows[0];

    // 🔹 Posts created by user
    const [posts] = await db.query<any[]>(`
      SELECT 
        p.id,
        p.slug,
        p.title,
        p.excerpt,
        p.created_at,
        categories.name AS category
      FROM posts p
      LEFT JOIN categories ON p.category_id = categories.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `, [user.id]);

    // 🔹 Comments made by user
    const [comments] = await db.query<any[]>(`
      SELECT 
        c.id,
        c.message,
        c.created_at,
        c.post_id,
        p.title AS post_title,
        p.slug AS post_slug
      FROM comments c
      JOIN posts p ON c.post_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `, [user.id]);

    // 🔹 Followed posts
    const [followed_posts] = await db.query<any[]>(`
      SELECT 
        p.id,
        p.slug,
        p.title,
        p.excerpt,
        p.created_at,
        categories.name AS category
      FROM followed_posts fp
      JOIN posts p ON p.id = fp.post_id
      LEFT JOIN categories ON p.category_id = categories.id
      WHERE fp.user_id = ?
      ORDER BY p.created_at DESC
    `, [user.id]);

    const responsePayload = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      chat_app: user.chat_app,
      avatar_url: user.avatar_url,
      posts,
      comments,
      followed_posts,
    };

    console.log('📦 Sending user dashboard payload:', responsePayload);

    return NextResponse.json(responsePayload);
  } catch (err) {
    console.error('❌ Error fetching user dashboard:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
