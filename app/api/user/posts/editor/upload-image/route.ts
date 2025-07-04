'use server';

import { NextRequest, NextResponse } from 'next/server';
import { RequireAuth } from '@/app/lib/auth/requireAuth';
import { ROLES } from '@/app/lib/auth/roles';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/posts');

export async function POST(req: NextRequest) {
  try {
    // ✅ Require auth (USER, MODERATOR, ADMIN)
    await RequireAuth({ roles: [ROLES.USER, ROLES.MODERATOR, ROLES.ADMIN] });

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

    // ✅ Generate unique file name and path
    const filename = `${uuidv4()}.webp`;
    const filePath = path.join(UPLOAD_DIR, filename);
    const publicUrl = `/uploads/posts/${filename}`;

    // ✅ Ensure uploads directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // ✅ Resize and convert image to webp
    await sharp(buffer)
      .resize({ width: 1200 }) // maintain aspect ratio
      .webp()
      .toFile(filePath);

    // ✅ Respond with image URL
    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error('❌ POST /api/user/posts/editor/upload-image error:', err);
    return NextResponse.json({ error: 'Image upload failed' }, { status: 500 });
  }
}
