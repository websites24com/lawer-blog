import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { photoPath } = await req.json();

    if (!photoPath.startsWith('/uploads/posts/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // ✅ Construct absolute path correctly
    const filePath = path.join(process.cwd(), 'public', photoPath);

    // ✅ Check if file exists before trying to delete it
    try {
      await fs.unlink(filePath);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        console.warn('⚠️ Tried to delete non-existing file:', filePath);
        // Still return success to allow fallback to proceed
        return NextResponse.json({ message: 'Photo already deleted' });
      } else {
        throw err;
      }
    }

    return NextResponse.json({ message: 'Photo deleted' });
  } catch (err) {
    console.error('❌ Failed to delete photo:', err);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}
