// app/api/avatar/cleanup-unused/route.ts
import { readdir, unlink } from 'fs/promises';
import path from 'path';
import { db } from '@/app/lib/db';

export async function POST() {
  try {
    const avatarsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    const files = await readdir(avatarsDir);

    // Get list of avatar filenames used in database (without full path)
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
  } catch (err) {
    console.error('❌ Failed to clean avatars:', err);
    return Response.json({ error: 'Failed to clean up avatars' }, { status: 500 });
  }
}
