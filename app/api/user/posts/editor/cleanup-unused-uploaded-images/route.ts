import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: NextRequest) {
  try {
    // 🧠 Step 1: Read JSON from request
    const body = await req.json();
    const usedImages: string[] = body.usedImages || [];
    const featuredPhoto: string = body.featuredPhoto || '';

    console.log('📥 Incoming cleanup request...');
    console.log('➡️ Used Images from content:', usedImages);
    console.log('➡️ Featured Photo URL:', featuredPhoto);

    // 🧠 Step 2: Determine the uploads folder path
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'posts');
    console.log('📂 Looking into folder:', uploadsDir);

    // 🧠 Step 3: Read all image files in the folder
    const allFiles = await fs.readdir(uploadsDir);
    console.log('📁 Files in folder:', allFiles);

    // 🧠 Step 4: Convert full URLs into filenames
    const usedFilenames = usedImages.map((url) => path.basename(url));
    const featuredFilename = path.basename(featuredPhoto);

    console.log('✅ Used filenames (from content):', usedFilenames);
    console.log('✅ Featured filename:', featuredFilename);

    // 🧠 Step 5: Define which files to keep (Set ensures no duplicates)
    const filesToKeep = new Set([...usedFilenames, featuredFilename, 'default.jpg']);
    console.log('🛡️ Files to keep:', [...filesToKeep]);

    // 🧠 Step 6: Delete files not in filesToKeep
    let deletedFiles: string[] = [];

    for (const file of allFiles) {
      if (!filesToKeep.has(file)) {
        const fullPath = path.join(uploadsDir, file);
        try {
          await fs.unlink(fullPath);
          deletedFiles.push(file);
          console.log(`🗑️ Deleted: ${file}`);
        } catch (err) {
          console.error(`❌ Failed to delete ${file}:`, err);
        }
      }
    }

    console.log('✅ Cleanup complete. Deleted files:', deletedFiles);

    return NextResponse.json({ deleted: deletedFiles });

  } catch (err) {
    console.error('❌ Cleanup route error:', err);
    return NextResponse.json({ error: 'Failed to clean up images' }, { status: 500 });
  }
}
