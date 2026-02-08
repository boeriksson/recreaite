import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { SignedImage } from "@/components/ui/SignedImage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RefreshCw, 
  Maximize2, 
  Edit3, 
  Loader2, 
  Check,
  X,
  Save,
  Image as ImageIcon,
  Palette,
  User,
  Lightbulb
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { base44 } from '@/api/amplifyClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ImageRefinementPanel({ 
  currentImage,
  currentImages, // { fullBody, framed } if dual images
  originalGeneratedImageId, // ID of the original GeneratedImage entity
  originalPrompt,
  garmentImageUrl,
  onImageUpdated,
  onImagesUpdated,
  onGenerateImage,
  onSaveImage,
  onClose,
  onProcessingChange,
  initialShowAdvanced = false
}) {
  const queryClient = useQueryClient();
  const [showAdvanced, setShowAdvanced] = useState(initialShowAdvanced);
  const [editPrompt, setEditPrompt] = useState('');
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workingImageUrl, setWorkingImageUrl] = useState(currentImage);
  const [workingImages, setWorkingImages] = useState(currentImages);
  const [activeVersionId, setActiveVersionId] = useState(originalGeneratedImageId);
  const [activeImageType, setActiveImageType] = useState('fullBody'); // 'fullBody' or 'framed'
  const [generationProgress, setGenerationProgress] = useState(0);

  const { data: savedVersions = [], refetch: refetchSavedVersions } = useQuery({
    queryKey: ['saved-image-versions', originalGeneratedImageId],
    queryFn: () => base44.entities.SavedImage.filter({ original_image_id: originalGeneratedImageId }),
    enabled: !!originalGeneratedImageId,
  });

  const { data: customModels = [] } = useQuery({
    queryKey: ['custom-models'],
    queryFn: () => base44.entities.Model.list('-created_date'),
    initialData: [],
  });
  
  // Update working URL when currentImage prop changes
  React.useEffect(() => {
    setWorkingImageUrl(currentImage);
    setWorkingImages(currentImages);
    setActiveVersionId(originalGeneratedImageId);
  }, [currentImage, currentImages, originalGeneratedImageId]);

  // Handle switching between versions
  const handleVersionSelect = (version) => {
    setWorkingImageUrl(version.image_url);
    setActiveVersionId(version.id);
    onImageUpdated(version.image_url);
  };

  const handleRegenerate = async () => {
    setProcessing(true);
    setGenerationProgress(0);
    onProcessingChange?.(true, 0);
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        const newProgress = prev < 90 ? prev + 10 : prev;
        onProcessingChange?.(true, newProgress);
        return newProgress;
      });
    }, 800);
    try {
      const cleanPrompt = originalPrompt + '. 4:5 aspect ratio, portrait orientation. CRITICAL: DO NOT add, modify, embellish, hallucinate, or invent ANY features, decorations, patterns, or details on the garment that are not in the reference image. Keep garment IDENTICAL to reference. No text, no watermarks, no labels in the image.';
      // For style mode, regenerate with all garment URLs; otherwise use single garment
      const imageRefs = Array.isArray(garmentImageUrl) ? garmentImageUrl : (garmentImageUrl ? [garmentImageUrl] : []);
      const result = await onGenerateImage(cleanPrompt, imageRefs);
      if (result?.image_url) {
        const newUrl = result.image_url;
        setWorkingImageUrl(newUrl);
        onImageUpdated(newUrl);
        await createSavedImageVersion(newUrl, cleanPrompt, 'Regenererad');
      }
    } catch (error) {
      console.error('Regeneration failed:', error);
    } finally {
      clearInterval(progressInterval);
      setGenerationProgress(100);
      onProcessingChange?.(true, 100);
      setTimeout(() => {
        setProcessing(false);
        onProcessingChange?.(false, 0);
      }, 300);
    }
  };

  const handleUpscale = async () => {
    setProcessing(true);
    setGenerationProgress(0);
    onProcessingChange?.(true, 0);
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        const newProgress = prev < 90 ? prev + 10 : prev;
        onProcessingChange?.(true, newProgress);
        return newProgress;
      });
    }, 800);
    try {
      const upscalePrompt = `Upscale this image to ultra high resolution. 4K quality, enhanced details, professional photography sharpness, crisp focus. Maintain exact same composition, colors, and content. 4:5 aspect ratio, portrait orientation. No text, no watermarks, no labels in the image.`;
      const result = await onGenerateImage(upscalePrompt, [workingImageUrl]);
      if (result?.image_url) {
        const newUrl = result.image_url;
        setWorkingImageUrl(newUrl);
        onImageUpdated(newUrl);
        await createSavedImageVersion(newUrl, upscalePrompt, 'Uppskalad');
      }
    } catch (error) {
      console.error('Upscale failed:', error);
    } finally {
      clearInterval(progressInterval);
      setGenerationProgress(100);
      onProcessingChange?.(true, 100);
      setTimeout(() => {
        setProcessing(false);
        onProcessingChange?.(false, 0);
      }, 300);
    }
  };

  const createSavedImageVersion = async (imageUrl, promptUsed, notes) => {
    if (!originalGeneratedImageId) return;
    try {
      const newVersion = await base44.entities.SavedImage.create({
        original_image_id: originalGeneratedImageId,
        image_url: imageUrl,
        version_number: savedVersions.length + 1,
        notes: notes || `Redigering ${savedVersions.length + 1}`,
        prompt_used: promptUsed || originalPrompt,
      });
      refetchSavedVersions();
      setActiveVersionId(newVersion.id);
    } catch (error) {
      console.error('Failed to save version:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveImage(workingImageUrl, originalPrompt);
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickEdit = async (editInstruction, label, isPoseChange = false) => {
    setProcessing(true);
    setGenerationProgress(0);
    onProcessingChange?.(true, 0);
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        const newProgress = prev < 90 ? prev + 10 : prev;
        onProcessingChange?.(true, newProgress);
        return newProgress;
      });
    }, 800);
    try {
      let modifiedPrompt;
      if (isPoseChange) {
        modifiedPrompt = `Use the reference images as basis. ${editInstruction}. 4:5 aspect ratio, portrait orientation. ABSOLUTE CRITICAL REQUIREMENTS: Keep the EXACT SAME model - same face, same hair, same features, identical facial identity from the reference. Keep the EXACT SAME garment - same colors, patterns, textures, style, fit, ALL details from the reference. DO NOT add, modify, embellish, hallucinate, or invent ANY features, decorations, patterns, or details on the garment that are not in the reference. The garment must be IDENTICAL. Keep the EXACT SAME background, lighting, and environment from the reference. ONLY change the body pose and position. Everything else must remain identical. No text, no watermarks, no labels in the image.`;
      } else {
        modifiedPrompt = `${originalPrompt}. ${editInstruction}. 4:5 aspect ratio, portrait orientation. CRITICAL: Keep the exact same model's face and features from the reference image. Maintain model's facial identity. DO NOT add, modify, embellish, hallucinate, or invent ANY new details on the garment. Keep garment exactly as it appears in reference. No text, no watermarks, no labels in the image.`;
      }
      // Filter out empty arrays and falsy values, ensuring only valid string URLs
      const garmentRef = Array.isArray(garmentImageUrl) && garmentImageUrl.length > 0 ? garmentImageUrl[0] : (typeof garmentImageUrl === 'string' ? garmentImageUrl : null);
      const imageRefs = [workingImageUrl, garmentRef].filter(url => url && typeof url === 'string');
      const result = await onGenerateImage(modifiedPrompt, imageRefs);
      if (result?.image_url) {
        const newUrl = result.image_url;
        setWorkingImageUrl(newUrl);
        onImageUpdated(newUrl);
        await createSavedImageVersion(newUrl, modifiedPrompt, label);
      }
    } catch (error) {
      console.error('Quick edit failed:', error);
    } finally {
      clearInterval(progressInterval);
      setGenerationProgress(100);
      onProcessingChange?.(true, 100);
      setTimeout(() => {
        setProcessing(false);
        onProcessingChange?.(false, 0);
      }, 300);
    }
  };

  const handleEdit = async () => {
    if (!editPrompt.trim()) return;
    
    setProcessing(true);
    setGenerationProgress(0);
    onProcessingChange?.(true, 0);
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        const newProgress = prev < 90 ? prev + 10 : prev;
        onProcessingChange?.(true, newProgress);
        return newProgress;
      });
    }, 800);
    try {
      const modifiedPrompt = `${originalPrompt}. Additional modification: ${editPrompt}. 4:5 aspect ratio, portrait orientation. CRITICAL: Keep the exact same model's face and features from the reference image. Maintain model's facial identity. DO NOT add, modify, embellish, hallucinate, or invent ANY new details on the garment beyond what is in the reference. Keep garment IDENTICAL to reference unless specifically instructed otherwise in the modification request. No text, no watermarks, no labels in the image.`;
      const garmentRef = Array.isArray(garmentImageUrl) && garmentImageUrl.length > 0 ? garmentImageUrl[0] : (typeof garmentImageUrl === 'string' ? garmentImageUrl : null);
      const imageRefs = [workingImageUrl, garmentRef].filter(url => url && typeof url === 'string');
      const result = await onGenerateImage(modifiedPrompt, imageRefs);
      if (result?.image_url) {
        const newUrl = result.image_url;
        setWorkingImageUrl(newUrl);
        onImageUpdated(newUrl);
        await createSavedImageVersion(newUrl, modifiedPrompt, 'Anpassad redigering');
        setEditPrompt('');
      }
    } catch (error) {
      console.error('Edit failed:', error);
    } finally {
      clearInterval(progressInterval);
      setGenerationProgress(100);
      onProcessingChange?.(true, 100);
      setTimeout(() => {
        setProcessing(false);
        onProcessingChange?.(false, 0);
      }, 300);
    }
  };

  const backgroundOptions = [
    { label: 'Studio Vit', prompt: 'Change background to professional white studio background with soft diffused lighting' },
    { label: 'Urban Gata', prompt: 'Change background to modern urban street setting, daytime, city atmosphere' },
    { label: 'Minimalist Interior', prompt: 'Change background to minimalist Scandinavian interior with natural light' },
    { label: 'Natur', prompt: 'Change background to natural outdoor setting with soft natural lighting' },
    { label: 'Strand', prompt: 'Change background to beach setting with golden hour lighting' },
    { label: 'Café', prompt: 'Change background to cozy café interior with warm ambient lighting' },
  ];

  const lightingOptions = [
    { label: 'Golden Hour', prompt: 'Adjust lighting to warm golden hour sunlight, soft and flattering' },
    { label: 'Studio Ljus', prompt: 'Adjust to professional studio lighting with key, fill, and rim lights' },
    { label: 'Naturligt Ljus', prompt: 'Adjust to soft natural window light, bright and airy' },
    { label: 'Dramatiskt', prompt: 'Adjust to dramatic lighting with strong shadows and highlights' },
    { label: 'Mjukt Diffust', prompt: 'Adjust to very soft diffused lighting, minimal shadows' },
  ];

  const poseOptions = [
    { label: 'Avslappnad', prompt: 'Change model pose to relaxed and casual stance' },
    { label: 'Dynamisk', prompt: 'Change model pose to dynamic movement, in motion' },
    { label: 'Sittande', prompt: 'Change model pose to seated position, comfortable' },
    { label: 'Gående', prompt: 'Change model pose to walking, mid-stride' },
    { label: 'Profil', prompt: 'Change model angle to side profile view' },
    { label: 'Halvprofil', prompt: 'Change model angle to three-quarter view' },
    { label: 'Ny Pose', prompt: 'Generate a completely new and different pose, maintaining the same model and garment but with fresh body position and angle' },
    { label: 'Modell Pose', prompt: 'Change to a professional fashion model pose, editorial style with confident posture and runway-inspired stance. CRITICAL: Keep the exact same background, lighting, and environment. Only change the model pose and body position, nothing else' },
  ];

  const handleFaceChange = async (facePrompt, label) => {
    setProcessing(true);
    setGenerationProgress(0);
    onProcessingChange?.(true, 0);
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        const newProgress = prev < 90 ? prev + 10 : prev;
        onProcessingChange?.(true, newProgress);
        return newProgress;
      });
    }, 800);
    try {
      const modifiedPrompt = `Use the reference images as basis. ${facePrompt}. ABSOLUTE CRITICAL REQUIREMENTS: Keep EVERYTHING from the reference image IDENTICAL - same garment with ALL details, same background, same lighting, same environment, same pose, same body position, same camera angle, same composition. ONLY change the model's face and head to match: ${facePrompt}. The garment must be exactly the same. The background must be exactly the same. The pose must be exactly the same. ONLY the face changes. 4:5 aspect ratio, portrait orientation. No text, no watermarks, no labels.`;
      const garmentRef = Array.isArray(garmentImageUrl) && garmentImageUrl.length > 0 ? garmentImageUrl[0] : (typeof garmentImageUrl === 'string' ? garmentImageUrl : null);
      const imageRefs = [workingImageUrl, garmentRef].filter(url => url && typeof url === 'string');
      
      const result = await onGenerateImage(modifiedPrompt, imageRefs);
      if (result?.image_url) {
        const newUrl = result.image_url;
        setWorkingImageUrl(newUrl);
        onImageUpdated(newUrl);
        await createSavedImageVersion(newUrl, modifiedPrompt, label);
      }
    } catch (error) {
      console.error('Face change failed:', error);
    } finally {
      clearInterval(progressInterval);
      setGenerationProgress(100);
      onProcessingChange?.(true, 100);
      setTimeout(() => {
        setProcessing(false);
        onProcessingChange?.(false, 0);
      }, 300);
    }
  };

  const faceOptions = [
    { label: 'Ung Kvinna (25)', prompt: 'A young 25 year old female model with fresh natural beauty and blonde hair' },
    { label: 'Mogen Kvinna (35)', prompt: 'A mature 35 year old female model, sophisticated and elegant' },
    { label: 'Ung Man (25)', prompt: 'A young 25 year old male model with masculine features, confident' },
    { label: 'Mogen Man (35)', prompt: 'A mature 35 year old male model, distinguished and professional' },
    { label: 'Asiatisk', prompt: 'An East Asian model with professional and elegant features' },
    { label: 'Afrikansk', prompt: 'An African model with strong and beautiful features' },
  ];

  const colorOptions = [
    { label: 'Varmare Toner', prompt: 'Adjust color temperature to warmer tones, add warmth to the image' },
    { label: 'Kallare Toner', prompt: 'Adjust color temperature to cooler tones, add cool blue tones' },
    { label: 'Mättad', prompt: 'Increase color saturation, make colors more vibrant and punchy' },
    { label: 'Dämpad', prompt: 'Decrease color saturation, create a more muted and subtle color palette' },
    { label: 'Högt Kontrast', prompt: 'Increase contrast, deeper blacks and brighter highlights' },
    { label: 'Mjukt Kontrast', prompt: 'Decrease contrast, softer and more even tones throughout' },
  ];

  return (
    <div className="space-y-4">
      {/* Image Type Selector for dual images */}
      {workingImages && (
        <div className="flex gap-2 justify-center mb-4">
          <Button
            onClick={() => setActiveImageType('fullBody')}
            variant={activeImageType === 'fullBody' ? 'default' : 'outline'}
            className={cn(
              "rounded-full",
              activeImageType === 'fullBody' ? "bg-[#392599] hover:bg-[#4a2fb3] text-white" : "border-black/10 text-black dark:border-white/10 dark:text-white"
            )}
          >
            Redigera Helbild
          </Button>
          <Button
            onClick={() => setActiveImageType('framed')}
            variant={activeImageType === 'framed' ? 'default' : 'outline'}
            className={cn(
              "rounded-full",
              activeImageType === 'framed' ? "bg-[#392599] hover:bg-[#4a2fb3] text-white" : "border-black/10 text-black dark:border-white/10 dark:text-white"
            )}
          >
            Redigera Närbild
          </Button>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="space-y-2">
        <Button
          onClick={() => setShowAdvanced(!showAdvanced)}
          disabled={processing || saving}
          size="sm"
          className="w-full bg-[#392599] hover:bg-[#4a2fb3] text-white rounded-full"
        >
          {showAdvanced ? (
            <X className="h-3 w-3 mr-1" />
          ) : (
            <Edit3 className="h-3 w-3 mr-1" />
          )}
          {showAdvanced ? 'Stäng redigering' : 'Redigera bild'}
        </Button>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleSave}
            disabled={saving || processing}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white rounded-full"
          >
            {saving ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Save className="h-3 w-3 mr-1" />
            )}
            Spara
          </Button>

          <Button
            onClick={handleRegenerate}
            disabled={processing || saving}
            size="sm"
            variant="outline"
            className="border-black/10 text-black dark:text-white dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
          >
            {processing ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            Regenerera
          </Button>
        </div>
      </div>

      {/* Advanced Editing Panel */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 overflow-hidden">
              <Tabs defaultValue="versions" className="w-full">
                <TabsList className="w-full grid grid-cols-4 bg-[#f5f5f7] dark:bg-white/5 border-b border-black/10 dark:border-white/10 rounded-none h-12">
                  <TabsTrigger value="versions" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 gap-2">
                    <Lightbulb className="h-4 w-4" />
                    <span className="hidden sm:inline">Versioner</span>
                  </TabsTrigger>
                  <TabsTrigger value="background" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 gap-2">
                    <ImageIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Bakgrund</span>
                  </TabsTrigger>
                  <TabsTrigger value="pose" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Pose</span>
                  </TabsTrigger>
                  <TabsTrigger value="face" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Ansikte</span>
                  </TabsTrigger>
                </TabsList>

                <div className="p-4">
                  <TabsContent value="versions" className="mt-0 space-y-3">
                    <p className="text-sm text-black/60 dark:text-white/60 mb-3">Tidigare versioner:</p>
                    <div className="flex flex-wrap gap-2">
                      {originalGeneratedImageId && (
                        <div 
                          className={cn(
                            "w-20 h-20 rounded-md overflow-hidden border-2 cursor-pointer",
                            activeVersionId === originalGeneratedImageId ? "border-[#392599]" : "border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
                          )}
                          onClick={() => handleVersionSelect({ id: originalGeneratedImageId, image_url: currentImage, notes: 'Original' })}
                        >
                          <SignedImage src={currentImage} alt="Original" className="w-full h-full object-cover" />
                        </div>
                      )}
                      {savedVersions.map((version) => (
                        <div
                          key={version.id}
                          className={cn(
                            "w-20 h-20 rounded-md overflow-hidden border-2 cursor-pointer",
                            activeVersionId === version.id ? "border-[#392599]" : "border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
                          )}
                          onClick={() => handleVersionSelect(version)}
                        >
                          <SignedImage src={version.image_url} alt={version.notes} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="background" className="mt-0 space-y-3">
                    <p className="text-sm text-black/60 dark:text-white/60 mb-3">Välj en ny bakgrund</p>
                    <div className="grid grid-cols-2 gap-2">
                      {backgroundOptions.map((option) => (
                        <Button
                          key={option.label}
                          onClick={() => handleQuickEdit(option.prompt, option.label)}
                          disabled={processing}
                          variant="outline"
                          className="border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-[#392599]/10 hover:border-[#392599] justify-start h-auto py-3"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="pose" className="mt-0 space-y-3">
                    <p className="text-sm text-black/60 dark:text-white/60 mb-3">Ändra pose eller vinkel</p>
                    <div className="grid grid-cols-2 gap-2">
                      {poseOptions.map((option) => (
                        <Button
                          key={option.label}
                          onClick={() => handleQuickEdit(option.prompt, option.label, true)}
                          disabled={processing}
                          variant="outline"
                          className="border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-[#392599]/10 hover:border-[#392599] justify-start h-auto py-3"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="face" className="mt-0 space-y-3">
                    <p className="text-sm text-black/60 dark:text-white/60 mb-3">Byt modellens ansikte</p>
                    
                    {/* Predefined face options */}
                    <div className="grid grid-cols-2 gap-2">
                      {faceOptions.map((option) => (
                        <Button
                          key={option.label}
                          onClick={() => handleFaceChange(option.prompt, option.label)}
                          disabled={processing}
                          variant="outline"
                          className="border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-[#392599]/10 hover:border-[#392599] justify-start h-auto py-3"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>

                    {/* Custom models */}
                    {customModels.length > 0 && (
                      <>
                        <p className="text-sm text-black/60 dark:text-white/60 mt-4 mb-3">Dina egna modeller</p>
                        <div className="grid grid-cols-2 gap-2">
                          {customModels.map((model) => (
                            <Button
                              key={model.id}
                              onClick={() => handleFaceChange(model.prompt || `A ${model.age} year old ${model.gender} model with ${model.ethnicity} ethnicity, ${model.hair_color} ${model.hair_style} hair, ${model.body_type} body type`, model.name)}
                              disabled={processing}
                              variant="outline"
                              className="border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-[#392599]/10 hover:border-[#392599] justify-start h-auto py-3 flex items-center gap-2"
                            >
                              {(model.portrait_url || model.image_url) && (
                                <img 
                                  src={model.portrait_url || model.image_url} 
                                  alt={model.name}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              )}
                              <span className="truncate">{model.name}</span>
                            </Button>
                          ))}
                        </div>
                      </>
                    )}
                  </TabsContent>

                  {/* Custom Edit Section */}
                  <div className="pt-4 border-t border-black/10 dark:border-white/10 mt-4">
                    <Label className="text-black/80 dark:text-white/80 text-sm mb-2">Egen redigering</Label>
                    <Textarea
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder="Beskriv din egen redigering..."
                      className="bg-[#f5f5f7] dark:bg-white/5 border-black/10 dark:border-white/10 text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus:border-[#392599] min-h-[60px] mt-2"
                      disabled={processing}
                    />
                    <Button
                      onClick={handleEdit}
                      disabled={!editPrompt.trim() || processing}
                      className="w-full mt-3 bg-[#392599] hover:bg-[#4a2fb3] text-white font-medium rounded-full"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Genererar...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Applicera
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Tabs>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}