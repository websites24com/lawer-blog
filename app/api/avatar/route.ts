import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { auth } from '@/app/lib/auth/auth';

const MAX_FILE_SIZE = 1 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export async function POST(request: Request): Promise<Response> {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 1MB)' }, { status: 413 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: 'Unsupported file extension' }, { status: 415 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = uuid() + '.webp'; // Use .webp extension
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    const filepath = path.join(uploadDir, filename);

    await fs.mkdir(uploadDir, { recursive: true });

    await sharp(buffer)
      .resize(300, 300)
      .webp({ quality: 85 }) // 🔧 Changed from .jpeg() to .webp()
      .toFile(filepath);

    return NextResponse.json({ url: `/uploads/avatars/${filename}` });
  } catch (error) {
    console.error('❌ Upload failed:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
