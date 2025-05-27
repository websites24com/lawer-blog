import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { z } from 'zod';
import { auth } from '@/app/lib/auth';

const UpdateUserSchema = z.object({
  id: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  chat_app: z.enum(['WhatsApp', 'Telegram', 'Signal', 'Messenger', 'None']),
  avatar_url: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      console.log('⛔ No active session.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const form = await req.formData();

    const raw = {
      id: form.get('id'),
      first_name: form.get('first_name'),
      last_name: form.get('last_name'),
      email: form.get('email'),
      phone: form.get('phone'),
      chat_app: form.get('chat_app'),
      avatar_url: form.get('avatar_url'),
    };

    console.log('📨 Raw form data received:', raw);

    const parsed = UpdateUserSchema.parse(raw);

    const targetUserId = Number(parsed.id);
    const currentUserId = session.user.id;
    const currentUserRole = session.user.role;

    const isSelf = currentUserId === targetUserId;
    const isPrivileged = currentUserRole === 'ADMIN' || currentUserRole === 'MODERATOR';

    if (!isSelf && !isPrivileged) {
      console.log('⛔ Forbidden: insufficient permissions');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const safeAvatarUrl = parsed.avatar_url?.startsWith('/uploads/avatars/')
      ? parsed.avatar_url
      : `/uploads/avatars/${parsed.avatar_url}`;

    console.log('🛠 Updating user:', {
      ...parsed,
      avatar_url: safeAvatarUrl
    });

    await db.query(
      `UPDATE users
       SET first_name = ?, last_name = ?, email = ?, phone = ?, chat_app = ?, avatar_url = ?
       WHERE id = ?`,
      [
        parsed.first_name,
        parsed.last_name,
        parsed.email,
        parsed.phone || '',
        parsed.chat_app,
        safeAvatarUrl || '',
        targetUserId,
      ]
    );

    console.log('✅ User successfully updated.');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Update failed:', err);
    if (err instanceof z.ZodError) {
      console.error('📛 Validation errors:', err.errors);
      return NextResponse.json({ error: 'Validation failed', issues: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
