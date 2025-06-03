import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import path from 'path';
import fs from 'fs/promises';

// ✅ POST handler to delete removed TipTap images (specific for EditPostForm)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { oldContent, newContent } = await req.json();

    // ✅ Extract image URLs from HTML content
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

    // ✅ Compare image URLs from old and new content
    const oldImages = extractImageUrls(oldContent);
    const newImages = extractImageUrls(newContent);

    // ✅ Determine which images have been removed
    const imagesToDelete = [...oldImages].filter((url) => !newImages.has(url));

    // ✅ Delete removed images from disk
    for (const url of imagesToDelete) {
      const filePath = path.join(process.cwd(), 'public', url);
      try {
        await fs.unlink(filePath);
        console.log(`🗑️ Deleted unused editor image: ${url}`);
      } catch (err) {
        console.warn(`⚠️ Could not delete: ${url}`, err);
      }
    }

    return NextResponse.json({ deleted: imagesToDelete });
  } catch (err) {
    console.error('❌ Cleanup failed:', err);
    return NextResponse.json({ error: 'Failed to cleanup images' }, { status: 500 });
  }
}
