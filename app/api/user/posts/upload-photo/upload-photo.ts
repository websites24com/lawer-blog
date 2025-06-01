
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const rawFile = formData.get('file') as File;

  if (!rawFile || !(rawFile instanceof File)) {
    return NextResponse.json({ error: 'Invalid image upload' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(rawFile.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }

  if (rawFile.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 });
  }

  const buffer = Buffer.from(await rawFile.arrayBuffer());
  const filename = uuidv4() + '.webp';
  const uploadDir = path.join(process.cwd(), 'public/uploads/posts');
  await fs.mkdir(uploadDir, { recursive: true });

  const finalPath = path.join(uploadDir, filename);
  await sharp(buffer).resize(1200).webp().toFile(finalPath);

  return NextResponse.json({ url: `/uploads/posts/${filename}` });
}