// File: app/utils/postImages/cropImage.ts

/**
 * Creates a cropped version of an image using canvas.
 * @param imageSrc - URL or object URL of the source image
 * @param crop - Area to crop (from react-easy-crop)
 * @param width - Output width in pixels
 * @param height - Output height in pixels
 * @returns A Blob containing the cropped image in WebP format
 */

import type { Area } from 'react-easy-crop';

export default async function getCroppedImg(
  imageSrc: string,
  crop: Area,
  width: number,
  height: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = 'anonymous'; // Fix CORS for local file access

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Calculate scale ratios
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Draw the cropped image section onto canvas
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        width,
        height
      );

      // Convert canvas to blob (WebP)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas is empty'));
          }
        },
        'image/webp',
        0.95 // Quality
      );
    };

    image.onerror = (error) => reject(error);
  });
}
