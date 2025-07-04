import { readdir, unlink } from 'fs/promises';
import path from 'path';
import { db } from '@/app/lib/db';
import { requireAuth } from '@/app/lib/auth/requireAuth';
import { ROLES } from '@/app/lib/auth/roles'; // ✅ reuse ROLES constants

export async function POST() {
  try {
    // ✅ Auth + Role check
    await requireAuth({ roles: [ROLES.ADMIN] });

    const avatarsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    const files = await readdir(avatarsDir);

    const [rows] = await db.query('SELECT avatar_url FROM users');
    const usedFiles = new Set(
      (rows as any[])
        .map((r) => path.basename(r.avatar_url || ''))
        .filter((f) => f && f !== 'default.jpg')
    );

    const deleted: string[] = [];

    for (const file of files) {
      if (file !== 'default.jpg' && !usedFiles.has(file)) {
        await unlink(path.join(avatarsDir, file));
        deleted.push(file);
      }
    }

    return Response.json({ deleted });
  } catch (err: any) {
    console.error('❌ Avatar cleanup error:', err.message);
    return Response.json({ error: err.message || 'Failed to clean avatars' }, { status: 403 });
  }
}
