'use client';

import Image from 'next/image';
import { useState } from 'react';

type Props = {
  src: string | null;
  fallbackSrc?: string; 
  imageType?: 'bike' | 'avatar'; 
  alt: string;
  className?: string;
  wrapperClassName?: string;
};

export default function ImageWithFallback({
  src,
  fallbackSrc,
  imageType = 'bike',
  alt,
  className,
  wrapperClassName,
}: Props) {
  const defaultFallback =
    imageType === 'avatar' ? '/uploads/avatars/default.jpg' : '/uploads/posts/default.jpg';

  const [imgSrc, setImgSrc] = useState(
    src && src.trim() !== '' ? src : fallbackSrc || defaultFallback
  );

  return (
    <div className={wrapperClassName}>
      <Image
        src={imgSrc}
        alt={alt}
        onError={() => setImgSrc(fallbackSrc || defaultFallback)}
        className={className}
        fill
      />
    </div>
  );
}
