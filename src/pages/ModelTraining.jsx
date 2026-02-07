import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Sparkles,
  Loader2,
  Check,
  X,
  Play,
  Trash2,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SignedImage } from '@/components/ui/SignedImage';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { sv, enUS } from 'date-fns/locale';
import { useLanguage } from '../components/LanguageContext';

export default function ModelTraining() {
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();
  const [showNew, setShowNew] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const { data: customModels = [], isLoading } = useQuery({
    queryKey: ['custom-models'],
    queryFn: () => base44.entities.CustomModel.list('-created_date')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomModel.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-models'] });
      setDeleteId(null);
    }
  });

  const statusConfig = {
    uploading: { color: 'bg-blue-500/20 text-blue-400', icon: Upload, label: language === 'sv' ? 'Laddar upp' : 'Uploading' },
    training: { color: 'bg-yellow-500/20 text-yellow-400', icon: Loader2, label: language === 'sv' ? 'Tränar' : 'Training' },
    ready: { color: 'bg-green-500/20 text-green-400', icon: Check, label: language === 'sv' ? 'Klar' : 'Ready' },
    failed: { color: 'bg-red-500/20 text-red-400', icon: AlertCircle, label: language === 'sv' ? 'Misslyckades' : 'Failed' }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-black dark:text-white mb-1">
            {t.trainCustomModels}
          </h1>
          <p className="text-black/60 dark:text-white/60">
            {t.uploadImagesToTeach}
          </p>
        </div>

        <Button
          onClick={() => setShowNew(true)}
          className="bg-[#392599] hover:bg-[#4a2fb3] text-white rounded-full"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {t.newModel}
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="bg-[#f5f5f7] dark:bg-white/5 rounded-2xl p-6">
          <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
            <ImageIcon className="h-5 w-5 text-blue-500" />
          </div>
          <h3 className="font-medium text-black dark:text-white mb-2">{t.poseTraining}</h3>
          <p className="text-sm text-black/60 dark:text-white/60">
            {t.learnSpecificPoses}
          </p>
        </div>
        <div className="bg-[#f5f5f7] dark:bg-white/5 rounded-2xl p-6">
          <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
            <Sparkles className="h-5 w-5 text-purple-500" />
          </div>
          <h3 className="font-medium text-black dark:text-white mb-2">{t.styleTraining}</h3>
          <p className="text-sm text-black/60 dark:text-white/60">
            {t.createConsistentAesthetic}
          </p>
        </div>
        <div className="bg-[#f5f5f7] dark:bg-white/5 rounded-2xl p-6">
          <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
            <Check className="h-5 w-5 text-green-500" />
          </div>
          <h3 className="font-medium text-black dark:text-white mb-2">{t.composition}</h3>
          <p className="text-sm text-black/60 dark:text-white/60">
            {t.learnLayoutComposition}
          </p>
        </div>
      </div>

      {/* Models Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-2xl bg-[#f5f5f7] dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : customModels.length === 0 ? (
        <div className="text-center py-16">
          <Sparkles className="h-16 w-16 text-black/20 dark:text-white/20 mx-auto mb-4" />
          <h2 className="text-xl text-black dark:text-white mb-2">{t.noTrainedModels}</h2>
          <p className="text-black/60 dark:text-white/60 mb-6">
            {t.createFirstCustomModel}
          </p>
          <Button
            onClick={() => setShowNew(true)}
            className="bg-[#392599] hover:bg-[#4a2fb3] text-white rounded-full"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {t.getStarted}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customModels.map((model, index) => {
            const status = statusConfig[model.status];
            const StatusIcon = status.icon;
            
            return (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#f5f5f7] dark:bg-white/5 rounded-2xl p-6 border border-black/5 dark:border-white/10"
              >
                {/* Preview Grid */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {model.training_images?.slice(0, 3).map((url, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden bg-black/5 dark:bg-white/5">
                      <SignedImage src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {model.training_images?.length > 3 && (
                    <div className="col-span-3 text-center text-xs text-black/40 dark:text-white/40 mt-1">
                      +{model.training_images.length - 3} {t.moreImages}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-black dark:text-white">{model.name}</h3>
                    <Badge className={cn('text-xs', status.color)}>
                      <StatusIcon className={cn('h-3 w-3 mr-1', model.status === 'training' && 'animate-spin')} />
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-black/60 dark:text-white/60 line-clamp-2">
                    {model.description}
                  </p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-black/40 dark:text-white/40">
                    <span className="capitalize">{model.type}</span>
                    {model.trained_date && (
                      <span>{format(new Date(model.trained_date), 'd MMM', { locale: language === 'sv' ? sv : enUS })}</span>
                    )}
                    {model.usage_count > 0 && (
                      <span>{model.usage_count} {t.uses}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {model.status === 'ready' && (
                    <Button
                      size="sm"
                      className="flex-1 bg-[#392599] hover:bg-[#4a2fb3] text-white rounded-full"
                    >
                      {t.useModel}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteId(model.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {model.status === 'failed' && model.error_message && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-xs text-red-500">{model.error_message}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* New Model Modal */}
      {showNew && (
        <NewModelForm
          onClose={() => setShowNew(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['custom-models'] });
            setShowNew(false);
          }}
        />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#1A1A1A] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{t.deleteModelTraining}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {t.deleteTrainedModelConfirm}
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
    </div>
  );
}

function NewModelForm({ onClose, onSuccess }) {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'pose',
    training_prompt: ''
  });
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [training, setTraining] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomModel.create(data),
    onSuccess: onSuccess
  });

  const handleImageUpload = async (files) => {
    setUploading(true);
    const uploaded = [];
    
    for (const file of Array.from(files)) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploaded.push(file_url);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
    
    setImages([...images, ...uploaded]);
    setUploading(false);
  };

  const handleTrain = async () => {
    if (images.length < 3) return;
    
    setTraining(true);
    try {
      // Create the model record
      await createMutation.mutateAsync({
        ...formData,
        training_images: images,
        status: 'training'
      });
      
      // In a real implementation, this would trigger actual model training
      // For now, we simulate it
    } catch (error) {
      console.error('Training failed:', error);
    } finally {
      setTraining(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-white dark:bg-[#1A1A1A] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-black dark:text-white">{t.trainNewModel}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-black dark:text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <Label className="text-black dark:text-white">{t.name} *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={language === 'sv' ? 'T.ex. Sittande pose' : 'E.g. Sitting pose'}
              className="mt-2 bg-[#f5f5f7] dark:bg-white/5 border-black/10 dark:border-white/10 dark:text-white dark:placeholder:text-white/40"
            />
          </div>

          <div>
            <Label className="text-black dark:text-white">{t.type} *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger className="mt-2 bg-[#f5f5f7] dark:bg-white/5 border-black/10 dark:border-white/10 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#1a1a1a] border-black/10 dark:border-white/10">
                <SelectItem value="pose">{t.pose}</SelectItem>
                <SelectItem value="style">{t.style}</SelectItem>
                <SelectItem value="composition">{t.composition}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-black dark:text-white">{t.description}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t.whatShouldLearn}
              className="mt-2 bg-[#f5f5f7] dark:bg-white/5 border-black/10 dark:border-white/10 min-h-[80px] dark:text-white dark:placeholder:text-white/40"
            />
          </div>

          <div>
            <Label className="text-black dark:text-white">{t.trainingPromptOptional}</Label>
            <Input
              value={formData.training_prompt}
              onChange={(e) => setFormData({ ...formData, training_prompt: e.target.value })}
              placeholder={language === 'sv' ? "T.ex. 'model sitting on chair, professional photography'" : "E.g. 'model sitting on chair, professional photography'"}
              className="mt-2 bg-[#f5f5f7] dark:bg-white/5 border-black/10 dark:border-white/10 dark:text-white dark:placeholder:text-white/40"
            />
          </div>

          {/* Image Upload */}
          <div>
            <Label className="text-black dark:text-white mb-2 flex items-center justify-between">
              <span>{t.trainingImages} * ({t.atLeast3Recommended})</span>
              <span className="text-sm text-black/40 dark:text-white/40">{images.length} {t.uploaded}</span>
            </Label>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files)}
              className="hidden"
              id="training-images"
            />

            <label
              htmlFor="training-images"
              className={cn(
                "mt-2 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors",
                uploading ? "border-[#392599] bg-[#392599]/10" : "border-black/20 dark:border-white/20 hover:border-black/30 dark:hover:border-white/30"
              )}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 text-[#392599] animate-spin mb-2" />
                  <p className="text-sm text-black dark:text-white">{t.uploading}</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-black/40 dark:text-white/40 mb-2" />
                  <p className="text-sm text-black dark:text-white">{t.clickToSelectImages}</p>
                  <p className="text-xs text-black/40 dark:text-white/40 mt-1">{t.orDragAndDrop}</p>
                </>
              )}
            </label>

            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {images.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 group">
                    <SignedImage src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-black dark:text-white space-y-1">
                <p className="font-medium">{t.tipsForBestResults}</p>
                <ul className="text-black/60 dark:text-white/60 space-y-1 ml-4 list-disc">
                  <li>{t.useSimilarLighting}</li>
                  <li>{t.forPoseTraining}</li>
                  <li>{t.forStyleTraining}</li>
                  <li>{t.minImagesRecommended}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-black/10 dark:border-white/10 flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-black/10 dark:border-white/10"
          >
            {t.cancel}
          </Button>
          <Button
            onClick={handleTrain}
            disabled={!formData.name || images.length < 3 || training}
            className="flex-1 bg-[#392599] hover:bg-[#4a2fb3] text-white"
          >
            {training ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t.startingTraining}
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                {t.startTraining}
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}