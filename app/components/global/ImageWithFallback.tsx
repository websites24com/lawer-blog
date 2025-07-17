'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Spinner from '@/app/components/layout/Spinner';

type Props = {
  src: string | null;
  fallbackSrc?: string;
  imageType?: 'post' | 'avatar';
  title?: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  linkTo?: string; // ✅ NEW: optional link
};

export default function ImageWithFallback({
  src,
  fallbackSrc,
  imageType = 'post',
  alt,
  className,
  wrapperClassName,
  linkTo,
}: Props) {
  const defaultFallback =
    imageType === 'avatar'
      ? '/uploads/avatars/default.jpg'
      : '/uploads/posts/default.jpg';

  const resolveSrc = (value: string | null | undefined) =>
    value && value.trim() !== '' ? value : undefined;

  const [imgSrc, setImgSrc] = useState<string>(
    resolveSrc(src) ?? resolveSrc(fallbackSrc) ?? defaultFallback
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const newResolved =
      resolveSrc(src) ?? resolveSrc(fallbackSrc) ?? defaultFallback;
    setImgSrc(newResolved);
    setIsLoading(true);
  }, [src, fallbackSrc]);

  const effectiveWrapperClass =
    wrapperClassName || (imageType === 'avatar' ? 'image-wrapper-avatar' : 'image-wrapper');

  const effectiveImageClass =
    className || (imageType === 'avatar' ? 'fallback-image-avatar' : 'fallback-image');

  const imageElement = (
    <div className={effectiveWrapperClass} style={{ position: 'relative' }}>
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
        onLoad={() => setIsLoading(false)}
        onError={() => {
          if (imgSrc !== defaultFallback) {
            setImgSrc(defaultFallback);
            setIsLoading(false);
          }
        }}
      />
    </div>
  );

  // ✅ If linkTo is provided, wrap image in <Link>
  return linkTo ? <Link href={linkTo}>{imageElement}</Link> : imageElement;
}
