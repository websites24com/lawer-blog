import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';

export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${uuid()}.jpg`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    const filepath = path.join(uploadDir, filename);

    await fs.mkdir(uploadDir, { recursive: true });

    await sharp(buffer)
      .resize(300, 300)
      .jpeg({ quality: 80 })
      .toFile(filepath);

    return NextResponse.json({ url: `/uploads/avatars/${filename}` });
  } catch (error) {
    console.error('❌ Upload failed:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
