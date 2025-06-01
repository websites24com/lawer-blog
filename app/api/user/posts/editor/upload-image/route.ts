// File: app/api/user/posts/editor/upload-image/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/posts');

export async function POST(req: NextRequest) {
  // ✅ Ensure user is authenticated
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('image') as File | null;

  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileType = file.type;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  // ✅ Reject unsupported file types
  if (!allowedTypes.includes(fileType)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }

  // ✅ Generate unique name and destination path
  const filename = `${uuidv4()}.webp`;
  const filePath = path.join(UPLOAD_DIR, filename);
  const publicUrl = `/uploads/posts/${filename}`;

  try {
    // ✅ Ensure directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // ✅ Process image: resize and convert to webp
    await sharp(buffer)
      .resize({ width: 1200 }) // Resize to max 1200px wide (maintains aspect ratio)
      .webp()
      .toFile(filePath);

    // ✅ Return public URL
    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error('❌ Image upload error:', err);
    return NextResponse.json({ error: 'Image upload failed' }, { status: 500 });
  }
}
