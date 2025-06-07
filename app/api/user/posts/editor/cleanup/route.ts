import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Extract image URLs from HTML content
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
    const { content, featured } = await req.json();

    const usedImages = extractImageUrls(content);
    if (featured && featured.startsWith('/uploads/posts/')) {
      usedImages.add(featured);
    }

    const uploadDir = path.join(process.cwd(), 'public/uploads/posts');
    const files = await fs.readdir(uploadDir);

    for (const file of files) {
      const fileUrl = `/uploads/posts/${file}`;
      if (!usedImages.has(fileUrl) && !fileUrl.includes('default.jpg')) {
        await fs.unlink(path.join(uploadDir, file)).catch(() => {});
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('🧨 Cleanup error:', err);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
