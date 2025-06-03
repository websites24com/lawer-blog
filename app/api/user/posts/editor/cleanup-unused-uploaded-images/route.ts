import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const usedImages: string[] = body.usedImages || [];
    const featuredPhoto: string = body.featuredPhoto || '';

    // Path to the upload folder
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'posts');

    // Read all files in the folder
    const allFiles = await fs.readdir(uploadsDir);

    // Convert used image URLs to just file names
    const usedFilenames = usedImages.map((url) => path.basename(url));
    const featuredFilename = path.basename(featuredPhoto);

    const filesToKeep = new Set([...usedFilenames, featuredFilename, 'default.jpg']);

    let deletedFiles: string[] = [];

    for (const file of allFiles) {
      if (!filesToKeep.has(file)) {
        const fullPath = path.join(uploadsDir, file);
        try {
          await fs.unlink(fullPath);
          deletedFiles.push(file);
        } catch (err) {
          console.error(`❌ Failed to delete file ${file}:`, err);
        }
      }
    }

    return NextResponse.json({ deleted: deletedFiles });
  } catch (err) {
    console.error('❌ Cleanup route error:', err);
    return NextResponse.json({ error: 'Failed to clean up images' }, { status: 500 });
  }
}
