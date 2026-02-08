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
  Lightbulb,
  Sparkles
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

  const { data: allGarments = [] } = useQuery({
    queryKey: ['all-garments-refinement'],
    queryFn: () => base44.entities.Garment.list('-created_date'),
    initialData: [],
  });

  const { data: brandSeeds = [] } = useQuery({
    queryKey: ['brand-seeds-refinement'],
    queryFn: () => base44.entities.BrandSeed.list('-created_date'),
    initialData: [],
  });

  const [styleConsistencyResult, setStyleConsistencyResult] = useState(null);
  const [checkingConsistency, setCheckingConsistency] = useState(false);

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

  const handleUpscale = async (resolution = '4k') => {
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
      const resolutionLabel = resolution === '4k' ? '4K (3840x2160)' : '2K (2560x1440)';
      const upscalePrompt = `Upscale this image to ${resolutionLabel} ultra high resolution. Enhanced details, professional photography sharpness, crisp focus. Maintain exact same composition, colors, and content. 4:5 aspect ratio, portrait orientation. No text, no watermarks, no labels in the image.`;
      const result = await onGenerateImage(upscalePrompt, [workingImageUrl]);
      if (result?.image_url) {
        const newUrl = result.image_url;
        setWorkingImageUrl(newUrl);
        onImageUpdated(newUrl);
        await createSavedImageVersion(newUrl, upscalePrompt, `Uppskalad ${resolution.toUpperCase()}`);
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

  const handleVirtualTryOn = async (garmentId, label) => {
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
      const garment = allGarments.find(g => g.id === garmentId);
      if (!garment) return;

      const tryOnPrompt = `Add the garment from the new reference image to the model. The model should now be wearing both the original garment AND the new garment from the additional reference. Keep the exact same model, same background, same lighting. Only add the new garment to the outfit. Professional fashion photography. 4:5 aspect ratio, portrait orientation.`;
      const imageRefs = [workingImageUrl, garment.image_url].filter(url => url && typeof url === 'string');

      const result = await onGenerateImage(tryOnPrompt, imageRefs);
      if (result?.image_url) {
        const newUrl = result.image_url;
        setWorkingImageUrl(newUrl);
        onImageUpdated(newUrl);
        await createSavedImageVersion(newUrl, tryOnPrompt, label);
      }
    } catch (error) {
      console.error('Virtual try-on failed:', error);
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

  const handleBackgroundVariation = async (variationType, label) => {
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
      let bgPrompt = '';
      if (variationType === 'blur') {
        bgPrompt = 'Apply a strong blur effect to the background while keeping the model and garment in sharp focus. Professional portrait photography with shallow depth of field. 4:5 aspect ratio.';
      } else if (variationType === 'enhance') {
        bgPrompt = 'Enhance and improve the background - make it more appealing while keeping the same general setting. Better composition, better lighting, more professional look. 4:5 aspect ratio.';
      } else if (variationType === 'minimal') {
        bgPrompt = 'Transform the background to a clean, minimalist setting. Simple, uncluttered, professional. Keep same lighting quality. 4:5 aspect ratio.';
      }

      const result = await onGenerateImage(bgPrompt, [workingImageUrl]);
      if (result?.image_url) {
        const newUrl = result.image_url;
        setWorkingImageUrl(newUrl);
        onImageUpdated(newUrl);
        await createSavedImageVersion(newUrl, bgPrompt, label);
      }
    } catch (error) {
      console.error('Background variation failed:', error);
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

  const checkStyleConsistency = async () => {
    if (brandSeeds.length === 0) return;

    setCheckingConsistency(true);
    try {
      const seed = brandSeeds[0];
      const analysisPrompt = `Analyze this generated fashion image against the following brand guidelines:

Brand: ${seed.name}
Style: ${seed.brand_style}
Character: ${seed.character}
Environment: ${seed.environment}
Color Palette: ${seed.color_palette}
Photography Style: ${seed.photography_style}

Evaluate the image on:
1. Color consistency with brand palette
2. Style alignment with brand character
3. Overall brand fit

Provide specific issues and suggestions for improvement.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        file_urls: [workingImageUrl],
        response_json_schema: {
          type: 'object',
          properties: {
            overall_score: { type: 'number', description: 'Score from 1-10' },
            color_consistency: { type: 'boolean' },
            style_consistency: { type: 'boolean' },
            brand_alignment: { type: 'boolean' },
            summary: { type: 'string' },
            issues: { type: 'array', items: { type: 'string' } },
            suggestions: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      setStyleConsistencyResult(result);
    } catch (error) {
      console.error('Style consistency check failed:', error);
      setStyleConsistencyResult({ error: 'Kunde inte analysera. Försök igen.' });
    } finally {
      setCheckingConsistency(false);
    }
  };

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
                <TabsList className="w-full grid grid-cols-9 bg-[#f5f5f7] dark:bg-white/5 border-b border-black/10 dark:border-white/10 rounded-none h-12 text-xs">
                  <TabsTrigger value="versions" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 gap-1 px-2">
                    <Lightbulb className="h-4 w-4" />
                    <span className="hidden sm:inline">Versioner</span>
                  </TabsTrigger>
                  <TabsTrigger value="upscale" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 gap-1 px-2">
                    <Maximize2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Upscale</span>
                  </TabsTrigger>
                  <TabsTrigger value="variation" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 gap-1 px-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:inline">AI Variation</span>
                  </TabsTrigger>
                  <TabsTrigger value="background" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 gap-1 px-2">
                    <ImageIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Bakgrund</span>
                  </TabsTrigger>
                  <TabsTrigger value="pose" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 gap-1 px-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Pose</span>
                  </TabsTrigger>
                  <TabsTrigger value="face" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 gap-1 px-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Ansikte</span>
                  </TabsTrigger>
                  <TabsTrigger value="tryon" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 gap-1 px-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:inline">Try-On</span>
                  </TabsTrigger>
                  <TabsTrigger value="bg-ai" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 gap-1 px-2">
                    <Palette className="h-4 w-4" />
                    <span className="hidden sm:inline">BG AI</span>
                  </TabsTrigger>
                  <TabsTrigger value="consistency" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 gap-1 px-2">
                    <Check className="h-4 w-4" />
                    <span className="hidden sm:inline">Check</span>
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

                  <TabsContent value="upscale" className="mt-0 space-y-3">
                    <p className="text-sm text-black/60 dark:text-white/60 mb-3">Förbättra bildkvaliteten</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => handleUpscale('2k')}
                        disabled={processing}
                        className="bg-[#392599] hover:bg-[#4a2fb3] text-white h-auto py-4 flex flex-col gap-2"
                      >
                        <Maximize2 className="h-6 w-6" />
                        <div>
                          <div className="font-semibold">2K Upscale</div>
                          <div className="text-xs opacity-80">2560x1440px</div>
                        </div>
                      </Button>
                      <Button
                        onClick={() => handleUpscale('4k')}
                        disabled={processing}
                        className="bg-[#392599] hover:bg-[#4a2fb3] text-white h-auto py-4 flex flex-col gap-2"
                      >
                        <Maximize2 className="h-6 w-6" />
                        <div>
                          <div className="font-semibold">4K Upscale</div>
                          <div className="text-xs opacity-80">3840x2160px</div>
                        </div>
                      </Button>
                    </div>
                    <p className="text-xs text-black/40 dark:text-white/40 mt-2">
                      Förbättrar detaljer och skärpa för högupplösta utskrifter och visningar
                    </p>
                  </TabsContent>

                  <TabsContent value="variation" className="mt-0 space-y-3">
                    <p className="text-sm text-black/60 dark:text-white/60 mb-3">AI-drivna variationer</p>

                    {/* Expression & Pose Variations */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-black dark:text-white">Uttryck & Poser</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => handleQuickEdit('Generate same model with different natural facial expression - could be smiling, neutral, or subtle emotion. Keep everything else identical', 'Variera uttryck', true)}
                          disabled={processing}
                          variant="outline"
                          className="border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-[#392599]/10 hover:border-[#392599] justify-start h-auto py-3"
                        >
                          Variera uttryck
                        </Button>
                        <Button
                          onClick={() => handleQuickEdit('Generate 3 different natural poses with the same model - standing, sitting, dynamic. Keep model and garment identical', 'Variera pose', true)}
                          disabled={processing}
                          variant="outline"
                          className="border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-[#392599]/10 hover:border-[#392599] justify-start h-auto py-3"
                        >
                          3 olika poser
                        </Button>
                      </div>
                    </div>

                    {/* Similar Face, Different Demographics */}
                    <div className="space-y-2 mt-4">
                      <p className="text-xs font-medium text-black dark:text-white">Demografiska variationer</p>
                      <p className="text-xs text-black/50 dark:text-white/50 mb-2">Behåll liknande ansiktsdrag men variera kön/etnicitet</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => handleFaceChange('A male model with similar facial structure, age, and overall look as the reference, but masculine features. Keep the same friendly and professional expression', 'Samma drag, man')}
                          disabled={processing}
                          variant="outline"
                          className="border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-[#392599]/10 hover:border-[#392599] justify-start h-auto py-3"
                        >
                          Manlig version
                        </Button>
                        <Button
                          onClick={() => handleFaceChange('A female model with similar facial structure, age, and overall look as the reference, but feminine features. Keep the same friendly and professional expression', 'Samma drag, kvinna')}
                          disabled={processing}
                          variant="outline"
                          className="border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-[#392599]/10 hover:border-[#392599] justify-start h-auto py-3"
                        >
                          Kvinnlig version
                        </Button>
                        <Button
                          onClick={() => handleFaceChange('An Asian model with similar facial structure, age, and overall look as the reference. Keep the same friendly and professional expression', 'Asiatisk variant')}
                          disabled={processing}
                          variant="outline"
                          className="border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-[#392599]/10 hover:border-[#392599] justify-start h-auto py-3"
                        >
                          Asiatisk
                        </Button>
                        <Button
                          onClick={() => handleFaceChange('An African model with similar facial structure, age, and overall look as the reference. Keep the same friendly and professional expression', 'Afrikansk variant')}
                          disabled={processing}
                          variant="outline"
                          className="border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-[#392599]/10 hover:border-[#392599] justify-start h-auto py-3"
                        >
                          Afrikansk
                        </Button>
                        <Button
                          onClick={() => handleFaceChange('A Hispanic/Latino model with similar facial structure, age, and overall look as the reference. Keep the same friendly and professional expression', 'Latinamerikansk variant')}
                          disabled={processing}
                          variant="outline"
                          className="border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-[#392599]/10 hover:border-[#392599] justify-start h-auto py-3"
                        >
                          Latinamerikansk
                        </Button>
                        <Button
                          onClick={() => handleFaceChange('A Middle Eastern model with similar facial structure, age, and overall look as the reference. Keep the same friendly and professional expression', 'Mellanöstern variant')}
                          disabled={processing}
                          variant="outline"
                          className="border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-[#392599]/10 hover:border-[#392599] justify-start h-auto py-3"
                        >
                          Mellanöstern
                        </Button>
                      </div>
                    </div>

                    {/* Multi-Garment AI Styling */}
                    <div className="space-y-2 mt-4">
                      <p className="text-xs font-medium text-black dark:text-white">AI Multi-garment Styling</p>
                      <p className="text-xs text-black/50 dark:text-white/50 mb-2">AI väljer kompletterande plagg automatiskt</p>
                      <Button
                        onClick={async () => {
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
                            const analysis = await base44.integrations.Core.InvokeLLM({
                              prompt: 'Analyze this garment and suggest 2-3 complementary garment types that would complete a stylish outfit (e.g., if showing a jacket, suggest shirt and pants). Return garment categories only.',
                              file_urls: Array.isArray(garmentImageUrl) ? garmentImageUrl : [garmentImageUrl],
                              response_json_schema: {
                                type: 'object',
                                properties: {
                                  suggested_categories: { type: 'array', items: { type: 'string' }, description: 'List of garment categories like tops, bottoms, dresses, outerwear, accessories' }
                                }
                              }
                            });

                            const matchingGarments = allGarments.filter(g =>
                              analysis.suggested_categories.some(cat =>
                                g.category && g.category.toLowerCase().includes(cat.toLowerCase())
                              )
                            ).slice(0, 2);

                            if (matchingGarments.length > 0) {
                              const allGarmentUrls = [
                                ...(Array.isArray(garmentImageUrl) ? garmentImageUrl : [garmentImageUrl]),
                                ...matchingGarments.map(g => g.image_url)
                              ];

                              const stylePrompt = `Create a complete styled outfit with the model wearing ALL these garments together. Professional fashion photography showing a cohesive, well-styled look. 4:5 aspect ratio. Keep the same model features.`;
                              const result = await onGenerateImage(stylePrompt, allGarmentUrls);

                              if (result?.image_url) {
                                setWorkingImageUrl(result.image_url);
                                onImageUpdated(result.image_url);
                                await createSavedImageVersion(result.image_url, stylePrompt, 'AI Multi-garment');
                              }
                            }
                          } catch (error) {
                            console.error('AI styling failed:', error);
                          } finally {
                            clearInterval(progressInterval);
                            setGenerationProgress(100);
                            onProcessingChange?.(true, 100);
                            setTimeout(() => {
                              setProcessing(false);
                              onProcessingChange?.(false, 0);
                            }, 300);
                          }
                        }}
                        disabled={processing || allGarments.length < 2}
                        className="w-full bg-[#392599] hover:bg-[#4a2fb3] text-white"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI väljer kompletterande plagg
                      </Button>
                      {allGarments.length < 2 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">Ladda upp fler plagg för AI-styling</p>
                      )}
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
                                <SignedImage
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

                  <TabsContent value="tryon" className="mt-0 space-y-3">
                    <p className="text-sm text-black/60 dark:text-white/60 mb-3">Lägg till accessoarer eller andra plagg virtuellt</p>

                    <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                      {allGarments.map((garment) => (
                        <Button
                          key={garment.id}
                          onClick={() => handleVirtualTryOn(garment.id, `Try-on: ${garment.name}`)}
                          disabled={processing}
                          variant="outline"
                          className="border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-[#392599]/10 hover:border-[#392599] justify-start h-auto py-3 flex items-center gap-2"
                        >
                          {garment.image_url && (
                            <SignedImage
                              src={garment.image_url}
                              alt={garment.name}
                              className="w-8 h-8 rounded object-cover flex-shrink-0"
                            />
                          )}
                          <span className="truncate text-left flex-1">{garment.name}</span>
                        </Button>
                      ))}
                    </div>

                    {allGarments.length === 0 && (
                      <div className="text-center py-8 text-black/40 dark:text-white/40">
                        Inga plagg tillgängliga. Ladda upp plagg först.
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="bg-ai" className="mt-0 space-y-3">
                    <p className="text-sm text-black/60 dark:text-white/60 mb-3">AI-driven bakgrundsförbättring</p>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => handleBackgroundVariation('blur', 'Bakgrund: Blur')}
                        disabled={processing}
                        variant="outline"
                        className="border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-[#392599]/10 hover:border-[#392599] justify-start h-auto py-3"
                      >
                        Blur Bakgrund
                      </Button>
                      <Button
                        onClick={() => handleBackgroundVariation('enhance', 'Bakgrund: Förbättrad')}
                        disabled={processing}
                        variant="outline"
                        className="border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-[#392599]/10 hover:border-[#392599] justify-start h-auto py-3"
                      >
                        Förbättra Bakgrund
                      </Button>
                      <Button
                        onClick={() => handleBackgroundVariation('minimal', 'Bakgrund: Minimal')}
                        disabled={processing}
                        variant="outline"
                        className="border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-[#392599]/10 hover:border-[#392599] justify-start h-auto py-3"
                      >
                        Minimalistisk
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="consistency" className="mt-0 space-y-3">
                    <p className="text-sm text-black/60 dark:text-white/60 mb-3">Kontrollera mot varumärkesriktlinjer</p>

                    {!styleConsistencyResult && !checkingConsistency && (
                      <Button
                        onClick={checkStyleConsistency}
                        disabled={brandSeeds.length === 0}
                        className="w-full bg-[#392599] hover:bg-[#4a2fb3] text-white"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Kontrollera Stilkonsistens
                      </Button>
                    )}

                    {checkingConsistency && (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-[#392599]" />
                        <p className="text-sm text-black/60 dark:text-white/60">Analyserar mot brand seed...</p>
                      </div>
                    )}

                    {styleConsistencyResult && !styleConsistencyResult.error && (
                      <div className="space-y-3">
                        <div className={cn(
                          "p-4 rounded-lg border",
                          styleConsistencyResult.overall_score >= 7 ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/30" : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/30"
                        )}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-black dark:text-white">Poäng</span>
                            <span className="text-2xl font-bold text-black dark:text-white">{styleConsistencyResult.overall_score}/10</span>
                          </div>
                          <p className="text-xs text-black/60 dark:text-white/60">{styleConsistencyResult.summary}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className={cn("p-2 rounded", styleConsistencyResult.color_consistency ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30")}>
                            <p className="font-medium text-black dark:text-white">Färg</p>
                            <p className={styleConsistencyResult.color_consistency ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
                              {styleConsistencyResult.color_consistency ? "OK" : "Ej OK"}
                            </p>
                          </div>
                          <div className={cn("p-2 rounded", styleConsistencyResult.style_consistency ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30")}>
                            <p className="font-medium text-black dark:text-white">Stil</p>
                            <p className={styleConsistencyResult.style_consistency ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
                              {styleConsistencyResult.style_consistency ? "OK" : "Ej OK"}
                            </p>
                          </div>
                          <div className={cn("p-2 rounded", styleConsistencyResult.brand_alignment ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30")}>
                            <p className="font-medium text-black dark:text-white">Varumärke</p>
                            <p className={styleConsistencyResult.brand_alignment ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
                              {styleConsistencyResult.brand_alignment ? "OK" : "Ej OK"}
                            </p>
                          </div>
                        </div>

                        {styleConsistencyResult.issues && styleConsistencyResult.issues.length > 0 && (
                          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <p className="text-xs font-medium text-red-800 dark:text-red-200 mb-2">Problem:</p>
                            <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                              {styleConsistencyResult.issues.map((issue, idx) => (
                                <li key={idx}>- {issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {styleConsistencyResult.suggestions && styleConsistencyResult.suggestions.length > 0 && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-2">Förslag:</p>
                            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                              {styleConsistencyResult.suggestions.map((suggestion, idx) => (
                                <li key={idx}>- {suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <Button
                          onClick={() => setStyleConsistencyResult(null)}
                          variant="outline"
                          size="sm"
                          className="w-full border-black/10 dark:border-white/10"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Kör om analys
                        </Button>
                      </div>
                    )}

                    {styleConsistencyResult?.error && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-lg">
                        <p className="text-sm text-amber-800 dark:text-amber-200">{styleConsistencyResult.error}</p>
                      </div>
                    )}

                    {brandSeeds.length === 0 && !styleConsistencyResult && (
                      <div className="text-center py-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          Skapa en brand seed först för att kontrollera stilkonsistens
                        </p>
                      </div>
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
