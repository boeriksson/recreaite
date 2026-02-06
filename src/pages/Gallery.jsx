import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image,
  Download,
  Trash2,
  X,
  Sparkles,
  Calendar,
  ZoomIn,
  Edit3,
  Info
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { SignedImage } from "@/components/ui/SignedImage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ImageRefinementPanel from '../components/generation/ImageRefinementPanel';

export default function Gallery() {
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [fullScale, setFullScale] = useState(false);
  const [infoImage, setInfoImage] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerationProgress, setRegenerationProgress] = useState(0);
  const imagePreviewRef = React.useRef(null);

  React.useEffect(() => {
    if (isRegenerating && imagePreviewRef.current) {
      setTimeout(() => {
        imagePreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isRegenerating]);

  const { data: allImages = [], isLoading } = useQuery({
    queryKey: ['generated-images'],
    queryFn: () => base44.entities.GeneratedImage.list('-created_date'),
    refetchInterval: 5000, // Poll every 5 seconds as fallback for subscriptions
  });

  // Subscribe to real-time updates
  React.useEffect(() => {
    console.log('Setting up GeneratedImage subscription...');
    const unsubscribe = base44.entities.GeneratedImage.subscribe((event) => {
      console.log('Subscription event received:', event.type, event.data?.id);
      queryClient.invalidateQueries({ queryKey: ['generated-images'] });
    });
    return unsubscribe;
  }, [queryClient]);

  // Separate processing and completed images
  const processingImages = allImages.filter(img => img.status === 'processing' || img.status === 'pending');
  const images = allImages.filter(img => img.status === 'completed' && img.image_url && img.image_url !== null);

  // Debug logging
  React.useEffect(() => {
    console.log('Gallery: Total images:', allImages.length,
      '| Processing:', processingImages.length,
      '| Completed:', images.length);
    if (processingImages.length > 0) {
      console.log('Processing images:', processingImages.map(img => ({ id: img.id, status: img.status })));
    }
  }, [allImages, processingImages, images]);

  const { data: garments = [] } = useQuery({
    queryKey: ['garments'],
    queryFn: () => base44.entities.Garment.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GeneratedImage.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-images'] });
      setDeleteId(null);
    }
  });

  const batchDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => base44.entities.GeneratedImage.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-images'] });
      setSelectedIds([]);
      setSelectionMode(false);
    }
  });

  const updateImageMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GeneratedImage.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-images'] });
    }
  });

  const getGarment = (garmentId) => {
    return garments.find(g => g.id === garmentId);
  };

  const handleDownload = async (imageUrl, imageName) => {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${imageName || 'generated'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleBatchDownload = async () => {
    const selectedImages = images.filter(img => selectedIds.includes(img.id));
    for (const image of selectedImages) {
      const garment = getGarment(image.garment_id);
      await handleDownload(image.image_url, garment?.name);
      await new Promise(resolve => setTimeout(resolve, 500)); // Delay between downloads
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(images.map(img => img.id));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-black dark:text-white mb-1">Galleri</h1>
          <p className="text-black/60 dark:text-white/60">
            {selectionMode && selectedIds.length > 0 
              ? `${selectedIds.length} valda av ${images.length}` 
              : `${images.length} genererade bilder`}
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectionMode(!selectionMode);
            setSelectedIds([]);
          }}
          variant="outline"
          className="border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
        >
          {selectionMode ? 'Avbryt' : 'Välj flera'}
        </Button>
      </div>

      {/* Batch Actions */}
      {selectionMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl flex items-center gap-3 flex-wrap"
        >
          <Button
            onClick={selectAll}
            variant="ghost"
            size="sm"
            className="text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
          >
            Markera alla
          </Button>
          <Button
            onClick={deselectAll}
            variant="ghost"
            size="sm"
            className="text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
          >
            Avmarkera alla
          </Button>
          <div className="flex-1" />
          <Button
            onClick={handleBatchDownload}
            disabled={selectedIds.length === 0}
            className="bg-[#392599] hover:bg-[#4a2fb3] text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Ladda ner ({selectedIds.length})
          </Button>
          <Button
            onClick={() => setDeleteId('batch')}
            disabled={selectedIds.length === 0}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Ta bort ({selectedIds.length})
          </Button>
        </motion.div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-16">
          <Image className="h-16 w-16 text-black/20 dark:text-white/20 mx-auto mb-4" />
          <h2 className="text-xl text-black dark:text-white mb-2">Inga bilder genererade ännu</h2>
          <p className="text-black/60 dark:text-white/60 mb-6">
            Ladda upp ett plagg och generera din första bild
          </p>
          <Link to={createPageUrl('Upload')}>
            <Button className="bg-[#C9A962] hover:bg-[#B89952] text-black font-medium rounded-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Generera bild
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Processing Images */}
          {processingImages.map((image) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-[#392599]/20 to-[#392599]/10 border-2 border-[#392599]/30 flex items-center justify-center relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#392599]/30 to-transparent animate-pulse" />
              <div className="relative z-10 text-center p-4">
                <div className="h-12 w-12 rounded-full bg-[#392599]/20 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="h-6 w-6 animate-pulse text-[#392599]" />
                </div>
                <p className="text-sm font-medium text-[#392599]">Genererar</p>
                <p className="text-xs text-[#392599]/60 mt-1">Kommer snart...</p>
              </div>
            </motion.div>
          ))}

          {/* Completed Images */}
          {images.map((image, index) => {
            const garment = getGarment(image.garment_id);
            return (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
              >
                <div 
                  className={`aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 border transition-all cursor-pointer ${
                    selectionMode && selectedIds.includes(image.id)
                      ? 'border-[#392599] ring-2 ring-[#392599]/50'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => selectionMode ? toggleSelection(image.id) : setSelectedImage(image)}
                >
                  {image.image_url ? (
                    <SignedImage
                      src={image.image_url}
                      alt="Generated"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="h-12 w-12 text-white/20" />
                    </div>
                  )}
                  
                  {/* Selection Checkbox */}
                  {selectionMode && (
                    <div className="absolute top-3 left-3 z-10">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors ${
                        selectedIds.includes(image.id) 
                          ? 'bg-[#392599]' 
                          : 'bg-white/20 backdrop-blur-sm'
                      }`}>
                        {selectedIds.includes(image.id) && (
                          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Info Button */}
                  {!selectionMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoImage(image);
                      }}
                      className="absolute top-3 left-3 z-10 h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Info className="h-4 w-4 text-white" />
                    </button>
                  )}
                  
                  {/* Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity ${
                    selectionMode ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                  }`} />
                  
                  {/* Quick actions */}
                  {!selectionMode && (
                    <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(image.image_url, garment?.name);
                      }}
                      className="flex-1 bg-white/20 hover:bg-white/30 text-white rounded-full text-sm backdrop-blur-sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Ladda ner
                    </Button>
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(image.id);
                      }}
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 rounded-full bg-white/20 hover:bg-red-500/50 text-white backdrop-blur-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  )}
                  
                  {/* Zoom indicator */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-8 w-8 rounded-full bg-black/50 flex items-center justify-center">
                      <ZoomIn className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
                
                {/* Info */}
                <div className="mt-3 px-1">
                  <h3 className="text-black dark:text-white font-medium truncate">
                    {garment?.name || 'Okänt plagg'}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-black/40 dark:text-white/40 mt-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(image.created_date), 'd MMMM yyyy', { locale: sv })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black"
            onClick={() => {
              if (fullScale) {
                setFullScale(false);
              } else {
                setSelectedImage(null);
                setFullScale(false);
              }
            }}
          >
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
                setFullScale(false);
              }}
              className="fixed top-6 right-6 z-20 p-3 bg-white/90 hover:bg-white rounded-lg transition-colors shadow-lg"
            >
              <X className="h-6 w-6 text-black" />
            </button>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="h-full flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`flex-1 flex justify-center ${fullScale ? 'overflow-auto items-start py-24' : 'items-center pt-20 pb-24'}`}
                onClick={() => setFullScale(!fullScale)}
              >
                <SignedImage
                  src={selectedImage.image_url}
                  alt="Generated"
                  className={`${fullScale ? 'cursor-zoom-out' : 'max-w-[90vw] max-h-[calc(100vh-280px)] object-contain cursor-zoom-in'}`}
                />
              </div>
              
              <div className="fixed bottom-0 left-0 right-0 flex justify-center gap-4 p-6 bg-black/80 backdrop-blur-sm">
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingImage({
                      ...selectedImage,
                      showAdvanced: true
                    });
                    setCurrentImageUrl(selectedImage.image_url);
                    setSelectedImage(null);
                    setFullScale(false);
                  }}
                  className="bg-[#392599] hover:bg-[#4a2fb3] text-white font-medium rounded-full"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Redigera
                </Button>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(selectedImage.image_url, getGarment(selectedImage.garment_id)?.name);
                  }}
                  className="bg-black hover:bg-black/80 border border-white/20 text-white font-medium rounded-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Ladda ner
                </Button>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(selectedImage.id);
                    setSelectedImage(null);
                    setFullScale(false);
                  }}
                  variant="outline"
                  className="border-red-600 text-white bg-red-600 hover:bg-red-700 rounded-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Ta bort
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl overflow-y-auto"
            onClick={() => {
              setEditingImage(null);
              setCurrentImageUrl(null);
            }}
          >
            <div className="min-h-screen flex items-start justify-center p-4 py-8">
              <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => {
                    setEditingImage(null);
                    setCurrentImageUrl(null);
                  }}
                  className="fixed top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="h-6 w-6 text-white" />
                </button>

                <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/10">
                  <h2 className="text-2xl font-semibold text-white mb-6">Redigera bild</h2>
                  
                  <div ref={imagePreviewRef} className="mb-6 rounded-2xl overflow-hidden bg-white/5 relative">
                    <SignedImage
                      src={currentImageUrl}
                      alt="Editing"
                      className="w-full h-auto object-contain"
                    />
                    {isRegenerating && (
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-[#392599]/30"
                          animate={{
                            opacity: [0.3, 0.6, 0.3],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <div className="relative z-10 text-white text-6xl font-bold">
                          {regenerationProgress}%
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <ImageRefinementPanel
                    currentImage={currentImageUrl}
                    originalGeneratedImageId={editingImage.id}
                    originalPrompt={editingImage.prompt_used}
                    garmentImageUrl={editingImage.garment_urls || (getGarment(editingImage.garment_id)?.image_url ? [getGarment(editingImage.garment_id).image_url] : [])}
                    initialShowAdvanced={editingImage.showAdvanced}
                    onImageUpdated={(newUrl) => setCurrentImageUrl(newUrl)}
                    onProcessingChange={(isProcessing, progress) => {
                      setIsRegenerating(isProcessing);
                      setRegenerationProgress(progress);
                    }}
                    onGenerateImage={async (prompt, imageUrls) => {
                      const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
                      const result = await base44.integrations.Core.GenerateImage({
                        prompt: prompt,
                        existing_image_urls: urls
                      });
                      return { image_url: result.url };
                    }}
                    onSaveImage={async (imageUrl, promptUsed) => {
                      await updateImageMutation.mutateAsync({
                        id: editingImage.id,
                        data: {
                          image_url: imageUrl,
                          prompt_used: promptUsed
                        }
                      });
                      setEditingImage(null);
                      setCurrentImageUrl(null);
                    }}
                    onClose={() => {
                      setEditingImage(null);
                      setCurrentImageUrl(null);
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {infoImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setInfoImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#1A1A1A] border dark:border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-black/10 dark:border-white/10 flex items-center justify-between sticky top-0 bg-white dark:bg-[#1A1A1A] z-10">
                <h2 className="text-xl font-semibold text-black dark:text-white">Genereringsinformation</h2>
                <button
                  onClick={() => setInfoImage(null)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-black dark:text-white" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Original Garment */}
                {(() => {
                  const garment = getGarment(infoImage.garment_id);
                  return (
                    <div>
                      <h3 className="text-sm font-medium text-black/60 dark:text-white/60 mb-3">Originalplagg</h3>
                      <div className="flex gap-4">
                        <div className="w-24 h-32 rounded-lg overflow-hidden bg-[#f5f5f7] dark:bg-white/5">
                          {garment?.image_url ? (
                            <SignedImage src={garment.image_url} alt="Original" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Sparkles className="h-8 w-8 text-white/20" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="text-xs text-black/40 dark:text-white/40">Namn</p>
                            <p className="text-sm text-black dark:text-white">{garment?.name || 'Okänt'}</p>
                          </div>
                          {garment?.category && (
                            <div>
                              <p className="text-xs text-black/40 dark:text-white/40">Kategori</p>
                              <p className="text-sm text-black dark:text-white capitalize">{garment.category}</p>
                            </div>
                          )}
                          {garment?.brand && (
                            <div>
                              <p className="text-xs text-black/40 dark:text-white/40">Varumärke</p>
                              <p className="text-sm text-black dark:text-white">{garment.brand}</p>
                            </div>
                          )}
                          {garment?.sku && (
                            <div>
                              <p className="text-xs text-black/40 dark:text-white/40">SKU</p>
                              <p className="text-sm text-black dark:text-white">{garment.sku}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {garment?.image_url && (
                        <a 
                          href={garment.image_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-3 text-xs text-[#392599] hover:underline inline-flex items-center gap-1"
                        >
                          Öppna originalbild i nytt fönster →
                        </a>
                      )}
                    </div>
                  );
                })()}

                {/* AI Analysis */}
                {infoImage.ai_analysis && (
                  <div>
                    <h3 className="text-sm font-medium text-black/60 dark:text-white/60 mb-3">AI-analys (Produktbeskrivning)</h3>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30 rounded-xl space-y-3">
                      {infoImage.ai_analysis.description && (
                        <div>
                          <p className="text-sm text-green-700 dark:text-green-300 italic mb-3">
                            "{infoImage.ai_analysis.description}"
                          </p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(infoImage.ai_analysis.description);
                            }}
                            className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                          >
                            Kopiera produkttext
                          </button>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {infoImage.ai_analysis.style && (
                          <div className="p-2 bg-white/60 dark:bg-black/20 rounded">
                            <p className="text-green-600 dark:text-green-400">Stil</p>
                            <p className="text-black dark:text-white capitalize">{infoImage.ai_analysis.style}</p>
                          </div>
                        )}
                        {infoImage.ai_analysis.category && (
                          <div className="p-2 bg-white/60 dark:bg-black/20 rounded">
                            <p className="text-green-600 dark:text-green-400">Kategori</p>
                            <p className="text-black dark:text-white capitalize">{infoImage.ai_analysis.category}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Generation Info */}
                <div>
                  <h3 className="text-sm font-medium text-black/60 dark:text-white/60 mb-3">Genererad bild</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-black/60 dark:text-white/60">Skapad</span>
                      <span className="text-black dark:text-white">
                        {format(new Date(infoImage.created_date), 'd MMMM yyyy', { locale: sv })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/60 dark:text-white/60">Status</span>
                      <span className="text-black dark:text-white capitalize">{infoImage.status}</span>
                    </div>
                  </div>
                </div>

                {/* Prompt */}
                {infoImage.prompt_used && (
                  <div>
                    <h3 className="text-sm font-medium text-black/60 dark:text-white/60 mb-3">Använd prompt</h3>
                    <div className="p-3 bg-[#f5f5f7] dark:bg-white/5 rounded-lg text-xs text-black dark:text-white font-mono whitespace-pre-wrap break-words">
                      {infoImage.prompt_used}
                    </div>
                  </div>
                )}

                {/* Generated Image Link */}
                <div>
                  <h3 className="text-sm font-medium text-black/60 dark:text-white/60 mb-3">Bildlänk</h3>
                  <a 
                    href={infoImage.image_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-[#392599] hover:underline inline-flex items-center gap-1 break-all"
                  >
                    {infoImage.image_url}
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#1A1A1A] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {deleteId === 'batch' ? 'Ta bort valda bilder' : 'Ta bort bild'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {deleteId === 'batch' 
                ? `Är du säker på att du vill ta bort ${selectedIds.length} bilder? Denna åtgärd kan inte ångras.`
                : 'Är du säker på att du vill ta bort denna bild? Denna åtgärd kan inte ångras.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              Avbryt
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId === 'batch') {
                  batchDeleteMutation.mutate(selectedIds);
                } else {
                  deleteMutation.mutate(deleteId);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}