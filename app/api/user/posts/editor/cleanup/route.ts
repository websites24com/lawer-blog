import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

import { auth } from '@/app/lib/auth/auth';

const FALLBACK_PHOTO = '/uploads/posts/default.jpg';
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/posts');

// Extract image srcs from HTML content
function extractImageUrls(html: string): Set<string> {
  const regex = /<img[^>]+src="([^">]+)"/g;
  const urls = new Set<string>();
  let match;
  while ((match = regex.exec(html))) {
    const src = match[1];
    if (src.startsWith('/uploads/posts/') && !src.includes('default.jpg')) {
      urls.add(src);
    }
  }
  return urls;
}

export async function POST(req: NextRequest) {
  try {
    // ✅ Authenticate user
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Parse JSON body
    const { content, featured }: { content: string; featured?: string } = await req.json();

    const usedImages = extractImageUrls(content);
    if (featured && featured.startsWith('/uploads/posts/') && featured !== FALLBACK_PHOTO) {
      usedImages.add(featured);
    }

    // ✅ Delete all unused images
    const files = await fs.readdir(UPLOAD_DIR);
    for (const file of files) {
      const fileUrl = `/uploads/posts/${file}`;
      if (!usedImages.has(fileUrl) && fileUrl !== FALLBACK_PHOTO) {
        try {
          await fs.unlink(path.join(UPLOAD_DIR, file));
          console.log('🗑️ Deleted unused image:', fileUrl);
        } catch (err) {
          console.warn('⚠️ Failed to delete image:', fileUrl, err);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Cleanup error:', err);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
