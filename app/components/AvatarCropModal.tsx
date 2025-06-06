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
  currentAvatarUrl: string;
};

export default function AvatarCropModal({
  file,
  onClose,
  onUploadSuccess,
  currentAvatarUrl,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropped, setIsCropped] = useState(false);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);

  const localUrl = useRef(URL.createObjectURL(file)).current;

  // Load image and auto-zoom to fit modal
  useEffect(() => {
    const img = new Image();
    img.src = localUrl;
    img.onload = () => {
      const defaultZoom = Math.max(300 / img.naturalWidth, 300 / img.naturalHeight);
      setZoom(defaultZoom);
    };
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [localUrl]);

  const handleCropComplete = useCallback(
    (_: Area, croppedPixels: Area) => {
      setCroppedAreaPixels(croppedPixels);
    },
    []
  );

  const handleCropNow = async () => {
    if (!croppedAreaPixels) {
      toast.error('No crop area defined');
      return;
    }

    try {
      const cropped = await getCroppedImg(localUrl, croppedAreaPixels, 300, 300);
      setCroppedBlob(cropped);
      setIsCropped(true);
      toast.success('Avatar cropped');
    } catch (err) {
      console.error(err);
      toast.error('Crop failed');
    }
  };

  const handleUpload = async () => {
    if (!croppedBlob) {
      toast.error('No cropped image to upload');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', croppedBlob, 'avatar.webp');

    try {
      const res = await fetch('/api/avatar', {
        method: 'POST',
        body: formData,
      });

      const text = await res.text();
      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        toast.error('Invalid server response');
        return;
      }

      if (res.ok) {
        toast.success('Avatar uploaded');

        if (
          currentAvatarUrl &&
          !currentAvatarUrl.includes('/uploads/avatars/default.jpg')
        ) {
          try {
            await fetch('/api/avatar/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: currentAvatarUrl }),
            });
          } catch (err) {
            console.error('❌ Failed to delete old avatar:', err);
          }
        }

        onUploadSuccess(data.url);
        onClose();
      } else {
        toast.error(data?.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Upload error');
    }
  };

  return (
    <div className="image-crop-modal">
      <div className="modal-content">
        <div className="crop-container">
          <Cropper
            image={localUrl}
            crop={crop}
            zoom={zoom}
            aspect={1} // square for avatar
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            cropShape="round"
            showGrid={false}
          />
        </div>

        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        />

        <div className="modal-actions">
          <button type="button" onClick={handleCropNow}>Crop</button>
          <button type="button" onClick={handleUpload} disabled={!isCropped}>Upload</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
