// File: app/api/user/posts/editor/cleanup-images/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import path from 'path';
import fs from 'fs/promises';

// ✅ POST handler to delete unused images in post content
export async function POST(req: NextRequest) {
  // ✅ Check if user is authenticated
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // ✅ Expect JSON body with oldContent and newContent
    const { oldContent, newContent } = await req.json();

    // ✅ Helper function to extract image URLs from HTML
    const extractImageUrls = (html: string): Set<string> => {
      const regex = /<img[^>]+src="([^">]+)"/g;
      const urls = new Set<string>();
      let match;
      while ((match = regex.exec(html))) {
        const src = match[1];
        if (src.startsWith('/uploads/posts/')) {
          urls.add(src);
        }
      }
      return urls;
    };

    // ✅ Get image sets from old and new content
    const oldImages = extractImageUrls(oldContent);
    const newImages = extractImageUrls(newContent);

    // ✅ Identify images that were removed in the update
    const imagesToDelete = [...oldImages].filter((url) => !newImages.has(url));

    // ✅ Try deleting each removed image
    for (const url of imagesToDelete) {
      const filePath = path.join(process.cwd(), 'public', url);
      try {
        await fs.unlink(filePath);
        console.log(`🗑️ Deleted unused image: ${url}`);
      } catch (err) {
        console.warn(`⚠️ Failed to delete: ${url}`, err);
      }
    }

    return NextResponse.json({ deleted: imagesToDelete });
  } catch (err) {
    console.error('❌ Error cleaning up images:', err);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
