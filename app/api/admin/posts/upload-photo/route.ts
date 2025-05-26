import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

export const runtime = 'nodejs'; // Ensure Node.js APIs work

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('image') as File | null;

  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = `${uuid()}.webp`;
    const outputDir = path.join(process.cwd(), 'public/uploads/posts');
    const outputPath = path.join(outputDir, fileName);

    await fs.mkdir(outputDir, { recursive: true });

    await sharp(buffer)
      .resize(1280) // max width
      .webp({ quality: 80 })
      .toFile(outputPath);

    const imageUrl = `/uploads/posts/${fileName}`;
    return NextResponse.json({ url: imageUrl });
  } catch (err) {
    console.error('Upload failed:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
