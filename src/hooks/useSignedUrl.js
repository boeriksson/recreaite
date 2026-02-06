import { useState, useEffect } from 'react';
import { getSignedUrl } from '@/api/amplifyClient';

/**
 * Hook to get a fresh signed URL for an S3 image
 * Handles URL expiration by re-signing when needed
 */
export function useSignedUrl(pathOrUrl) {
  const [signedUrl, setSignedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!pathOrUrl) {
      setSignedUrl(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    getSignedUrl(pathOrUrl)
      .then((url) => {
        if (mounted) {
          setSignedUrl(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
          setLoading(false);
          // Use original URL as fallback
          setSignedUrl(pathOrUrl);
        }
      });

    return () => {
      mounted = false;
    };
  }, [pathOrUrl]);

  return { url: signedUrl, loading, error };
}

/**
 * Hook to get fresh signed URLs for multiple images
 */
export function useSignedUrls(pathsOrUrls) {
  const [signedUrls, setSignedUrls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pathsOrUrls || pathsOrUrls.length === 0) {
      setSignedUrls([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    Promise.all(pathsOrUrls.map(getSignedUrl))
      .then((urls) => {
        if (mounted) {
          setSignedUrls(urls);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setSignedUrls(pathsOrUrls); // Fallback to originals
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [JSON.stringify(pathsOrUrls)]);

  return { urls: signedUrls, loading };
}

export default useSignedUrl;
