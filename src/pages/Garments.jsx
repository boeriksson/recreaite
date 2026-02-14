import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/amplifyClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shirt,
  Search,
  Plus,
  Trash2,
  Info,
  Loader2,
  RefreshCw,
  X,
  ZoomIn,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { SignedImage } from "@/components/ui/SignedImage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { sv, enUS } from 'date-fns/locale';
import { useLanguage } from '../components/LanguageContext';

export default function Garments() {
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();

  const categoryLabels = {
    tops: t.tops,
    bottoms: t.bottoms,
    dresses: t.dresses,
    outerwear: t.outerwear,
    accessories: t.accessories
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [infoGarment, setInfoGarment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedGarment, setEditedGarment] = useState(null);
  const [regeneratingFlatlay, setRegeneratingFlatlay] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [fullScale, setFullScale] = useState(false);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedImage]);

  const { data: garments = [], isLoading } = useQuery({
    queryKey: ['garments'],
    queryFn: () => base44.entities.Garment.list('-createdAt')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Garment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garments'] });
      setDeleteId(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Garment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garments'] });
      setIsEditing(false);
      setInfoGarment(null);
    }
  });

  const handleOpenInfo = (garment) => {
    setInfoGarment(garment);
    setEditedGarment(garment);
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    updateMutation.mutate({
      id: editedGarment.id,
      data: {
        name: editedGarment.name,
        category: editedGarment.category,
        brand: editedGarment.brand,
        sku: editedGarment.sku,
        ai_description: editedGarment.ai_description
      }
    });
  };

  const handleRegenerateFlatlay = async () => {
    if (!infoGarment?.original_image_url) return;

    setRegeneratingFlatlay(true);
    try {
      const flatlayResult = await base44.integrations.Core.GenerateImage({
        prompt: 'Create a professional flatlay product photography of this garment on a clean white background. The garment should be laid flat, well-lit, wrinkle-free, centered in frame with even lighting and shadows. Professional e-commerce product photography style.',
        existing_image_urls: [infoGarment.original_image_url]
      });

      await base44.entities.Garment.update(infoGarment.id, {
        image_url: flatlayResult.url
      });

      queryClient.invalidateQueries({ queryKey: ['garments'] });
      setInfoGarment(null);
    } catch (error) {
      console.error('Failed to regenerate flatlay:', error);
    } finally {
      setRegeneratingFlatlay(false);
    }
  };

  const filteredGarments = garments.filter(garment =>
    garment.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    garment.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    garment.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-black dark:text-white mb-1">{t.myGarments}</h1>
          <p className="text-black/60 dark:text-white/60">{garments.length} {t.garmentsTotal}</p>
        </div>

        <Link to={createPageUrl('UploadGarment')}>
          <Button className="bg-[#392599] hover:bg-[#4a2fb3] text-white font-medium rounded-full">
            <Plus className="h-4 w-4 mr-2" />
            {t.uploadGarment}
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40 dark:text-white/40" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchGarments}
          className="pl-10 bg-white/5 border-black/20 dark:border-white/20 text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus:border-[#C9A962] rounded-full"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filteredGarments.length === 0 ? (
        <div className="text-center py-16">
          <Shirt className="h-16 w-16 text-black/20 dark:text-white/20 mx-auto mb-4" />
          <h2 className="text-xl text-black dark:text-white mb-2">
            {searchQuery ? t.noMatchingGarments : t.noGarmentsYet}
          </h2>
          <p className="text-black/60 dark:text-white/60 mb-6">
            {searchQuery
              ? t.tryDifferentSearch
              : t.uploadFirstGarment}
          </p>
          {!searchQuery && (
            <Link to={createPageUrl('UploadGarment')}>
              <Button className="bg-[#392599] hover:bg-[#4a2fb3] text-white font-medium rounded-full">
                <Plus className="h-4 w-4 mr-2" />
                {t.uploadGarment}
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredGarments.map((garment, index) => (
            <motion.div
              key={garment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative"
            >
              <div
                className="aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                onClick={() => setSelectedImage(garment)}
              >
                {garment.image_url ? (
                  <SignedImage
                    src={garment.image_url}
                    alt={garment.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Shirt className="h-12 w-12 text-white/20" />
                  </div>
                )}

                {/* Info Button - Left */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenInfo(garment);
                  }}
                  className="absolute top-3 left-3 z-10 h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Info className="h-4 w-4 text-white" />
                </button>

                {/* Delete Button - Center */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(garment.id);
                  }}
                  className="absolute top-3 left-1/2 -translate-x-1/2 z-10 h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4 text-white" />
                </button>

                {/* Zoom indicator - Right */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <ZoomIn className="h-4 w-4 text-white" />
                  </div>
                </div>

                {/* Hover Overlay with Info */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#392599] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-2xl flex flex-col justify-end p-4">
                  <h3 className="text-white font-medium truncate">
                    {garment.name || t.unknownGarment}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-white/80 mt-1">
                    <Calendar className="h-3 w-3" />
                    {garment.createdAt
                      ? format(new Date(garment.createdAt), 'd MMMM yyyy', { locale: language === 'sv' ? sv : enUS })
                      : '-'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#1A1A1A] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{t.deleteGarment}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {t.deleteGarmentConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Information Dialog */}
      <Dialog open={!!infoGarment} onOpenChange={() => { setInfoGarment(null); setIsEditing(false); }}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{t.garmentInformationTitle}</DialogTitle>
            {!isEditing && infoGarment?.createdAt && (
              <DialogDescription className="text-white/60">
                {t.created}: {format(new Date(infoGarment.createdAt), 'PPP', { locale: language === 'sv' ? sv : enUS })}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Flatlay Image */}
            {infoGarment?.image_url && (
              <div>
                <Label className="text-white/60 mb-2 block">{language === 'sv' ? 'Flatlay-bild (genererad)' : 'Flatlay image (generated)'}</Label>
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-white/5 relative">
                  <SignedImage
                    src={infoGarment.image_url}
                    alt={infoGarment.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Original Image */}
            {infoGarment?.original_image_url && (
              <div>
                <Label className="text-white/60 mb-2 block">{language === 'sv' ? 'Originalfoto' : 'Original photo'}</Label>
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-white/5">
                  <SignedImage
                    src={infoGarment.original_image_url}
                    alt={`${infoGarment.name} original`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <Button
                  onClick={handleRegenerateFlatlay}
                  disabled={regeneratingFlatlay}
                  className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {regeneratingFlatlay ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {language === 'sv' ? 'Genererar ny flatlay...' : 'Generating new flatlay...'}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {language === 'sv' ? 'Generera ny flatlay-bild' : 'Generate new flatlay image'}
                    </>
                  )}
                </Button>
              </div>
            )}

            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label className="text-white">{t.name}</Label>
                  <Input
                    value={editedGarment?.name || ''}
                    onChange={(e) => setEditedGarment({ ...editedGarment, name: e.target.value })}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">{t.category}</Label>
                  <Select
                    value={editedGarment?.category || ''}
                    onValueChange={(value) => setEditedGarment({ ...editedGarment, category: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tops">{t.tops}</SelectItem>
                      <SelectItem value="bottoms">{t.bottoms}</SelectItem>
                      <SelectItem value="dresses">{t.dresses}</SelectItem>
                      <SelectItem value="outerwear">{t.outerwear}</SelectItem>
                      <SelectItem value="accessories">{t.accessories}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">{t.brand}</Label>
                  <Input
                    value={editedGarment?.brand || ''}
                    onChange={(e) => setEditedGarment({ ...editedGarment, brand: e.target.value })}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">{t.sku}</Label>
                  <Input
                    value={editedGarment?.sku || ''}
                    onChange={(e) => setEditedGarment({ ...editedGarment, sku: e.target.value })}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">{t.aiDescription}</Label>
                  <Textarea
                    value={editedGarment?.ai_description || ''}
                    onChange={(e) => setEditedGarment({ ...editedGarment, ai_description: e.target.value })}
                    className="bg-white/5 border-white/20 text-white min-h-[100px]"
                    placeholder={t.noAiDescription}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-white/60">{t.name}</Label>
                  <p className="text-white">{infoGarment?.name || '-'}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/60">{t.category}</Label>
                  <p className="text-white">
                    {infoGarment?.category ? categoryLabels[infoGarment.category] : '-'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/60">{t.brand}</Label>
                  <p className="text-white">{infoGarment?.brand || '-'}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/60">{t.sku}</Label>
                  <p className="text-white">{infoGarment?.sku || '-'}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/60">{t.aiDescription}</Label>
                  <p className="text-white/80 text-sm whitespace-pre-wrap">
                    {infoGarment?.ai_description || t.noAiDescription}
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedGarment(infoGarment);
                  }}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  {t.cancel}
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending}
                  className="bg-[#392599] hover:bg-[#4a2fb3] text-white"
                >
                  {updateMutation.isPending ? t.saving : t.save}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-[#392599] hover:bg-[#4a2fb3] text-white"
              >
                {t.editInformation}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black overflow-y-auto overscroll-contain"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
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
              className="fixed top-4 sm:top-6 right-4 sm:right-6 z-20 p-3 bg-white/90 hover:bg-white rounded-lg transition-colors shadow-lg"
            >
              <X className="h-6 w-6 text-black" />
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="min-h-screen flex flex-col pt-20 pb-32 sm:pb-24"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex-1 flex justify-center items-start sm:items-center px-4"
                onClick={() => setFullScale(!fullScale)}
              >
                <SignedImage
                  src={selectedImage.image_url}
                  alt={selectedImage.name}
                  className={`${fullScale ? 'cursor-zoom-out w-full' : 'max-w-full max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-200px)] object-contain cursor-zoom-in'}`}
                />
              </div>

              <div className="fixed bottom-0 left-0 right-0 flex flex-col gap-3 p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
                {/* Garment Info */}
                <div className="text-center">
                  <h3 className="text-white font-medium text-lg">{selectedImage.name}</h3>
                  {selectedImage.brand && (
                    <p className="text-white/60 text-sm">{selectedImage.brand}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                  <Link to={`${createPageUrl('Upload')}?garment=${selectedImage.id}`}>
                    <Button className="bg-[#392599] hover:bg-[#4a2fb3] text-white font-medium rounded-full w-full sm:w-auto">
                      <Sparkles className="h-4 w-4 mr-2" />
                      {t.generateImage}
                    </Button>
                  </Link>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenInfo(selectedImage);
                      setSelectedImage(null);
                      setFullScale(false);
                    }}
                    className="bg-black hover:bg-black/80 border border-white/20 text-white font-medium rounded-full w-full sm:w-auto"
                  >
                    <Info className="h-4 w-4 mr-2" />
                    {t.information}
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(selectedImage.id);
                      setSelectedImage(null);
                      setFullScale(false);
                    }}
                    variant="outline"
                    className="border-red-600 text-white bg-red-600 hover:bg-red-700 rounded-full w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t.delete}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}