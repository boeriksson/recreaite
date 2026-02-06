import React from 'react';
import { useSignedUrl } from '@/hooks/useSignedUrl';

/**
 * Image component that automatically handles S3 signed URL refresh
 * Drop-in replacement for <img> with S3 URLs
 */
export function SignedImage({ src, alt, className, style, onLoad, onError, ...props }) {
  const { url, loading, error } = useSignedUrl(src);

  if (!src) {
    return null;
  }

  // Show loading state or original src while loading
  const imageSrc = loading ? src : (url || src);

  return (
    <img
      src={imageSrc}
      alt={alt || ''}
      className={className}
      style={style}
      onLoad={onLoad}
      onError={(e) => {
        // If signed URL fails, try original as last resort
        if (url && e.target.src !== src) {
          e.target.src = src;
        }
        onError?.(e);
      }}
      {...props}
    />
  );
}

export default SignedImage;
