import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/amplifyClient';

const GenerationStatusContext = createContext();

export const useGenerationStatus = () => {
  const context = useContext(GenerationStatusContext);
  if (!context) {
    throw new Error('useGenerationStatus must be used within GenerationStatusProvider');
  }
  return context;
};

export const GenerationStatusProvider = ({ children }) => {
  const [processingImages, setProcessingImages] = useState([]);
  const pollIntervalRef = useRef(null);

  // Load processing images from database
  const loadProcessingImages = async () => {
    try {
      const allImages = await base44.entities.GeneratedImage.list();
      const processing = allImages.filter(img =>
        img.status === 'processing' || img.status === 'pending'
      );

      // Auto-cleanup: mark records as failed if stuck processing for more than 10 minutes
      const TEN_MINUTES = 10 * 60 * 1000;
      const now = Date.now();
      for (const img of processing) {
        const createdAt = img.createdAt ? new Date(img.createdAt).getTime() : 0;
        const age = now - createdAt;
        if (age > TEN_MINUTES && !img.image_url) {
          console.log('Auto-cleaning stale processing image:', img.id, 'age:', Math.round(age / 60000), 'minutes');
          try {
            await base44.entities.GeneratedImage.update(img.id, { status: 'failed' });
          } catch (err) {
            console.error('Failed to auto-clean image:', img.id, err);
          }
        }
      }

      // Re-filter after cleanup
      const stillProcessing = processing.filter(img => {
        const createdAt = img.createdAt ? new Date(img.createdAt).getTime() : 0;
        const age = now - createdAt;
        return age <= TEN_MINUTES || img.image_url;
      });

      console.log('GenerationStatusProvider: Found', stillProcessing.length, 'processing images');
      setProcessingImages(stillProcessing);
      return stillProcessing;
    } catch (error) {
      console.error('Failed to load processing images:', error);
      return [];
    }
  };

  useEffect(() => {
    // Subscribe to GeneratedImage changes
    const unsubscribe = base44.entities.GeneratedImage.subscribe((event) => {
      console.log('GenerationStatusProvider received event:', event.type);
      if (event.type === 'create' || event.type === 'update') {
        const image = event.data;
        if (image.status === 'processing' || image.status === 'pending') {
          // Add or update processing image
          setProcessingImages(prev => {
            const existing = prev.find(img => img.id === image.id);
            if (existing) {
              return prev.map(img => img.id === image.id ? image : img);
            }
            return [...prev, image];
          });
        } else if (image.status === 'completed' || image.status === 'failed') {
          // Remove from processing list
          setProcessingImages(prev => prev.filter(img => img.id !== image.id));
        }
      } else if (event.type === 'delete') {
        setProcessingImages(prev => prev.filter(img => img.id !== event.id));
      }
    });

    // Load initial processing images
    loadProcessingImages();

    // Poll every 5 seconds as fallback since subscriptions may not work
    pollIntervalRef.current = setInterval(() => {
      loadProcessingImages();
    }, 5000);

    return () => {
      unsubscribe();
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  return (
    <GenerationStatusContext.Provider value={{ processingImages }}>
      {children}
    </GenerationStatusContext.Provider>
  );
};