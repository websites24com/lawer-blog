import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: 'Unsupported file extension' }, { status: 415 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Optional image integrity check
    try {
      await sharp(buffer).metadata(); // throws if invalid image
    } catch {
      return NextResponse.json({ error: 'Invalid image content' }, { status: 422 });
    }

    const fileName = `${uuid()}.webp`;
    const outputDir = path.join(process.cwd(), 'public/uploads/posts');
    const outputPath = path.join(outputDir, fileName);

    await fs.mkdir(outputDir, { recursive: true });

    await sharp(buffer)
      .resize(1280) // Resize to max width
      .webp({ quality: 80 })
      .toFile(outputPath);

    const imageUrl = `/uploads/posts/${fileName}`;
    return NextResponse.json({ url: imageUrl });
  } catch (err) {
    console.error('❌ Upload failed:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
