import React, { useState } from 'react';
import { base44 } from '@/api/amplifyClient';
import { useAuth } from '@/lib/AuthContext';
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Check, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Label } from "@/components/ui/label";

const modelPrompts = [
  { id: 'pm1', name: 'Emma Andersson', prompt: 'Professional studio portrait photography of a 24-year-old Scandinavian female model named Emma with blonde hair and fair skin, athletic build. Shot with Hasselblad camera 50mm f1.2 lens. Studio lighting setup with key light, fill light and rim light. Clean white background. High-end fashion photography. Extremely sharp focus on eyes. Professional makeup and hair styling. Natural expression. Photorealistic, ultra detailed, 8K quality.' },
  { id: 'pm2', name: 'Marcus Johansson', prompt: 'Professional studio portrait photography of a 28-year-old Caucasian male model named Marcus with brunette hair and light skin, athletic build. Shot with Hasselblad camera 50mm f1.2 lens. Studio lighting setup with key light, fill light and rim light. Clean white background. High-end fashion photography. Extremely sharp focus. Professional styling. Confident expression. Photorealistic, ultra detailed, 8K quality.' },
  { id: 'pm3', name: 'Aisha Mohammed', prompt: 'Professional studio portrait photography of a 26-year-old African female model named Aisha with black hair and dark skin, slim build. Shot with Hasselblad camera 50mm f1.2 lens. Studio lighting setup with key light, fill light and rim light. Clean white background. High-end fashion photography. Extremely sharp focus on eyes. Professional makeup and hair styling. Elegant expression. Photorealistic, ultra detailed, 8K quality.' },
  { id: 'pm4', name: 'Lucas Berg', prompt: 'Professional studio portrait photography of a 32-year-old Caucasian male model named Lucas with brunette hair and tan skin, athletic build. Shot with Hasselblad camera 50mm f1.2 lens. Studio lighting setup with key light, fill light and rim light. Clean white background. High-end fashion photography. Extremely sharp focus. Professional styling. Mature confident expression. Photorealistic, ultra detailed, 8K quality.' },
  { id: 'pm5', name: 'Sofia Lind', prompt: 'Professional studio portrait photography of a 22-year-old Scandinavian female model named Sofia with blonde hair and fair skin, slim build. Shot with Hasselblad camera 50mm f1.2 lens. Studio lighting setup with key light, fill light and rim light. Clean white background. High-end fashion photography. Extremely sharp focus on eyes. Fresh natural makeup. Young and natural expression. Photorealistic, ultra detailed, 8K quality.' },
  { id: 'pm6', name: 'Chen Wei', prompt: 'Professional studio portrait photography of a 27-year-old Asian male model named Chen with black hair and light skin, slim build. Shot with Hasselblad camera 50mm f1.2 lens. Studio lighting setup with key light, fill light and rim light. Clean white background. High-end fashion photography. Extremely sharp focus. Minimalist elegant styling. Photorealistic, ultra detailed, 8K quality.' },
  { id: 'pm7', name: 'Isabella Rodriguez', prompt: 'Professional studio portrait photography of a 29-year-old Hispanic female model named Isabella with brunette hair and tan skin, curvy build. Shot with Hasselblad camera 50mm f1.2 lens. Studio lighting setup with key light, fill light and rim light. Clean white background. High-end fashion photography. Extremely sharp focus on eyes. Professional makeup. Confident sensual expression. Photorealistic, ultra detailed, 8K quality.' },
  { id: 'pm8', name: 'Oliver Karlsson', prompt: 'Professional studio portrait photography of a 25-year-old Scandinavian male model named Oliver with blonde hair and fair skin, average build. Shot with Hasselblad camera 50mm f1.2 lens. Studio lighting setup with key light, fill light and rim light. Clean white background. High-end fashion photography. Extremely sharp focus. Casual approachable styling. Photorealistic, ultra detailed, 8K quality.' },
  { id: 'pm9', name: 'Zara Hassan', prompt: 'Professional studio portrait photography of a 31-year-old Middle Eastern female model named Zara with black hair and medium skin tone, athletic build. Shot with Hasselblad camera 50mm f1.2 lens. Studio lighting setup with key light, fill light and rim light. Clean white background. High-end fashion photography. Extremely sharp focus on eyes. Strong confident expression. Photorealistic, ultra detailed, 8K quality.' },
  { id: 'pm10', name: 'Erik Nilsson', prompt: 'Professional studio portrait photography of a 35-year-old Caucasian male model named Erik with gray hair and light skin, average build. Shot with Hasselblad camera 50mm f1.2 lens. Studio lighting setup with key light, fill light and rim light. Clean white background. High-end fashion photography. Extremely sharp focus. Distinguished mature styling. Photorealistic, ultra detailed, 8K quality.' },
  { id: 'pm11', name: 'Maya Patel', prompt: 'Professional studio portrait photography of a 23-year-old South Asian female model named Maya with black hair and medium skin tone, slim build. Shot with Hasselblad camera 50mm f1.2 lens. Studio lighting setup with key light, fill light and rim light. Clean white background. High-end fashion photography. Extremely sharp focus on eyes. Young dynamic expression. Photorealistic, ultra detailed, 8K quality.' },
  { id: 'pm12', name: 'Alex Thompson', prompt: 'Professional studio portrait photography of a 30-year-old mixed ethnicity male model named Alex with brunette hair and tan skin, athletic build. Shot with Hasselblad camera 50mm f1.2 lens. Studio lighting setup with key light, fill light and rim light. Clean white background. High-end fashion photography. Extremely sharp focus. Modern multicultural appeal. Photorealistic, ultra detailed, 8K quality.' },
  { id: 'pm13', name: 'Linnea Svensson', prompt: 'Professional studio portrait photography of a 27-year-old Scandinavian female model named Linnea with red hair and fair skin, average build. Shot with Hasselblad camera 50mm f1.2 lens. Studio lighting setup with key light, fill light and rim light. Clean white background. High-end fashion photography. Extremely sharp focus on eyes. Unique natural beauty with red hair. Photorealistic, ultra detailed, 8K quality.' },
  { id: 'pm14', name: 'Jamal Williams', prompt: 'Professional studio portrait photography of a 26-year-old African male model named Jamal with black hair and dark skin, athletic build. Shot with Hasselblad camera 50mm f1.2 lens. Studio lighting setup with key light, fill light and rim light. Clean white background. High-end fashion photography. Extremely sharp focus. Strong powerful presence. Photorealistic, ultra detailed, 8K quality.' },
  { id: 'pm15', name: 'Hannah Lee', prompt: 'Professional studio portrait photography of a 25-year-old East Asian female model named Hannah with black hair and light skin, slim build. Shot with Hasselblad camera 50mm f1.2 lens. Studio lighting setup with key light, fill light and rim light. Clean white background. High-end fashion photography. Extremely sharp focus on eyes. Sophisticated modern styling. Photorealistic, ultra detailed, 8K quality.' },
  { id: 'pm16', name: 'Daniel Okoye', prompt: 'Professional studio portrait photography of a 29-year-old African male model named Daniel with black hair and dark skin, average build. Shot with Hasselblad camera 50mm f1.2 lens. Studio lighting setup with key light, fill light and rim light. Clean white background. High-end fashion photography. Extremely sharp focus. Warm approachable expression. Photorealistic, ultra detailed, 8K quality.' },
  { id: 'pm17', name: 'Victoria Borg', prompt: 'Professional studio portrait photography of a 33-year-old Caucasian female model named Victoria with brunette hair and light skin, curvy plus-size build. Shot with Hasselblad camera 50mm f1.2 lens. Studio lighting setup with key light, fill light and rim light. Clean white background. High-end fashion photography. Extremely sharp focus on eyes. Confident mature beauty. Photorealistic, ultra detailed, 8K quality.' },
  { id: 'pm18', name: 'Ravi Kumar', prompt: 'Professional studio portrait photography of a 24-year-old South Asian male model named Ravi with black hair and tan skin, slim build. Shot with Hasselblad camera 50mm f1.2 lens. Studio lighting setup with key light, fill light and rim light. Clean white background. High-end fashion photography. Extremely sharp focus. Young energetic expression. Photorealistic, ultra detailed, 8K quality.' },
  { id: 'pm19', name: 'Amelia Larsson', prompt: 'Professional studio portrait photography of a 30-year-old Scandinavian female model named Amelia with blonde hair and light skin, athletic build. Shot with Hasselblad camera 50mm f1.2 lens. Studio lighting setup with key light, fill light and rim light. Clean white background. High-end fashion photography. Extremely sharp focus on eyes. Sporty active styling. Photorealistic, ultra detailed, 8K quality.' },
  { id: 'pm20', name: 'Carlos Santos', prompt: 'Professional studio portrait photography of a 31-year-old Hispanic male model named Carlos with black hair and tan skin, average build. Shot with Hasselblad camera 50mm f1.2 lens. Studio lighting setup with key light, fill light and rim light. Clean white background. High-end fashion photography. Extremely sharp focus. Warm charismatic Latin style. Photorealistic, ultra detailed, 8K quality.' }
];

