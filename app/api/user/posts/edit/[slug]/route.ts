'use server'; // ✅ Declares that this route runs on the server side (Next.js 13+ App Router)

import { NextRequest, NextResponse } from 'next/server'; // ✅ Import Next.js request/response types for route handling
import { auth } from '@/app/lib/auth'; // ✅ Custom auth utility to get current user session
import { db } from '@/app/lib/db'; // ✅ Custom MySQL database connection pool

import { v4 as uuidv4 } from 'uuid'; // ✅ For generating a unique filename for uploaded images
import path from 'path'; // ✅ Node.js module to handle filesystem paths
import fs from 'fs/promises'; // ✅ Promise-based filesystem module for reading/writing/deleting files
import sharp from 'sharp'; // ✅ Image processing library to resize and convert images

// ✅ Default fallback photo path if user has no uploaded photo
const FALLBACK_PHOTO = '/uploads/posts/default.jpg';

// ✅ Absolute server-side path to the post image upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/posts');

// ✅ Main handler function for POST requests to update a blog post by its slug
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await auth(); // ✅ Get currently logged-in user
  if (!session?.user?.id) {
    // ❌ Return 401 if user is not authenticated
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // ✅ Parse multipart form data sent from the edit form
    const formData = await req.formData();

    // ✅ Extract fields from the form and ensure they are properly formatted
    const title = formData.get('title')?.toString().trim() || '';
    const excerpt = formData.get('excerpt')?.toString().trim() || '';
    const content = formData.get('content')?.toString().trim() || '';
    const category_id = Number(formData.get('category_id')) || 1;

    // ✅ Get the current photo and a possibly updated URL
    const oldPhoto = formData.get('old_photo')?.toString() || '';
    const newPhotoUrl = formData.get('featured_photo_url')?.toString() || FALLBACK_PHOTO;

    // ✅ Get newly uploaded file from form if exists
    const file = formData.get('featured_photo') as File | null;

    // ✅ Initialize final photo path to the current one (could be fallback or same as before)
    let finalPhoto = newPhotoUrl;

    // ✅ If a new image file was uploaded, generate a unique filename and save it
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer()); // Convert uploaded file to buffer
      const newFilename = `${uuidv4()}.webp`; // Create a unique filename
      const finalPath = path.join(UPLOAD_DIR, newFilename); // Full absolute path on disk

      await fs.mkdir(UPLOAD_DIR, { recursive: true }); // Ensure upload directory exists
      await sharp(buffer).resize(1200).webp().toFile(finalPath); // Resize and save .webp version

      finalPhoto = `/uploads/posts/${newFilename}`; // Update final photo URL to new image
    }

    // ✅ If old photo is different from the new one and is not the fallback image, delete it
    if (oldPhoto && oldPhoto !== finalPhoto && oldPhoto !== FALLBACK_PHOTO) {
      const oldPath = path.join(process.cwd(), 'public', oldPhoto); // Convert relative path to absolute
      try {
        await fs.access(oldPath); // Check if the old photo file exists
        await fs.unlink(oldPath); // Delete the old file
      } catch (err) {
        console.warn('⚠️ Could not delete old featured photo:', err); // Warn if deletion fails
      }
    }

    // ✅ Update the post in the database
    await db.query(
      `UPDATE posts
       SET title = ?, excerpt = ?, content = ?, category_id = ?, featured_photo = ?, updated_at = NOW()
       WHERE slug = ? AND user_id = ?`,
      [
        title,
        excerpt,
        content,
        category_id,
        finalPhoto,
        params.slug,
        session.user.id,
      ]
    );

    // ✅ Return a success JSON response
    return NextResponse.json({ success: true });
  } catch (err) {
    // ❌ Catch any unexpected errors and return 500
    console.error('❌ Error in post update route:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
