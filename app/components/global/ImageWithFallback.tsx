'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import Spinner from '@/app/components/global/Spinner';

type Props = {
  src: string | null;
  fallbackSrc?: string;
  imageType?: 'post' | 'avatar';
  alt: string;
  className?: string;
  wrapperClassName?: string;
};

export default function ImageWithFallback({
  src,
  fallbackSrc,
  imageType = 'post',
  alt,
  className,
  wrapperClassName,
}: Props) {
  // Default fallback based on image type
  const defaultFallback =
    imageType === 'avatar'
      ? '/uploads/avatars/default.jpg'
      : '/uploads/posts/default.jpg';

  // Resolve src helper
  const resolveSrc = (value: string | null | undefined) =>
    value && value.trim() !== '' ? value : undefined;

  // State: resolved source and loading status
  const [imgSrc, setImgSrc] = useState<string>(
    resolveSrc(src) ?? resolveSrc(fallbackSrc) ?? defaultFallback
  );
  const [isLoading, setIsLoading] = useState(true);

  // Re-run on prop changes (important for dynamic avatars)
  useEffect(() => {
    const newResolved =
      resolveSrc(src) ?? resolveSrc(fallbackSrc) ?? defaultFallback;
    setImgSrc(newResolved);
    setIsLoading(true); // re-enable spinner when src changes
  }, [src, fallbackSrc]);

  // Classes
  const effectiveWrapperClass =
    wrapperClassName || (imageType === 'avatar' ? 'image-wrapper-avatar' : 'image-wrapper');

  const effectiveImageClass =
    className || (imageType === 'avatar' ? 'fallback-image-avatar' : 'fallback-image');

  return (
    <div className={effectiveWrapperClass} style={{ position: 'relative' }}>
      {/* 🔄 Spinner while image loads */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            background: 'rgba(255,255,255,0.3)',
          }}
        >
          <Spinner />
        </div>
      )}

      <Image
        src={imgSrc}
        alt={alt}
        fill
        className={effectiveImageClass}
        onLoad={() => setIsLoading(false)} // ✅ hide spinner
        onError={() => {
          if (imgSrc !== defaultFallback) {
            setImgSrc(defaultFallback);
            setIsLoading(false); // also hide spinner on error
          }
        }}
      />
    </div>
  );
}