export default function GeneratePreMadePortraits({ onComplete }) {
  const { isAuthenticated, navigateToLogin } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState([]);
  const [generatedUrls, setGeneratedUrls] = useState({});
  const [showSettings, setShowSettings] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewImages, setPreviewImages] = useState({});
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  
  // User preferences
  const [settings, setSettings] = useState({
    style: 'professional',
    lighting: 'studio',
    background: 'white',
    quality: '8k'
  });

  const buildPromptWithSettings = (basePrompt) => {
    const styleDescriptions = {
      professional: 'High-end fashion photography',
      editorial: 'Editorial magazine style photography',
      commercial: 'Commercial advertising photography',
      artistic: 'Artistic creative portrait photography'
    };
    
    const lightingDescriptions = {
      studio: 'Studio lighting setup with key light, fill light and rim light',
      natural: 'Soft natural window lighting',
      dramatic: 'Dramatic low-key lighting with strong shadows',
      golden: 'Warm golden hour lighting',
      soft: 'Soft diffused lighting, minimal shadows'
    };
    
    const backgroundDescriptions = {
      white: 'Clean white background',
      gray: 'Neutral gray seamless background',
      black: 'Black background',
      gradient: 'Subtle gradient background',
      texture: 'Textured studio backdrop'
    };
    
    // Replace style, lighting and background in the prompt
    let customPrompt = basePrompt
      .replace(/High-end fashion photography/gi, styleDescriptions[settings.style])
      .replace(/Studio lighting setup with key light, fill light and rim light/gi, lightingDescriptions[settings.lighting])
      .replace(/Clean white background/gi, backgroundDescriptions[settings.background]);
    
    return customPrompt;
  };

  const generatePreview = async () => {
    // Require authentication for image generation
    if (!isAuthenticated) {
      navigateToLogin();
      return;
    }

    setGenerating(true);
    setProgress(0);
    const previews = {};
    
    // Generate 3 preview samples
    const sampleCount = 3;
    const sampleIndices = [0, 10, 19]; // First, middle, last
    
    for (let i = 0; i < sampleCount; i++) {
      const idx = sampleIndices[i];
      const model = modelPrompts[idx];
      try {
        const customPrompt = buildPromptWithSettings(model.prompt);
        const result = await base44.integrations.Core.GenerateImage({
          prompt: customPrompt
        });
        
        previews[model.id] = result.url;
        setPreviewImages({ ...previews });
        setProgress(((i + 1) / sampleCount) * 100);
      } catch (error) {
        console.error(`Failed to generate preview ${model.name}:`, error);
      }
    }
    
    setGenerating(false);
    setPreviewMode(true);
    setCurrentPreviewIndex(0);
  };

  const generateAllPortraits = async () => {
    // Require authentication for image generation
    if (!isAuthenticated) {
      navigateToLogin();
      return;
    }

    setShowSettings(false);
    setPreviewMode(false);
    setGenerating(true);
    setProgress(0);
    setCompleted([]);
    const urls = {};

    for (let i = 0; i < modelPrompts.length; i++) {
      const model = modelPrompts[i];
      try {
        const customPrompt = buildPromptWithSettings(model.prompt);
        const result = await base44.integrations.Core.GenerateImage({
          prompt: customPrompt
        });
        
        urls[model.id] = result.url;
        setGeneratedUrls({ ...urls });
        setCompleted(prev => [...prev, model.id]);
        setProgress(((i + 1) / modelPrompts.length) * 100);
      } catch (error) {
        console.error(`Failed to generate ${model.name}:`, error);
      }
    }

    setGenerating(false);
    if (onComplete) {
      onComplete(urls);
    }
  };
  
  const resetAndGoBack = () => {
    setPreviewMode(false);
    setPreviewImages({});
    setShowSettings(true);
    setProgress(0);
  };

  const previewSamples = [
    { id: modelPrompts[0].id, name: modelPrompts[0].name },
    { id: modelPrompts[10].id, name: modelPrompts[10].name },
    { id: modelPrompts[19].id, name: modelPrompts[19].name }
  ];

  return (
    <div className="p-6 bg-[#f5f5f7] dark:bg-gray-800 rounded-2xl">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
          Generera unika Hasselblad-porträtt
        </h3>
        <p className="text-sm text-black/60 dark:text-white/60">
          Anpassa stil och förhandsgranska innan generering
        </p>
      </div>

      {/* Settings Panel */}
      {showSettings && !generating && !previewMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 mb-6"
        >
          <div>
            <Label className="text-black dark:text-white mb-2">Fotograferingsstil</Label>
            <select
              value={settings.style}
              onChange={(e) => setSettings({ ...settings, style: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-black/10 dark:border-white/10 text-black dark:text-white"
            >
              <option value="professional">Professionell fashion</option>
              <option value="editorial">Editorial magasin</option>
              <option value="commercial">Kommersiell reklam</option>
              <option value="artistic">Konstnärlig kreativ</option>
            </select>
          </div>

          <div>
            <Label className="text-black dark:text-white mb-2">Ljussättning</Label>
            <select
              value={settings.lighting}
              onChange={(e) => setSettings({ ...settings, lighting: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-black/10 dark:border-white/10 text-black dark:text-white"
            >
              <option value="studio">Studion (klassiskt)</option>
              <option value="natural">Naturligt ljus</option>
              <option value="dramatic">Dramatiskt (low-key)</option>
              <option value="golden">Golden hour</option>
              <option value="soft">Mjukt diffust</option>
            </select>
          </div>

          <div>
            <Label className="text-black dark:text-white mb-2">Bakgrund</Label>
            <select
              value={settings.background}
              onChange={(e) => setSettings({ ...settings, background: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-black/10 dark:border-white/10 text-black dark:text-white"
            >
              <option value="white">Vit</option>
              <option value="gray">Grå neutral</option>
              <option value="black">Svart</option>
              <option value="gradient">Gradient</option>
              <option value="texture">Texturerad</option>
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={generatePreview}
              variant="outline"
              className="flex-1 border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Förhandsgranska (3 samples)
            </Button>
            <Button
              onClick={generateAllPortraits}
              className="flex-1 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full"
            >
              Generera alla 20
            </Button>
          </div>
        </motion.div>
      )}

      {/* Preview Mode */}
      {previewMode && !generating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="text-center mb-4">
            <p className="text-sm text-black/60 dark:text-white/60 mb-3">
              Förhandsgranskning - {previewSamples[currentPreviewIndex].name}
            </p>
            <div className="aspect-[3/4] max-w-sm mx-auto rounded-xl overflow-hidden bg-black/5 dark:bg-white/5">
              <img
                src={previewImages[previewSamples[currentPreviewIndex].id]}
                alt={previewSamples[currentPreviewIndex].name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {previewSamples.map((sample, idx) => (
                <button
                  key={sample.id}
                  onClick={() => setCurrentPreviewIndex(idx)}
                  className={`h-2 w-8 rounded-full transition-colors ${
                    idx === currentPreviewIndex 
                      ? 'bg-[#0071e3]' 
                      : 'bg-black/20 dark:bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={resetAndGoBack}
              variant="outline"
              className="flex-1 border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
            >
              <X className="h-4 w-4 mr-2" />
              Justera inställningar
            </Button>
            <Button
              onClick={generateAllPortraits}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-full"
            >
              <Check className="h-4 w-4 mr-2" />
              Godkänn & Generera alla
            </Button>
          </div>
        </motion.div>
      )}

      {generating && (
        <div className="space-y-4">
          <div className="relative">
            <div className="h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-[#0071e3]"
              />
            </div>
            <p className="text-center mt-2 text-sm text-black/60 dark:text-white/60">
              Genererar... {Math.round(progress)}% ({completed.length}/20)
            </p>
          </div>

          <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto">
            {modelPrompts.map((model) => (
              <div
                key={model.id}
                className="aspect-square rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center relative"
              >
                {completed.includes(model.id) ? (
                  <>
                    {generatedUrls[model.id] && (
                      <img 
                        src={generatedUrls[model.id]} 
                        alt={model.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-lg">
                      <Check className="h-6 w-6 text-green-600" />
                    </div>
                  </>
                ) : (
                  <Loader2 className="h-6 w-6 text-black/40 dark:text-white/40 animate-spin" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {completed.length === 20 && !generating && (
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-white" />
          </div>
          <h4 className="text-lg font-semibold text-black dark:text-white mb-2">
            Klart!
          </h4>
          <p className="text-sm text-black/60 dark:text-white/60">
            Alla 20 porträtt har genererats
          </p>
        </div>
      )}
    </div>
  );
}