'use server';

import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/app/lib/auth/requireApiAuth';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/posts');

export async function POST(req: NextRequest) {
  try {
    // ✅ Require auth for upload
     await requireApiAuth({ roles: ['USER', 'MODERATOR', 'ADMIN'] });


    const formData = await req.formData();
    const rawFile = formData.get('file') as File;

    // ✅ Validate file existence and type
    if (!rawFile || !(rawFile instanceof File)) {
      return NextResponse.json({ error: 'Invalid image upload' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(rawFile.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    if (rawFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    // ✅ Convert file to buffer
    const buffer = Buffer.from(await rawFile.arrayBuffer());

    // ✅ Create unique filename and ensure directory
    const filename = uuidv4() + '.webp';
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const finalPath = path.join(UPLOAD_DIR, filename);

    // ✅ Process and save image
    await sharp(buffer).resize({ width: 1200 }).webp().toFile(finalPath);

    // ✅ Return public URL
    return NextResponse.json({ url: `/uploads/posts/${filename}` });
  } catch (err) {
    console.error('❌ POST /api/user/posts/editor/upload-cropped error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
