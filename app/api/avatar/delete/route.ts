import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || url.includes('default.jpg')) {
      return NextResponse.json({ message: 'Default avatar not deleted (safe skip)' });
    }

    const filename = path.basename(url);
    const fullPath = path.join(process.cwd(), 'public', 'uploads', 'avatars', filename);

    // 🛡️ SAFETY: Do not throw if file does not exist
    const fileExists = await fs
      .access(fullPath)
      .then(() => true)
      .catch(() => false);

    if (fileExists) {
      await fs.unlink(fullPath);
      console.log(`🗑️ Deleted avatar file: ${filename}`);
    } else {
      console.warn(`⚠️ Avatar file already missing: ${filename}`);
    }

    return NextResponse.json({ message: 'Avatar deleted or already missing', filename });
  } catch (err) {
    console.error('❌ Error deleting avatar:', err);
    return NextResponse.json({ error: 'Failed to delete avatar' }, { status: 500 });
  }
}
