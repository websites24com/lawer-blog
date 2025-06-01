'use client';

import Cropper from 'react-easy-crop';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import getCroppedImg from '@/app/utils/postImages/cropImage';

import type { Area } from 'react-easy-crop';

type Props = {
  file: File;
  onClose: () => void;
  onUploadSuccess: (url: string) => void;
  currentPhotoUrl: string; // ✅ Added this prop to track the old photo
};

export default function ImageCropModal({ file, onClose, onUploadSuccess, currentPhotoUrl }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [isCropped, setIsCropped] = useState(false);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const localUrl = useRef(URL.createObjectURL(file)).current;
  const [cropDimensions, setCropDimensions] = useState<{ width: number; height: number } | null>(null);

  // Preload image and set default zoom
  useEffect(() => {
    const img = new Image();
    img.src = localUrl;
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      const defaultZoom = Math.max(1200 / img.naturalWidth, 800 / img.naturalHeight);
      setZoom(defaultZoom);
    };
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [localUrl]);

  // Capture crop area dimensions
  const handleCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
    setCropDimensions({
      width: Math.round(croppedPixels.width),
      height: Math.round(croppedPixels.height),
    });
  }, []);

  // Generate cropped Blob from canvas
  const handleCropNow = async () => {
    if (!croppedAreaPixels) {
      toast.error('No crop area defined');
      return;
    }
    try {
      const cropped = await getCroppedImg(localUrl, croppedAreaPixels, 1200, 800);
      setCroppedBlob(cropped);
      setIsCropped(true);
      toast.success('Image cropped');
    } catch (err) {
      console.error(err);
      toast.error('Crop failed');
    }
  };

  // Upload the cropped image to server and delete old one
  const handleUpload = async () => {
    try {
      if (!croppedBlob) {
        toast.error('No cropped image to upload');
        return;
      }

      const formData = new FormData();
      formData.append('image', croppedBlob, 'cropped-image.webp');

      const res = await fetch('/api/user/posts/editor/upload-image', {
        method: 'POST',
        body: formData,
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error('❌ Failed to parse JSON:', parseErr);
        toast.error('Server returned invalid JSON');
        return;
      }

      if (res.ok) {
        toast.success('Image uploaded');

        // ✅ Delete old image unless it’s fallback
        if (currentPhotoUrl && !currentPhotoUrl.includes('/uploads/posts/default.jpg')) {
          try {
            await fetch('/api/user/posts/delete-photo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ photoPath: currentPhotoUrl }),
            });
          } catch (err) {
            console.error('❌ Failed to delete old photo:', err);
          }
        }

        onUploadSuccess(data.url);
        onClose();
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('❌ Upload failed:', err);
      toast.error('Upload failed');
    }
  };

  return (
    <div className="image-crop-modal">
      <div className="modal-content" ref={containerRef}>
        {/* Cropper container */}
        <div className="crop-container">
          <Cropper
            image={localUrl}
            crop={crop}
            zoom={zoom}
            aspect={3 / 2}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            restrictPosition={false}
            cropShape="rect"
            showGrid={true}
          />
        </div>

        {/* Zoom control */}
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        />

        {/* Metadata preview */}
        {imageSize && (
          <div className="crop-meta">
            Original: {imageSize.width}×{imageSize.height}
            <br />
            Crop Area: {cropDimensions?.width || 0}×{cropDimensions?.height || 0}
            <br />
            Output Size: 1200×800
          </div>
        )}

        {/* Action buttons */}
        <div className="modal-actions">
          <button type="button" onClick={handleCropNow}>Crop</button>
          <button type="button" onClick={handleUpload} disabled={!isCropped}>Upload</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
