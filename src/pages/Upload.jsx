import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Download,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Check,
  Shirt,
  Save,
  X,
  AlertCircle,
  Info
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { SignedImage } from "@/components/ui/SignedImage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import FileDropzone from '../components/upload/FileDropzone';
import GenerationProgress from '../components/generation/GenerationProgress';
import ImageRefinementPanel from '../components/generation/ImageRefinementPanel';

const STUDIO_PROMPT = 'Professional studio photography with consistent soft diffused lighting from key light at 45 degrees, fill light opposite side, and subtle rim light. Clean white seamless background, color temperature 5500K, high-key lighting setup maintaining exact same brightness and shadow falloff across all images. Model positioned center frame with even illumination.';

const AccordionSection = ({ id, title, isComplete, children, openSection, setOpenSection, thumbnail }) => (
  <div className={cn(
    "border rounded-2xl overflow-hidden transition-all",
    openSection === id ? "border-black/20 bg-white dark:border-white/20 dark:bg-white/5" : "border-black/10 bg-[#f5f5f7] dark:border-white/10 dark:bg-white/5"
  )}>
    <button
      onClick={() => setOpenSection(openSection === id ? null : id)}
      className="w-full p-6 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
    >
      <div className="flex items-center gap-3">
        {isComplete && <Check className="h-5 w-5 text-green-600" />}
        <h3 className="text-lg font-semibold text-black dark:text-white">{title}</h3>
        {thumbnail && (
          <div className="h-10 w-10 rounded-lg overflow-hidden bg-white dark:bg-white/5 flex-shrink-0 border border-black/10 dark:border-white/10">
            {thumbnail}
          </div>
        )}
      </div>
      {openSection === id ? <ChevronUp className="h-5 w-5 text-black dark:text-white" /> : <ChevronDown className="h-5 w-5 text-black dark:text-white" />}
    </button>
    
    <AnimatePresence>
      {openSection === id && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          exit={{ height: 0 }}
          className="overflow-hidden"
        >
          <div className="p-6 pt-0 border-t border-black/5 dark:border-white/10">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default function Upload() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, navigateToLogin } = useAuth();

  const [mode, setMode] = useState('enkel'); // 'enkel', 'batch', 'style' or 'expert'
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [loadingGarment, setLoadingGarment] = useState(false);
  const [selectedGarmentId, setSelectedGarmentId] = useState(null);
  
  const [garmentData, setGarmentData] = useState({
    name: '',
    category: '',
    brand: '',
    sku: ''
  });
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedSeed, setSelectedSeed] = useState(null);
  const [useSeedEnvironment, setUseSeedEnvironment] = useState(true);
  const [selectedEnvironment, setSelectedEnvironment] = useState('studio');
  const [customEnvironment, setCustomEnvironment] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  
  const [openSection, setOpenSection] = useState('upload');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generatedImages, setGeneratedImages] = useState(null); // { framed, fullBody }
  const [currentGeneratedImageId, setCurrentGeneratedImageId] = useState(null); // Store the ID of the GeneratedImage entity
  const [lastPrompt, setLastPrompt] = useState('');
  const [selectedGarments, setSelectedGarments] = useState([]);
  const [batchGarments, setBatchGarments] = useState([]);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [savedAnalysis, setSavedAnalysis] = useState(null);

  // Load garment or template from URL parameter
  React.useEffect(() => {
    const loadGarmentFromUrl = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const garmentId = urlParams.get('garment');
      const templateId = urlParams.get('template');
      
      // Load template if provided
      if (templateId) {
        try {
          const templates = await base44.entities.Template.filter({ id: templateId });
          if (templates.length > 0) {
            const template = templates[0];
            const config = template.configuration;
            
            // Load model
            if (config.model_id) {
              const models = await base44.entities.Model.filter({ id: config.model_id });
              if (models.length > 0) setSelectedModel(models[0]);
            } else if (config.gender) {
              setSelectedGender(config.gender);
            }
            
            // Load seed
            if (config.brand_seed_id) {
              const seeds = await base44.entities.BrandSeed.filter({ id: config.brand_seed_id });
              if (seeds.length > 0) setSelectedSeed(seeds[0]);
            }
            
            // Load environment and other settings
            setSelectedEnvironment(config.environment || 'studio');
            setCustomEnvironment(config.custom_environment || '');
            setUseSeedEnvironment(config.use_seed_environment ?? true);
            setCustomPrompt(config.custom_prompt || '');
            
            // Update template usage
            await base44.entities.Template.update(templateId, {
              usage_count: (template.usage_count || 0) + 1,
              last_used: new Date().toISOString()
            });
            
            setOpenSection('upload');
          }
        } catch (error) {
          console.error('Failed to load template:', error);
        }
        return;
      }
      
      if (garmentId) {
        setLoadingGarment(true);
        try {
          const garments = await base44.entities.Garment.filter({ id: garmentId });
          if (garments.length > 0) {
            const garment = garments[0];
            setGarmentData({
              name: garment.name || '',
              category: garment.category || '',
              brand: garment.brand || '',
              sku: garment.sku || ''
            });
            setUploadedUrl(garment.image_url);
            setPreview(garment.image_url);
            
            // Analyze garment with AI if no category
            if (!garment.category && garment.image_url) {
              const analysis = await base44.integrations.Core.InvokeLLM({
                prompt: 'Analysera detta plagg och beskriv vad det är. Ge kort svar med typ (överdel/underdel/klänning/ytterplagg/accessoar) och kort beskrivning.',
                file_urls: [garment.image_url],
                response_json_schema: {
                  type: 'object',
                  properties: {
                    category: { type: 'string', enum: ['tops', 'bottoms', 'dresses', 'outerwear', 'accessories'] },
                    description: { type: 'string' }
                  }
                }
              });
              
              if (analysis.category) {
                setGarmentData(prev => ({ ...prev, category: analysis.category }));
              }
            }
            }
            } catch (error) {
          console.error('Failed to load garment:', error);
        } finally {
          setLoadingGarment(false);
        }
      }
    };
    
    loadGarmentFromUrl();
  }, []);

  const { data: models = [] } = useQuery({
    queryKey: ['models'],
    queryFn: () => base44.entities.Model.list()
  });

  // Auto-select first model on load
  React.useEffect(() => {
    if (models.length > 0 && !selectedModel && !selectedGender) {
      setSelectedModel(models[0]);
    }
  }, [models]);

  const { data: seeds = [] } = useQuery({
    queryKey: ['brand-seeds'],
    queryFn: () => base44.entities.BrandSeed.list('-created_date')
  });

  // Auto-select first seed on load
  React.useEffect(() => {
    if (seeds.length > 0 && !selectedSeed) {
      setSelectedSeed(seeds[0]);
    }
  }, [seeds]);

  const { data: allGarments = [] } = useQuery({
    queryKey: ['all-garments'],
    queryFn: () => base44.entities.Garment.list('-created_date')
  });

  const createGarmentMutation = useMutation({
    mutationFn: (data) => base44.entities.Garment.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['garments'] })
  });

  const createGeneratedImageMutation = useMutation({
    mutationFn: (data) => base44.entities.GeneratedImage.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['generated-images'] })
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.Template.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowSaveTemplate(false);
    }
  });

  const analyzeGarment = async (imageUrl) => {
    setAnalyzing(true);
    setAiSuggestions(null);
    try {
      // Check if image is webp format - convert to PNG if needed
      let processedUrl = imageUrl;
      if (imageUrl.toLowerCase().includes('.webp')) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        // Convert to PNG using canvas
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl;
        });
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const pngFile = new File([pngBlob], 'garment.png', { type: 'image/png' });
        
        const { file_url } = await base44.integrations.Core.UploadFile({ file: pngFile });
        processedUrl = file_url;
      }
      
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: 'Analysera detta plagg och ge detaljerad information. Beskriv vad det är för typ av plagg, föreslå en passande kategori, och ge en kort produktbeskrivning (max 2 meningar).',
        file_urls: [processedUrl],
        response_json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Kort produktnamn, t.ex. "Svart Blazer" eller "Blå Jeans"' },
            category: { type: 'string', enum: ['tops', 'bottoms', 'dresses', 'outerwear', 'accessories'] },
            description: { type: 'string', description: 'Kort beskrivning av plagget (max 2 meningar)' },
            style: { type: 'string', description: 'Stil på plagget, t.ex. casual, formal, sporty' }
          },
          required: ['name', 'category']
        }
      });
      
      if (analysis && analysis.name && analysis.category) {
        setAiSuggestions(analysis);
        setGarmentData(prev => ({
          ...prev,
          name: analysis.name || prev.name,
          category: analysis.category || prev.category
        }));
      } else {
        console.error('Ogiltig analys:', analysis);
        setAiSuggestions({ error: 'AI kunde inte identifiera plagget. Fyll i manuellt.' });
      }
    } catch (error) {
      console.error('AI analys misslyckades:', error);
      setAiSuggestions({ error: 'Kunde inte analysera bilden. Försök igen.' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileSelect = async (selectedFile) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
    
    // Reset AI suggestions and selected garment for new upload
    setAiSuggestions(null);
    setSelectedGarmentId(null);
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      setUploadedUrl(file_url);
      setOpenSection('details');
      
      // Analyze garment automatically
      await analyzeGarment(file_url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleBatchGenerate = async () => {
    // Require authentication for image generation
    if (!isAuthenticated) {
      navigateToLogin();
      return;
    }

    if (batchGarments.length === 0) return;

    setBatchGenerating(true);
    setBatchProgress({ current: 0, total: batchGarments.length });
    window.scrollTo({ top: 0, behavior: 'smooth' });

    for (let i = 0; i < batchGarments.length; i++) {
      const garment = batchGarments[i];
      setBatchProgress({ current: i + 1, total: batchGarments.length });

      try {
        let modelPrompt = 'professional fashion model';
        if (selectedModel) {
          modelPrompt = selectedModel.prompt;
        } else if (selectedGender) {
          modelPrompt = `professional ${selectedGender} fashion model`;
        }

        let seedPrompt = '';
        if (selectedSeed) {
          seedPrompt = `Style: ${selectedSeed.brand_style}. Character: ${selectedSeed.character}. Photography: ${selectedSeed.photography_style || 'professional e-commerce'}. Color palette: ${selectedSeed.color_palette || 'consistent with brand'}. `;
        }

        let envPrompt = '';
        if (selectedSeed && useSeedEnvironment && selectedSeed.environment) {
          envPrompt = getEnvironmentPrompt(selectedSeed.environment);
        } else {
          envPrompt = getEnvironmentPrompt(selectedEnvironment);
        }

        const prompt = `${modelPrompt} wearing the garment in the reference image. High-quality product photography, professional lighting. ${seedPrompt}${envPrompt}`;

        const result = await base44.integrations.Core.GenerateImage({
          prompt: `${prompt} 4:5 aspect ratio, portrait orientation.`,
          existing_image_urls: [garment.image_url]
        });

        await createGeneratedImageMutation.mutateAsync({
          garment_id: garment.id,
          model_type: selectedModel?.id || 'default',
          image_url: result.url,
          prompt_used: prompt,
          status: 'completed'
        });
      } catch (error) {
        console.error(`Failed to generate for ${garment.name}:`, error);
      }
    }

    setBatchGenerating(false);
    setBatchGarments([]);
    navigate(createPageUrl('Gallery'));
  };

  const handleGenerate = async () => {
    // Require authentication for image generation
    if (!isAuthenticated) {
      navigateToLogin();
      return;
    }

    try {
      let garment;
      let garmentId;
      let imageUrls = [];

      if (mode === 'style') {
        // Style mode: use selected garments
        if (selectedGarments.length < 2) {
          throw new Error('Välj minst 2 plagg för Style-läge');
        }
        imageUrls = selectedGarments.map(g => g.image_url);
        // Use first garment for the database record
        garmentId = selectedGarments[0].id;
      } else {
        // Regular modes: use existing garment or create new
        if (!uploadedUrl) {
          throw new Error('Ingen bild uppladdad');
        }

        if (selectedGarmentId) {
          // Use existing garment
          garmentId = selectedGarmentId;
        } else {
          // Check if garment already exists with this image URL
          const existingGarments = await base44.entities.Garment.filter({ 
            image_url: uploadedUrl 
          });
          
          if (existingGarments.length > 0) {
            // Use existing garment
            garmentId = existingGarments[0].id;
            setSelectedGarmentId(garmentId);
          } else {
            // Create new garment only if it doesn't exist
            if (!garmentData.name) {
              throw new Error('Plaggnamn måste anges');
            }
            garment = await createGarmentMutation.mutateAsync({
              ...garmentData,
              image_url: uploadedUrl
            });
            garmentId = garment.id;
            setSelectedGarmentId(garmentId);
          }
        }

        // Add model image FIRST for highest priority reference (enkel/batch mode)
        if (selectedModel) {
          if (selectedModel.portrait_url || selectedModel.image_url) {
            imageUrls = [selectedModel.portrait_url || selectedModel.image_url];
          }
        }
        imageUrls.push(uploadedUrl);
      }

      // Determine outfit completion instruction based on garment category
      let outfitInstruction = '';
      let modelInstruction = '';
      
      if (mode !== 'style') {
        const category = garmentData.category;
        // Determine appropriate bottoms based on selected model gender
        const modelGender = selectedModel?.gender || selectedGender;
        const bottomsOptions = modelGender === 'male' ? 'jeans or trousers' : modelGender === 'female' ? 'jeans, trousers, or skirt' : 'jeans or trousers';
        
        if (category === 'tops' || category === 'outerwear') {
          outfitInstruction = ` wearing the garment in the reference image on top, paired with stylish complementary bottoms (${bottomsOptions}) that match the style and brand aesthetic. CRITICAL: FULL BODY SHOT showing the ENTIRE model from HEAD to TOES. Show complete body including head, torso, arms, legs, and feet. DO NOT crop at waist, knees, or ankles. The entire person must be visible in frame from top of head to bottom of feet. `;
        } else if (category === 'bottoms') {
          outfitInstruction = ' wearing the garment in the reference image as bottoms, paired with a stylish complementary top that matches the style and brand aesthetic. CRITICAL: FULL BODY SHOT showing the ENTIRE model from HEAD to TOES. Show complete body including head, torso, arms, legs, and feet. DO NOT crop at waist, chest, or ankles. The entire person must be visible in frame from top of head to bottom of feet. ';
        } else if (category === 'dresses') {
          outfitInstruction = ' wearing the dress in the reference image. CRITICAL: FULL BODY SHOT showing the ENTIRE model from HEAD to TOES. Show complete body including head, torso, arms, legs, and feet. DO NOT crop at any point. The entire person must be visible in frame from top of head to bottom of feet. ';
        } else if (category === 'accessories') {
          outfitInstruction = ' wearing the accessory in the reference image, paired with a complete stylish outfit that complements it. CRITICAL: FULL BODY SHOT showing the ENTIRE model from HEAD to TOES. Show complete body including head, torso, arms, legs, and feet. DO NOT crop at any point. The entire person must be visible in frame from top of head to bottom of feet. ';
        } else {
          outfitInstruction = ' wearing the garment in the reference image, paired with complementary clothing to create a complete stylish outfit. CRITICAL: FULL BODY SHOT showing the ENTIRE model from HEAD to TOES. Show complete body including head, torso, arms, legs, and feet. DO NOT crop at any point. The entire person must be visible in frame from top of head to bottom of feet. ';
        }
        
        // Add model instruction when a specific model is selected
        if (selectedModel) {
          modelInstruction = ' CRITICAL: The model must have the EXACT SAME FACE and HAIR as shown in the first reference image - identical facial features, same eye shape and color, same nose, same mouth, same hair color, same hair style. The face and hair must match perfectly. Important: Do NOT copy any clothing from the model reference image - only use the face and hair. The garment comes from the separate garment reference. ';
        }
      }

      let prompt = '';

      if (mode === 'style') {
        let modelPrompt = 'professional fashion model';
        let modelInstruction = '';

        if (selectedModel) {
          // Add model image FIRST for highest priority reference
          if (selectedModel.portrait_url || selectedModel.image_url) {
            imageUrls.unshift(selectedModel.portrait_url || selectedModel.image_url);
          }
          // Be explicit about gender in the prompt
          const genderText = selectedModel.gender === 'female' ? 'female' : selectedModel.gender === 'male' ? 'male' : 'androgynous';
          modelPrompt = `${genderText} ${selectedModel.prompt}`;
          modelInstruction = ` ABSOLUTE CRITICAL REQUIREMENT: The model MUST be ${genderText.toUpperCase()} and look EXACTLY like the first reference image. EXACT SAME GENDER: ${genderText.toUpperCase()}. EXACT SAME FACE - identical facial features, same eye shape and color, same nose, same mouth, same jawline, same skin tone, same facial structure, same hair color, same hair style. The model in the generated image must be PERFECTLY IDENTICAL to the model in the first reference photo in EVERY way - gender, face, hair, features. DO NOT change gender, do NOT change hair color, do NOT change facial features, do NOT create a different person. CRITICAL: DO NOT copy, use, or reference ANY clothing, garments, or accessories from the model reference image. IGNORE all garments in the model reference image completely. Use ONLY the face, hair, and body of the model. The garments must come exclusively from the separate garment reference images provided.`;
        } else if (selectedGender) {
          modelPrompt = `professional ${selectedGender} fashion model`;
        }
        
        let seedPrompt = '';
        if (selectedSeed) {
          seedPrompt = `Style: ${selectedSeed.brand_style}. Character: ${selectedSeed.character}. Photography: ${selectedSeed.photography_style || 'professional e-commerce'}. Color palette: ${selectedSeed.color_palette || 'consistent with brand'}. `;
        }
        
        let envPrompt = '';
        if (selectedSeed && useSeedEnvironment && selectedSeed.environment) {
          envPrompt = getEnvironmentPrompt(selectedSeed.environment);
        } else {
          envPrompt = getEnvironmentPrompt(selectedEnvironment);
        }
        
        const garmentDescriptions = selectedGarments.map(g => g.name).join(', ');
        prompt = `${modelPrompt} wearing these garments: ${garmentDescriptions}. ${seedPrompt}${envPrompt}High-quality fashion photography, professional lighting. ABSOLUTE CRITICAL GARMENT RULE: Each garment from the reference images must be reproduced with PERFECT ACCURACY - exact same colors, exact same textures, exact same patterns, exact same details, exact same everything. DO NOT add, modify, embellish, hallucinate, or invent ANY features, decorations, patterns, stitching, logos, buttons, zippers, pockets, or ANY other details that are not clearly visible in the garment reference images. All garments must be IDENTICAL to their references with ZERO modifications or additions.`;
      } else if (mode === 'enkel' || mode === 'batch') {
        let modelPrompt = 'professional fashion model';
        let modelInstruction = '';

        if (selectedModel) {
          // Add model image FIRST for highest priority reference
          if (selectedModel.portrait_url || selectedModel.image_url) {
            imageUrls.unshift(selectedModel.portrait_url || selectedModel.image_url);
          }
          // Be explicit about gender in the prompt
          const genderText = selectedModel.gender === 'female' ? 'female' : selectedModel.gender === 'male' ? 'male' : 'androgynous';
          modelPrompt = `${genderText} ${selectedModel.prompt}`;
          modelInstruction = ` ABSOLUTE CRITICAL REQUIREMENT: The model MUST be ${genderText.toUpperCase()} and look EXACTLY like the first reference image. EXACT SAME GENDER: ${genderText.toUpperCase()}. EXACT SAME FACE - identical facial features, same eye shape and color, same nose, same mouth, same jawline, same skin tone, same facial structure, same hair color, same hair style. The model in the generated image must be PERFECTLY IDENTICAL to the model in the first reference photo in EVERY way - gender, face, hair, features. DO NOT change gender, do NOT change hair color, do NOT change facial features, do NOT create a different person. CRITICAL: DO NOT copy, use, or reference ANY clothing, garments, or accessories from the model reference image. IGNORE all garments in the model reference image completely. Use ONLY the face, hair, and body of the model. The garments must come exclusively from the separate garment reference images provided.`;
        } else if (selectedGender) {
          modelPrompt = `professional ${selectedGender} fashion model`;
        }
        
        // Add seed information if selected
        let seedPrompt = '';
        if (selectedSeed) {
          seedPrompt = `Style: ${selectedSeed.brand_style}. Character: ${selectedSeed.character}. Photography: ${selectedSeed.photography_style || 'professional e-commerce'}. Color palette: ${selectedSeed.color_palette || 'consistent with brand'}. `;
        }
        
        // Determine environment: use seed's environment if selected and useSeedEnvironment is true
        let envPrompt = '';
        if (selectedSeed && useSeedEnvironment && selectedSeed.environment) {
          envPrompt = getEnvironmentPrompt(selectedSeed.environment);
        } else {
          envPrompt = getEnvironmentPrompt(selectedEnvironment);
        }
        
        prompt = `${modelPrompt}${modelInstruction}${outfitInstruction}${seedPrompt}${envPrompt}High-quality product photography, professional lighting. ABSOLUTE CRITICAL GARMENT RULE: The garment from the reference image must be reproduced with PERFECT ACCURACY - exact same color, exact same texture, exact same patterns, exact same details, exact same everything. DO NOT add, modify, embellish, hallucinate, or invent ANY features, decorations, patterns, stitching, logos, buttons, zippers, pockets, or ANY other details that are not clearly visible in the garment reference image. The garment must be IDENTICAL to the reference with ZERO modifications or additions. If you cannot see a detail in the reference image, DO NOT add it to the generated image.`;
      } else {
        // Expert mode - respect selected model if any
        if (selectedModel && !customPrompt) {
          if (selectedModel.portrait_url || selectedModel.image_url) {
            imageUrls.unshift(selectedModel.portrait_url || selectedModel.image_url);
          }
        }
        prompt = customPrompt || `Professional fashion model wearing the garment in the reference image. High-quality product photography, professional studio lighting. ${STUDIO_PROMPT} ABSOLUTE CRITICAL GARMENT RULE: The garment from the reference image must be reproduced with PERFECT ACCURACY - exact same color, exact same texture, exact same patterns, exact same details. DO NOT add, modify, or invent ANY features not visible in the reference.`;
      }

      // Always generate a cropped version for single garment modes
      const shouldGenerateCrop = mode !== 'style';
      
      // Create placeholder records immediately
      console.log('Creating full-body image record...');
      const newImage = await createGeneratedImageMutation.mutateAsync({
        garment_id: garmentId,
        garment_urls: mode === 'style' ? selectedGarments.map(g => g.image_url) : undefined,
        model_type: selectedModel?.id || 'default',
        image_url: '',
        prompt_used: prompt,
        status: 'processing',
        ai_analysis: aiSuggestions && !aiSuggestions.error ? aiSuggestions : undefined
      });
      console.log('Full-body image record created:', newImage.id);

      let croppedImage = null;
      if (shouldGenerateCrop) {
        console.log('Creating cropped image record...');
        croppedImage = await createGeneratedImageMutation.mutateAsync({
          garment_id: garmentId,
          garment_urls: mode === 'style' ? selectedGarments.map(g => g.image_url) : undefined,
          model_type: selectedModel?.id || 'default',
          image_url: '',
          prompt_used: 'Close-up version',
          status: 'processing',
          ai_analysis: aiSuggestions && !aiSuggestions.error ? aiSuggestions : undefined
        });
        console.log('Cropped image record created:', croppedImage.id);
      }

      // Create lay-flat image record
      let layFlatImage = null;
      if (shouldGenerateCrop) {
        console.log('Creating lay-flat image record...');
        layFlatImage = await createGeneratedImageMutation.mutateAsync({
          garment_id: garmentId,
          garment_urls: mode === 'style' ? selectedGarments.map(g => g.image_url) : undefined,
          model_type: selectedModel?.id || 'default',
          image_url: '',
          prompt_used: 'Lay-flat version',
          status: 'processing',
          ai_analysis: aiSuggestions && !aiSuggestions.error ? aiSuggestions : undefined
        });
        console.log('Lay-flat image record created:', layFlatImage.id);
      }
      console.log('All placeholder records created, navigating to gallery...');

      // Store the prompt for use in background
      setLastPrompt(prompt);
      setSavedAnalysis(aiSuggestions);

      // Navigate to gallery immediately
      window.scrollTo(0, 0);
      navigate(createPageUrl('Gallery'));

      // Generate images in background with timeout protection
      (async () => {
        const TIMEOUT = 5 * 60 * 1000; // 5 minutes
        let timeoutId;
        
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Generation timeout')), TIMEOUT);
        });

        try {
          const generateWithTimeout = async () => {
            const result = await base44.integrations.Core.GenerateImage({
              prompt: `${prompt} 4:5 aspect ratio, portrait orientation.`,
              existing_image_urls: imageUrls
            });

            console.log('Updating full-body image record:', newImage.id);
            await base44.entities.GeneratedImage.update(newImage.id, {
              image_url: result.url,
              status: 'completed'
            });
            console.log('Full-body image record updated successfully');

            if (croppedImage) {
              const category = garmentData.category;
              
              let croppedPrompt = '';
              let referenceImages = [];
              
              // Use only the generated full-body image as reference (2 images causes IMAGE_OTHER errors from Gemini)
              if (category === 'tops' || category === 'outerwear') {
                croppedPrompt = 'Professional product photography closeup shot. Model wearing the top/jacket from reference, framed from waist/mid-torso up to head. Upper body garment is main focus filling frame. Show fabric texture, details, neckline, sleeves, fit on upper body. Model face and shoulders visible. Same lighting and background as reference.';
                referenceImages = [result.url];
              } else if (category === 'bottoms') {
                croppedPrompt = 'Professional product photography closeup shot. Model wearing the pants/shorts/skirt from reference, framed from knees/mid-thigh up to chest. Lower body garment is main focus filling frame. Show fabric texture, waistband, fit on legs and hips. Model legs and torso visible, no face. Same lighting and background as reference.';
                referenceImages = [result.url];
              } else if (category === 'dresses') {
                croppedPrompt = 'Professional product photography closeup shot. Model wearing the dress from reference, framed from mid-thigh up to head. Dress is main focus filling frame. Show fabric texture, neckline, bodice, fit details. Model visible wearing dress. Same lighting and background as reference.';
                referenceImages = [result.url];
              } else if (category === 'accessories') {
                const name = garmentData.name.toLowerCase();
                if (name.includes('sko') || name.includes('shoe') || name.includes('sneaker') || name.includes('boot')) {
                  croppedPrompt = 'Professional product photography EXTREME CLOSEUP of shoes/footwear. Frame shows ONLY model feet wearing the shoes from reference, with lower legs visible from ankles to maximum knees. Shoes are THE PRIMARY SUBJECT filling 70% of frame. Show shoe material, laces, soles, logo, texture, how they fit on feet. Background: floor/ground visible. DO NOT show torso, waist, upper body, or face - frame stops at knees maximum. This is a FEET AND SHOES CLOSEUP ONLY.';
                  referenceImages = [result.url];
                } else if (name.includes('väska') || name.includes('bag')) {
                  croppedPrompt = 'Professional product photography closeup shot. Model holding/wearing the bag from reference. Bag is main focus filling frame with hands and partial torso visible. Show bag texture, hardware, straps, details. Same lighting and background as reference.';
                  referenceImages = [result.url];
                } else {
                  croppedPrompt = 'Professional product photography closeup shot. Model wearing the accessory from reference. Accessory is main focus filling significant portion of frame. Show accessory details, texture, materials. Model partially visible as needed. Same lighting and background as reference.';
                  // Use only the generated full-body image as reference (2 images causes IMAGE_OTHER errors)
                  referenceImages = [result.url];
                }
              } else {
                croppedPrompt = 'Professional product photography closeup shot. Model wearing the garment from reference. Garment is main focus filling frame. Show fabric texture, details, fit clearly. Same lighting and background as reference.';
                // Use only the generated full-body image as reference (2 images causes IMAGE_OTHER errors)
                referenceImages = [result.url];
              }
              
              const croppedResult = await base44.integrations.Core.GenerateImage({
                prompt: `${croppedPrompt} MANDATORY: 4:5 aspect ratio portrait orientation. Professional studio lighting matching reference. High quality product detail photography.`,
                existing_image_urls: referenceImages
              });

              console.log('Updating cropped image record:', croppedImage.id);
              await base44.entities.GeneratedImage.update(croppedImage.id, {
                image_url: croppedResult.url,
                status: 'completed'
              });
              console.log('Cropped image record updated successfully');
            }

            // Generate lay-flat version
            if (layFlatImage) {
              const layFlatPrompt = 'Professional product photography. Garment from reference image laid flat on light grey background (RGB 211, 211, 211). Top-down view, perfectly centered. Garment is neatly arranged and pressed flat. Studio lighting with soft shadows. Clean, minimal product shot. Same exact garment colors and details as reference. 4:5 aspect ratio, portrait orientation.';
              
              const layFlatResult = await base44.integrations.Core.GenerateImage({
                prompt: layFlatPrompt,
                existing_image_urls: [uploadedUrl]
              });

              console.log('Updating lay-flat image record:', layFlatImage.id);
              await base44.entities.GeneratedImage.update(layFlatImage.id, {
                image_url: layFlatResult.url,
                status: 'completed'
              });
              console.log('Lay-flat image record updated successfully');
            }
          };

          await Promise.race([generateWithTimeout(), timeoutPromise]);
          clearTimeout(timeoutId);
        } catch (error) {
          clearTimeout(timeoutId);
          console.error('Background generation failed:', error);
          
          // Always update status to failed, even if update fails
          try {
            await base44.entities.GeneratedImage.update(newImage.id, { status: 'failed' });
          } catch (updateError) {
            console.error('Failed to update main image status:', updateError);
          }
          
          if (croppedImage) {
            try {
              await base44.entities.GeneratedImage.update(croppedImage.id, { status: 'failed' });
            } catch (updateError) {
              console.error('Failed to update cropped image status:', updateError);
            }
          }

          if (layFlatImage) {
            try {
              await base44.entities.GeneratedImage.update(layFlatImage.id, { status: 'failed' });
            } catch (updateError) {
              console.error('Failed to update lay-flat image status:', updateError);
            }
          }
        }
      })();
    } catch (error) {
      console.error('❌ Generation setup failed:', error);
    }
  };

  const getEnvironmentPrompt = (env) => {
    const prompts = {
      studio: 'Professional studio photography with studio lighting setup. Light grey background (not pure white). Soft diffused lighting from key light at 45 degrees, fill light opposite side, and subtle rim light. Clean and minimal, color temperature 5500K, high-key lighting setup maintaining consistent brightness and shadow falloff. Model positioned center frame with even illumination.',
      urban: 'Urban street photography in Stockholm, Sweden. Modern Scandinavian city background with characteristic Stockholm architecture. Natural daylight, authentic Swedish street atmosphere with cobblestone streets, colorful buildings, or waterfront views.',
      custom: customEnvironment
    };
    return prompts[env] || prompts.studio;
  };

  const canGenerate = mode === 'style' 
    ? selectedGarments.length >= 2
    : mode === 'batch'
      ? batchGarments.length > 0
      : uploadedUrl && garmentData.name;

  return (
    <div className="max-w-[980px] mx-auto px-5 py-20">
      <div className="mb-12">
        <h1 className="text-5xl font-semibold tracking-tight mb-4 text-black dark:text-white">
          Generera produktbild
        </h1>
        <p className="text-xl text-black/60 dark:text-white/60">AI-driven modellfotografering</p>
      </div>

      {/* Mode Toggle */}
      {!generating && !generatedImage && (
        <div className="mb-8 flex gap-2">
          <button
            onClick={() => setMode('enkel')}
            className={cn(
              "px-5 py-2.5 rounded-full text-sm font-medium transition-all",
              mode === 'enkel' ? "bg-[#392599] text-white" : "bg-[#f5f5f7] text-black/60"
            )}
          >
            Enkel
          </button>
          <button
            onClick={() => setMode('batch')}
            className={cn(
              "px-5 py-2.5 rounded-full text-sm font-medium transition-all",
              mode === 'batch' ? "bg-[#392599] text-white" : "bg-[#f5f5f7] text-black/60 dark:bg-white/5 dark:text-white/60"
            )}
          >
            Batch
          </button>
          <button
            onClick={() => setMode('style')}
            className={cn(
              "px-5 py-2.5 rounded-full text-sm font-medium transition-all",
              mode === 'style' ? "bg-[#392599] text-white" : "bg-[#f5f5f7] text-black/60 dark:bg-white/5 dark:text-white/60"
            )}
          >
            Style
          </button>
          <button
            onClick={() => setMode('expert')}
            className={cn(
              "px-5 py-2.5 rounded-full text-sm font-medium transition-all",
              mode === 'expert' ? "bg-[#392599] text-white" : "bg-[#f5f5f7] text-black/60 dark:bg-white/5 dark:text-white/60"
            )}
          >
            Expert
          </button>
        </div>
      )}

      {loadingGarment ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#C9A962]" />
          <p className="text-black/60 dark:text-white/60">Laddar plagg...</p>
        </div>
      ) : !generating && !generatedImage ? (
        <div className="space-y-4">
          {/* Batch Mode: Select Multiple Garments */}
          {mode === 'batch' && (
            <AccordionSection id="batch-garments" title="1. Välj plagg för batch-generering" isComplete={batchGarments.length > 0} openSection={openSection} setOpenSection={setOpenSection}>
                <div className="space-y-4">
                  <p className="text-sm text-black/60 dark:text-white/60">Välj flera plagg att generera bilder för samtidigt</p>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {allGarments.map((garment) => {
                      const isSelected = batchGarments.some(g => g.id === garment.id);
                      return (
                        <button
                          key={garment.id}
                          onClick={() => {
                            if (isSelected) {
                              setBatchGarments(batchGarments.filter(g => g.id !== garment.id));
                            } else {
                              setBatchGarments([...batchGarments, garment]);
                            }
                          }}
                          className={cn(
                            "aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all relative",
                            isSelected ? "border-[#0071e3] ring-2 ring-[#0071e3]/20" : "border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
                          )}
                        >
                          {garment.image_url ? (
                            <SignedImage src={garment.image_url} alt={garment.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-[#f5f5f7] dark:bg-white/5 flex items-center justify-center">
                              <Shirt className="h-6 w-6 text-black/20 dark:text-white/20" />
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-[#392599] flex items-center justify-center">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                            <p className="text-xs text-white truncate">{garment.name}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {batchGarments.length > 0 && (
                    <div className="p-3 bg-[#392599]/10 rounded-lg">
                      <p className="text-sm text-black dark:text-white">
                        <span className="font-medium">{batchGarments.length} plagg valda</span>
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={() => setOpenSection('model')}
                    disabled={batchGarments.length === 0}
                    variant="outline"
                    className="w-full border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                  >
                    Fortsätt
                  </Button>
                </div>
            </AccordionSection>
          )}

          {/* Style Mode: Select Multiple Garments */}
          {mode === 'style' && (
            <AccordionSection id="garments" title="1. Välj plagg att kombinera" isComplete={selectedGarments.length >= 2} openSection={openSection} setOpenSection={setOpenSection}>
              <div className="space-y-4">
                <p className="text-sm text-black/60 dark:text-white/60">Välj minst 2 plagg att kombinera i en stil</p>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {allGarments.map((garment) => {
                    const isSelected = selectedGarments.some(g => g.id === garment.id);
                    return (
                      <button
                        key={garment.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedGarments(selectedGarments.filter(g => g.id !== garment.id));
                          } else {
                            setSelectedGarments([...selectedGarments, garment]);
                          }
                        }}
                        className={cn(
                          "aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all relative",
                          isSelected ? "border-[#392599] ring-2 ring-[#392599]/20" : "border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
                          )}
                          >
                          {garment.image_url ? (
                          <SignedImage src={garment.image_url} alt={garment.name} className="w-full h-full object-cover" />
                          ) : (
                          <div className="w-full h-full bg-[#f5f5f7] dark:bg-white/5 flex items-center justify-center">
                            <Shirt className="h-6 w-6 text-black/20 dark:text-white/20" />
                          </div>
                          )}
                          {isSelected && (
                          <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-[#392599] flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <p className="text-xs text-white truncate">{garment.name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {selectedGarments.length > 0 && (
                  <div className="p-3 bg-[#392599]/10 rounded-lg">
                    <p className="text-sm text-black dark:text-white">
                      <span className="font-medium">{selectedGarments.length} plagg valda:</span>{' '}
                      {selectedGarments.map(g => g.name).join(', ')}
                    </p>
                  </div>
                )}
                <Button
                  onClick={() => setOpenSection('model')}
                  disabled={selectedGarments.length < 2}
                  variant="outline"
                  className="w-full border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                >
                  Fortsätt
                </Button>
              </div>
            </AccordionSection>
          )}

          {/* Upload Section */}
          {mode !== 'style' && (
            <AccordionSection id="upload" title="1. Ladda upp plagg" isComplete={!!uploadedUrl} openSection={openSection} setOpenSection={setOpenSection}>
              <FileDropzone
                onFileSelect={handleFileSelect}
                uploading={uploading}
                preview={preview}
                onClear={() => {
                  setFile(null);
                  setPreview(null);
                  setUploadedUrl(null);
                  setAiSuggestions(null);
                  setGarmentData({ name: '', category: '', brand: '', sku: '' });
                }}
              />
              
              {/* Select from existing garments */}
              {allGarments.length > 0 && !uploadedUrl && (
                <div className="mt-6 pt-6 border-t border-black/10 dark:border-white/10">
                  <h4 className="text-sm font-medium text-black dark:text-white mb-3">Eller välj från dina plagg</h4>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {allGarments.slice(0, 12).map((garment) => (
                      <button
                        key={garment.id}
                        onClick={async () => {
                          setSelectedGarmentId(garment.id);
                          setAiSuggestions(null);
                          setGarmentData({
                            name: garment.name || '',
                            category: garment.category || '',
                            brand: garment.brand || '',
                            sku: garment.sku || ''
                          });
                          setUploadedUrl(garment.image_url);
                          setPreview(garment.image_url);
                          setOpenSection('details');

                          // Always analyze to show description
                          await analyzeGarment(garment.image_url);
                        }}
                        className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-black/10 hover:border-[#392599] transition-all dark:border-white/10 dark:hover:border-[#392599]"
                      >
                        {garment.image_url ? (
                          <SignedImage src={garment.image_url} alt={garment.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#f5f5f7] dark:bg-white/5 flex items-center justify-center">
                            <Shirt className="h-4 w-4 text-black/20 dark:text-white/20" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </AccordionSection>
          )}

          {/* Details Section */}
          {mode !== 'style' && uploadedUrl && (
            <AccordionSection id="details" title="2. Plagginformation" isComplete={!!garmentData.name} openSection={openSection} setOpenSection={setOpenSection}>
              <div className="space-y-4">
                {/* AI Analysis Status */}
                {analyzing && (
                  <div className="p-4 bg-[#392599]/10 border border-[#392599]/30 rounded-xl flex items-center gap-3">
                    <Loader2 className="h-5 w-5 text-[#392599] animate-spin" />
                    <div>
                      <p className="text-sm font-medium text-black dark:text-white">AI analyserar plagget...</p>
                      <p className="text-xs text-black/60 dark:text-white/60">Föreslår kategori och namn</p>
                    </div>
                  </div>
                )}

                {/* AI Suggestions */}
                {aiSuggestions && !analyzing && (
                  <div className={cn(
                    "p-4 rounded-xl",
                    aiSuggestions.error 
                      ? "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-700/30"
                      : "bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-700/30"
                  )}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {aiSuggestions.error ? (
                          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        ) : (
                          <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                        )}
                        <p className={cn(
                          "text-sm font-medium",
                          aiSuggestions.error ? "text-red-800 dark:text-red-200" : "text-green-800 dark:text-green-200"
                        )}>
                          {aiSuggestions.error ? 'Fel vid analys' : 'AI-förslag'}
                        </p>
                      </div>
                      <Button
                        onClick={() => analyzeGarment(uploadedUrl)}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-auto py-1 px-2 text-xs",
                          aiSuggestions.error 
                            ? "text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40"
                            : "text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40"
                        )}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Försök igen
                      </Button>
                    </div>
                    {aiSuggestions.error ? (
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {aiSuggestions.error}
                      </p>
                    ) : (
                      <>
                        {aiSuggestions.description && (
                          <p className="text-sm text-green-700 dark:text-green-300 mb-3 italic">
                            "{aiSuggestions.description}"
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {aiSuggestions.style && (
                            <div className="p-2 bg-white/60 dark:bg-black/20 rounded">
                              <p className="text-green-600 dark:text-green-400">Stil</p>
                              <p className="text-black dark:text-white capitalize">{aiSuggestions.style}</p>
                            </div>
                          )}
                          {aiSuggestions.category && (
                            <div className="p-2 bg-white/60 dark:bg-black/20 rounded">
                              <p className="text-green-600 dark:text-green-400">Kategori</p>
                              <p className="text-black dark:text-white capitalize">{aiSuggestions.category}</p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div>
                  <Label className="text-black/80 dark:text-white/80">Namn *</Label>
                  <Input
                    value={garmentData.name}
                    onChange={(e) => setGarmentData({ ...garmentData, name: e.target.value })}
                    placeholder="T.ex. Svart Blazer"
                    className="mt-2 bg-[#f5f5f7] border-black/10 text-black dark:bg-white/5 dark:border-white/10 dark:text-white"
                  />
                </div>
                
                <div>
                  <Label className="text-black/80 dark:text-white/80">Kategori</Label>
                  <select
                    value={garmentData.category}
                    onChange={(e) => setGarmentData({ ...garmentData, category: e.target.value })}
                    className="w-full mt-2 px-3 py-2 rounded-lg bg-[#f5f5f7] border border-black/10 text-black dark:bg-white/5 dark:border-white/10 dark:text-white"
                  >
                    <option value="">Välj kategori</option>
                    <option value="tops">Överdel</option>
                    <option value="bottoms">Underdel</option>
                    <option value="dresses">Klänningar</option>
                    <option value="outerwear">Ytterkläder</option>
                    <option value="accessories">Accessoarer</option>
                  </select>
                </div>
                
                <div>
                  <Label className="text-black/80 dark:text-white/80">Varumärke</Label>
                  <Input
                    value={garmentData.brand}
                    onChange={(e) => setGarmentData({ ...garmentData, brand: e.target.value })}
                    placeholder="Valfritt"
                    className="mt-2 bg-[#f5f5f7] border-black/10 text-black dark:bg-white/5 dark:border-white/10 dark:text-white"
                  />
                </div>
                
                <div>
                  <Label className="text-black/80 dark:text-white/80">SKU / Artikelnummer</Label>
                  <Input
                    value={garmentData.sku}
                    onChange={(e) => setGarmentData({ ...garmentData, sku: e.target.value })}
                    placeholder="Valfritt"
                    className="mt-2 bg-[#f5f5f7] border-black/10 text-black dark:bg-white/5 dark:border-white/10 dark:text-white"
                  />
                </div>
              </div>
            </AccordionSection>
          )}

          {/* Brand Seed Selection */}
          {mode !== 'style' && garmentData.name && (
            <AccordionSection 
              id="seed" 
              title={selectedSeed ? `3. Varumärkesstil (Seed ${selectedSeed.name})` : "3. Varumärkesstil (Seed)"} 
              isComplete={selectedSeed !== null} 
              openSection={openSection} 
              setOpenSection={setOpenSection}
            >
              <div className="space-y-4">
                {selectedSeed && (
                  <div className="p-4 bg-[#C9A962]/10 border border-[#C9A962]/30 dark:bg-[#C9A962]/10 dark:border-[#C9A962]/30 rounded-xl flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-[#C9A962]/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-6 w-6 text-[#C9A962]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-black dark:text-white">{selectedSeed.name}</p>
                      <p className="text-sm text-black/60 dark:text-white/60">{selectedSeed.character} • {selectedSeed.environment?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-black/80 dark:text-white/80">Välj varumärkesstil</Label>
                  <select
                    value={selectedSeed?.id || ''}
                    onChange={(e) => {
                      const seed = seeds.find(s => s.id === e.target.value);
                      setSelectedSeed(seed || null);
                    }}
                    className="w-full mt-2 px-3 py-2 rounded-lg bg-[#f5f5f7] border border-black/10 text-black dark:bg-white/5 dark:border-white/10 dark:text-white"
                  >
                    <option value="">Ingen (standard)</option>
                    {seeds.map((seed) => (
                      <option key={seed.id} value={seed.id}>
                        {seed.name} ({seed.domain})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSeed && (
                  <div className="p-3 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-black/40 dark:text-white/40">Karaktär</p>
                        <p className="text-sm text-black dark:text-white capitalize">{selectedSeed.character}</p>
                      </div>
                      <div>
                        <p className="text-xs text-black/40 dark:text-white/40">Förvald miljö</p>
                        <p className="text-sm text-black dark:text-white capitalize">{selectedSeed.environment?.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-black/10 dark:border-white/10">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useSeedEnvironment}
                          onChange={(e) => setUseSeedEnvironment(e.target.checked)}
                          className="rounded border-black/20 dark:border-white/20"
                        />
                        <span className="text-sm text-black dark:text-white">Använd seedens förvalda miljö</span>
                      </label>
                    </div>
                  </div>
                )}

                <p className="text-xs text-black/50 dark:text-white/50">
                  Använd en sparad varumärkesstil för konsekvent estetik. Skanna en sajt på Dashboard för att skapa en seed.
                </p>

                <Button
                  onClick={() => setOpenSection('model')}
                  variant="outline"
                  className="w-full border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                >
                  Fortsätt
                </Button>
              </div>
            </AccordionSection>
          )}

          {/* Model Selection (Enkel/Batch/Style mode) */}
          {(mode === 'enkel' || mode === 'batch' || (mode === 'style' && selectedGarments.length >= 2)) && (mode === 'batch' ? batchGarments.length > 0 : (mode !== 'style' ? garmentData.name : true)) && (
            <AccordionSection 
              id="model" 
              title="4. Välj modell" 
              isComplete={selectedModel !== null || selectedGender !== null} 
              openSection={openSection} 
              setOpenSection={setOpenSection}
              thumbnail={selectedModel?.image_url ? (
                <SignedImage src={selectedModel.image_url} alt={selectedModel.name} className="w-full h-full object-cover" />
              ) : null}
            >
              <div className="space-y-4">
                {selectedModel && (
                  <div className="p-4 bg-[#392599]/10 border border-[#392599]/30 dark:bg-[#392599]/10 dark:border-[#392599]/30 rounded-xl flex items-center gap-3">
                    <div className="h-16 w-16 rounded-lg overflow-hidden bg-white dark:bg-white/5 flex-shrink-0">
                      {selectedModel.image_url ? (
                        <SignedImage src={selectedModel.image_url} alt={selectedModel.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Sparkles className="h-6 w-6 text-[#392599]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-black dark:text-white">{selectedModel.name}</p>
                      <p className="text-sm text-black/60 dark:text-white/60 capitalize">{selectedModel.gender} • {selectedModel.ethnicity}</p>
                    </div>
                  </div>
                )}

                {/* Gender Selection */}
                <div>
                  <Label className="text-black/80 dark:text-white/80 mb-2">Kön</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <button
                      onClick={() => {
                        setSelectedGender('female');
                        setSelectedModel(null);
                      }}
                      className={cn(
                        "p-4 rounded-xl border-2 text-left transition-all",
                        selectedGender === 'female' && !selectedModel
                          ? "border-[#0071e3] bg-[#0071e3]/5" 
                          : "border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
                      )}
                    >
                      <p className="font-medium text-black dark:text-white">Kvinna</p>
                      <p className="text-sm text-black/50 dark:text-white/50 mt-1">Kvinnlig modell</p>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGender('male');
                        setSelectedModel(null);
                      }}
                      className={cn(
                        "p-4 rounded-xl border-2 text-left transition-all",
                        selectedGender === 'male' && !selectedModel
                          ? "border-[#0071e3] bg-[#0071e3]/5" 
                          : "border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
                      )}
                    >
                      <p className="font-medium text-black dark:text-white">Man</p>
                      <p className="text-sm text-black/50 dark:text-white/50 mt-1">Manlig modell</p>
                    </button>
                  </div>
                </div>

                {/* Predefined Models */}
                {models.length > 0 && (
                  <div>
                    <Label className="text-black/80 dark:text-white/80 mb-2">Eller välj specifik modell</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                      {models
                        .filter(model => !selectedGender || model.gender === selectedGender)
                        .map((model) => (
                          <button
                            key={model.id}
                            onClick={() => {
                              setSelectedModel(model);
                              setSelectedGender(null);
                              setOpenSection('environment');
                            }}
                            className={cn(
                              "aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all",
                              selectedModel?.id === model.id ? "border-[#392599]" : "border-black/10 hover:border-black/20"
                            )}
                          >
                            {model.image_url ? (
                              <SignedImage src={model.image_url} alt={model.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-[#f5f5f7] flex items-center justify-center">
                                <span className="text-xs text-black/40">{model.name}</span>
                              </div>
                            )}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
                
                <Button
                  onClick={() => setOpenSection('environment')}
                  variant="outline"
                  className="w-full border-black/10 hover:bg-black/5"
                >
                  Fortsätt
                </Button>
              </div>
            </AccordionSection>
          )}

          {/* Environment Selection (Enkel/Batch/Style mode) */}
          {(mode === 'enkel' || mode === 'batch' || mode === 'style') && (mode === 'batch' ? batchGarments.length > 0 : (mode !== 'style' ? garmentData.name : selectedGarments.length >= 2)) && (
            <AccordionSection id="environment" title="5. Välj miljö" isComplete={selectedEnvironment !== null} openSection={openSection} setOpenSection={setOpenSection}>
              <div className="space-y-3">
                {selectedSeed && useSeedEnvironment && (
                  <div className="mb-4 p-3 bg-[#C9A962]/10 border border-[#C9A962]/30 rounded-lg">
                    <p className="text-sm text-black dark:text-white">
                      Använder seedens miljö: <span className="font-medium capitalize">{selectedSeed.environment?.replace(/_/g, ' ')}</span>
                    </p>
                    <p className="text-xs text-black/50 dark:text-white/50 mt-1">
                      Gå tillbaka till plagginformation för att ändra detta
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'studio', name: 'Studio', desc: 'Studio lighting, ljusgrå bakgrund' },
                    { id: 'urban', name: 'Stockholm', desc: 'Gator i Stockholm' }
                  ].map((env) => (
                    <button
                      key={env.id}
                      onClick={() => {
                        setSelectedEnvironment(env.id);
                        if (env.id !== 'custom') setCustomEnvironment('');
                      }}
                      disabled={selectedSeed && useSeedEnvironment}
                      className={cn(
                        "p-4 rounded-xl border-2 text-left transition-all",
                        selectedSeed && useSeedEnvironment ? "opacity-50 cursor-not-allowed" : "",
                        selectedEnvironment === env.id 
                          ? "border-[#0071e3] bg-[#0071e3]/5" 
                          : "border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
                      )}
                    >
                      <p className="font-medium text-black dark:text-white">{env.name}</p>
                      <p className="text-sm text-black/50 dark:text-white/50 mt-1">{env.desc}</p>
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedEnvironment('custom')}
                    disabled={selectedSeed && useSeedEnvironment}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all",
                      selectedSeed && useSeedEnvironment ? "opacity-50 cursor-not-allowed" : "",
                      selectedEnvironment === 'custom'
                        ? "border-[#0071e3] bg-[#0071e3]/5" 
                        : "border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
                    )}
                  >
                    <p className="font-medium text-black dark:text-white">Valfri</p>
                    <p className="text-sm text-black/50 dark:text-white/50 mt-1">Beskriv egen miljö</p>
                  </button>
                </div>

                {/* Custom Environment Input */}
                {selectedEnvironment === 'custom' && (
                  <div>
                    <Label className="text-black/80 dark:text-white/80">Beskriv miljön</Label>
                    <Textarea
                      value={customEnvironment}
                      onChange={(e) => setCustomEnvironment(e.target.value)}
                      placeholder="T.ex. 'På en café med varmt ljus' eller 'I en bil, solnedgång'"
                      className="mt-2 bg-[#f5f5f7] border-black/10 text-black min-h-[80px] dark:bg-white/5 dark:border-white/10 dark:text-white"
                    />
                  </div>
                )}
              </div>
            </AccordionSection>
          )}

          {/* Custom Prompt (Expert mode) */}
          {mode === 'expert' && garmentData.name && (
            <AccordionSection id="prompt" title="4. Anpassad prompt" isComplete={customPrompt !== ''} openSection={openSection} setOpenSection={setOpenSection}>
              <div>
                <Label className="text-black/80 dark:text-white/80">Prompt (valfritt)</Label>
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Beskriv exakt hur bilden ska se ut, eller lämna tom för standardinställningar..."
                  className="mt-2 bg-[#f5f5f7] border-black/10 text-black min-h-[120px] dark:bg-white/5 dark:border-white/10 dark:text-white"
                />
                <p className="text-xs text-black/50 dark:text-white/50 mt-2">
                  Tips: Beskriv modell, pose, ljussättning, bakgrund, och stil
                </p>
              </div>
            </AccordionSection>
          )}

          {/* Action Buttons */}
          {canGenerate && (
            <div className="space-y-3">
              <Button
                onClick={mode === 'batch' ? handleBatchGenerate : handleGenerate}
                className="w-full bg-[#392599] hover:bg-[#4a2fb3] text-white rounded-full py-6 text-lg"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                {mode === 'batch' ? `Generera ${batchGarments.length} bilder` : 'Generera bild'}
              </Button>
              
              <Button
                onClick={() => setShowSaveTemplate(true)}
                variant="outline"
                className="w-full border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
              >
                <Save className="h-4 w-4 mr-2" />
                Spara som mall
              </Button>
            </div>
          )}
        </div>
      ) : batchGenerating ? (
        <div className="max-w-sm mx-auto py-12 text-center">
          <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-[#392599]" />
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-2">
            Genererar batch-bilder
          </h2>
          <p className="text-black/60 dark:text-white/60 mb-4">
            {batchProgress.current} av {batchProgress.total} bilder
          </p>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-[#392599]"
              initial={{ width: 0 }}
              animate={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      ) : generating ? (
        <div className="max-w-sm mx-auto py-12">
          <GenerationProgress status="generating" progress={Math.round(progress)} />
        </div>
      ) : generatedImage ? (
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-black dark:text-white mb-2">Bilden är klar!</h2>
          <p className="text-black/60 dark:text-white/60 mb-8">Din AI-genererade produktbild</p>

          <div className={cn("mx-auto mb-6", generatedImages ? "max-w-5xl" : "max-w-lg")}>
            {generatedImages ? (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-black/60 dark:text-white/60 mb-3">Helbild</p>
                  <div className="rounded-2xl overflow-hidden bg-[#f5f5f7]">
                    <img 
                      src={generatedImages.fullBody} 
                      alt="Full body" 
                      className="w-full aspect-[3/4] object-cover"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-black/60 dark:text-white/60 mb-3">Närbild</p>
                  <div className="rounded-2xl overflow-hidden bg-[#f5f5f7]">
                    <img 
                      src={generatedImages.framed} 
                      alt="Close-up" 
                      className="w-full aspect-[3/4] object-cover"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden bg-[#f5f5f7]">
                <img 
                  src={generatedImage} 
                  alt="Generated" 
                  className="w-full aspect-[3/4] object-cover"
                />
              </div>
            )}
          </div>

          <div className={cn("mx-auto mb-8", generatedImages ? "max-w-5xl" : "max-w-lg")}>
            <ImageRefinementPanel
              currentImage={generatedImage}
              currentImages={generatedImages}
              originalGeneratedImageId={currentGeneratedImageId}
              originalPrompt={lastPrompt}
              garmentImageUrl={mode === 'style' ? selectedGarments.map(g => g.image_url) : [uploadedUrl]}
              onImageUpdated={(newUrl) => setGeneratedImage(newUrl)}
              onImagesUpdated={(newImages) => setGeneratedImages(newImages)}
              onGenerateImage={async (prompt, imageUrls) => {
                const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
                const result = await base44.integrations.Core.GenerateImage({
                  prompt: `${prompt} 4:5 aspect ratio, portrait orientation.`,
                  existing_image_urls: urls
                });
                return result;
              }}
              onSaveImage={async (imageUrl, promptUsed) => {
                if (currentGeneratedImageId) {
                  await base44.entities.GeneratedImage.update(currentGeneratedImageId, {
                    image_url: imageUrl,
                    prompt_used: promptUsed,
                    ai_analysis: savedAnalysis && !savedAnalysis.error ? savedAnalysis : undefined
                  });
                }
                navigate(createPageUrl('Gallery'));
              }}
              onClose={() => navigate(createPageUrl('Gallery'))}
            />
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => setShowInfo(true)}
              variant="outline"
              className="border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
            >
              <Info className="h-4 w-4 mr-2" />
              Information
            </Button>
            {generatedImages ? (
              <>
                <Button
                  onClick={async () => {
                    // Download both images
                    for (const [key, url] of Object.entries(generatedImages)) {
                      const response = await fetch(url);
                      const blob = await response.blob();
                      const blobUrl = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = blobUrl;
                      a.download = `${garmentData.name || 'generated'}-${key === 'fullBody' ? 'helbild' : 'narbild'}.png`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(blobUrl);
                      await new Promise(resolve => setTimeout(resolve, 300));
                    }
                  }}
                  className="bg-[#392599] hover:bg-[#4a2fb3] text-white rounded-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Ladda ner båda
                </Button>
              </>
            ) : (
              <Button
                onClick={async () => {
                  const response = await fetch(generatedImage);
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${garmentData.name || 'generated'}-model.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                }}
                className="bg-[#392599] hover:bg-[#4a2fb3] text-white rounded-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Ladda ner
              </Button>
            )}
            <Button
              onClick={() => {
                setFile(null);
                setPreview(null);
                setUploadedUrl(null);
                setSelectedGarmentId(null);
                setGarmentData({ name: '', category: '', brand: '', sku: '' });
                setSelectedGender(null);
                setSelectedModel(null);
                setSelectedSeed(null);
                setSelectedGarments([]);
                setUseSeedEnvironment(true);
                setSelectedEnvironment('studio');
                setCustomEnvironment('');
                setCustomPrompt('');
                setGeneratedImage(null);
                setGeneratedImages(null);
                setCurrentGeneratedImageId(null);
                setSavedAnalysis(null);
                setOpenSection(mode === 'style' ? 'garments' : 'upload');
                }}
                className="bg-[#392599] hover:bg-[#4a2fb3] text-white rounded-full"
            >
              Skapa ny
            </Button>
          </div>
        </div>
      ) : null}

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowInfo(false)}
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
                  onClick={() => setShowInfo(false)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-black dark:text-white" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Original Garment */}
                <div>
                  <h3 className="text-sm font-medium text-black/60 dark:text-white/60 mb-3">Originalplagg</h3>
                  <div className="flex gap-4">
                    <div className="w-24 h-32 rounded-lg overflow-hidden bg-[#f5f5f7] dark:bg-white/5">
                      <SignedImage src={uploadedUrl} alt="Original" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <p className="text-xs text-black/40 dark:text-white/40">Namn</p>
                        <p className="text-sm text-black dark:text-white">{garmentData.name}</p>
                      </div>
                      {garmentData.category && (
                        <div>
                          <p className="text-xs text-black/40 dark:text-white/40">Kategori</p>
                          <p className="text-sm text-black dark:text-white capitalize">{garmentData.category}</p>
                        </div>
                      )}
                      {garmentData.brand && (
                        <div>
                          <p className="text-xs text-black/40 dark:text-white/40">Varumärke</p>
                          <p className="text-sm text-black dark:text-white">{garmentData.brand}</p>
                        </div>
                      )}
                      {garmentData.sku && (
                        <div>
                          <p className="text-xs text-black/40 dark:text-white/40">SKU</p>
                          <p className="text-sm text-black dark:text-white">{garmentData.sku}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <a 
                    href={uploadedUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-3 text-xs text-[#392599] hover:underline inline-flex items-center gap-1"
                  >
                    Öppna originalbild i nytt fönster →
                  </a>
                </div>

                {/* AI Analysis */}
                {savedAnalysis && !savedAnalysis.error && (
                  <div>
                    <h3 className="text-sm font-medium text-black/60 dark:text-white/60 mb-3">AI-analys</h3>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30 rounded-xl space-y-3">
                      {savedAnalysis.description && (
                        <p className="text-sm text-green-700 dark:text-green-300 italic">
                          "{savedAnalysis.description}"
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {savedAnalysis.style && (
                          <div className="p-2 bg-white/60 dark:bg-black/20 rounded">
                            <p className="text-green-600 dark:text-green-400">Stil</p>
                            <p className="text-black dark:text-white capitalize">{savedAnalysis.style}</p>
                          </div>
                        )}
                        {savedAnalysis.category && (
                          <div className="p-2 bg-white/60 dark:bg-black/20 rounded">
                            <p className="text-green-600 dark:text-green-400">Kategori</p>
                            <p className="text-black dark:text-white capitalize">{savedAnalysis.category}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Generation Settings */}
                <div>
                  <h3 className="text-sm font-medium text-black/60 dark:text-white/60 mb-3">Genereringsinställningar</h3>
                  <div className="space-y-2 text-sm">
                    {selectedModel && (
                      <div className="flex justify-between">
                        <span className="text-black/60 dark:text-white/60">Modell</span>
                        <span className="text-black dark:text-white">{selectedModel.name}</span>
                      </div>
                    )}
                    {selectedGender && !selectedModel && (
                      <div className="flex justify-between">
                        <span className="text-black/60 dark:text-white/60">Kön</span>
                        <span className="text-black dark:text-white capitalize">{selectedGender}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-black/60 dark:text-white/60">Miljö</span>
                      <span className="text-black dark:text-white capitalize">{selectedEnvironment === 'studio' ? 'Studio' : selectedEnvironment === 'urban' ? 'Stockholm' : 'Valfri'}</span>
                    </div>
                    {selectedSeed && (
                      <div className="flex justify-between">
                        <span className="text-black/60 dark:text-white/60">Varumärkesstil</span>
                        <span className="text-black dark:text-white">{selectedSeed.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prompt */}
                {lastPrompt && (
                  <div>
                    <h3 className="text-sm font-medium text-black/60 dark:text-white/60 mb-3">Använd prompt</h3>
                    <div className="p-3 bg-[#f5f5f7] dark:bg-white/5 rounded-lg text-xs text-black dark:text-white font-mono whitespace-pre-wrap break-words">
                      {lastPrompt}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Template Modal */}
      <AnimatePresence>
        {showSaveTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowSaveTemplate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1A1A1A] border border-white/10 rounded-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Spara som mall</h3>
                <button
                  onClick={() => setShowSaveTemplate(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>

              <SaveTemplateForm
                configuration={{
                  model_id: selectedModel?.id || '',
                  gender: selectedGender || '',
                  environment: selectedEnvironment,
                  custom_environment: customEnvironment,
                  brand_seed_id: selectedSeed?.id || '',
                  use_seed_environment: useSeedEnvironment,
                  custom_prompt: customPrompt
                }}
                onSave={async (data) => {
                  await createTemplateMutation.mutateAsync(data);
                }}
                onCancel={() => setShowSaveTemplate(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SaveTemplateForm({ configuration, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'campaign'
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    
    setSaving(true);
    try {
      await onSave({
        ...formData,
        configuration
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-white/80">Namn *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="T.ex. Sommarkampanj 2025"
          className="mt-2 bg-white/5 border-white/10 text-white"
        />
      </div>

      <div>
        <Label className="text-white/80">Beskrivning</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Beskriv vad denna mall används till..."
          className="mt-2 bg-white/5 border-white/10 text-white min-h-[80px]"
        />
      </div>

      <div>
        <Label className="text-white/80">Kategori</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger className="mt-2 bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="campaign">Kampanj</SelectItem>
            <SelectItem value="product_category">Produktkategori</SelectItem>
            <SelectItem value="seasonal">Säsong</SelectItem>
            <SelectItem value="brand_style">Varumärkesstil</SelectItem>
            <SelectItem value="custom">Anpassad</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          onClick={onCancel}
          variant="outline"
          className="border-white/10 text-white hover:bg-white/10"
        >
          Avbryt
        </Button>
        <Button
          onClick={handleSave}
          disabled={!formData.name.trim() || saving}
          className="bg-[#392599] hover:bg-[#4a2fb3] text-white"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sparar...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Spara mall
            </>
          )}
        </Button>
      </div>
    </div>
  );
}