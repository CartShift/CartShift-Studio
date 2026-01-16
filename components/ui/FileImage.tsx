'use client';

import { useState, useEffect } from 'react';
import { getFreshDownloadUrl } from '@/lib/services/portal-files';

interface FileImageProps {
  src: string;
  storagePath: string;
  alt: string;
  className?: string;
  onError?: () => void;
}

export function FileImage({ src, storagePath, alt, className, onError }: FileImageProps) {
  const [imageUrl, setImageUrl] = useState<string>(src);
  const [is, setIs] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImageUrl(src);
    setIs(true);
    setHasError(false);
  }, [src]);

  const handleError = async () => {
    if (hasError) {
      onError?.();
      return;
    }

    setHasError(true);
    setIs(true);

    try {
      const freshUrl = await getFreshDownloadUrl(storagePath);
      if (freshUrl) {
        setImageUrl(freshUrl);
        setIs(false);
      } else {
        setIs(false);
        onError?.();
      }
    } catch (error) {
      console.error('Error getting fresh download URL:', error);
      setIs(false);
      onError?.();
    }
  };

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={() => setIs(false)}
      style={{ display: is ? 'none' : 'block' }}
    />
  );
}
