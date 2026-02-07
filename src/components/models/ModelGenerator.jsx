import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from "@/components/ui/button";
import { SignedImage } from "@/components/ui/SignedImage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Sparkles, Loader2, ChevronDown, Lightbulb, Upload, Image as ImageIcon } from 'lucide-react';

export default function ModelGenerator({ onClose, onSave, darkMode }) {
  const { isAuthenticated, navigateToLogin } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [portraitImage, setPortraitImage] = useState(null);
  const [showExpert, setShowExpert] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [referenceImages, setReferenceImages] = useState([]);
  const [uploadingReference, setUploadingReference] = useState(false);
  
  const [modelData, setModelData] = useState({
    name: '',
    gender: 'female',
    age: 25,
    ethnicity: 'caucasian',
    body_type: 'athletic',
    hair_style: 'long straight',
    hair_color: 'brunette',
    skin_tone: 'light',
    height: 175
  });

  const handleReferenceUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingReference(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }
      setReferenceImages([...referenceImages, ...uploadedUrls]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploadingReference(false);
    }
  };

  const removeReferenceImage = (url) => {
    setReferenceImages(referenceImages.filter(img => img !== url));
  };

  const handleGenerate = async () => {
    // Require authentication for image generation
    if (!isAuthenticated) {
      navigateToLogin();
      return;
    }

    setGenerating(true);
    try {
      const genderText = modelData.gender === 'female' ? 'female' : modelData.gender === 'male' ? 'male' : 'androgynous';
      
      // Use custom prompt if provided, otherwise use standard attributes
      let portraitPrompt;
      
      if (customPrompt.trim()) {
        // Expert mode - use custom prompt
        portraitPrompt = `Professional fashion model headshot portrait. ${customPrompt}. ${referenceImages.length > 0 ? 'CRITICAL: Replicate the exact facial features, face structure, and appearance from the reference image(s).' : ''} Close-up headshot showing ONLY face, neck, and upper shoulders. Light grey studio background. Professional studio lighting with soft key light and fill light. High-end fashion photography. Confident expression, looking at camera. No clothing visible in frame - crop shows only head and neck area.`;
      } else {
        // Standard mode - use form attributes
        portraitPrompt = `Professional fashion model headshot portrait, ${genderText}, ${modelData.age} years old, ${modelData.ethnicity} ethnicity, ${modelData.body_type} body type, ${modelData.hair_color} ${modelData.hair_style} hair, ${modelData.skin_tone} skin tone. ${referenceImages.length > 0 ? 'CRITICAL: Replicate the exact facial features, face structure, and appearance from the reference image(s).' : ''} Close-up headshot showing ONLY face, neck, and upper shoulders. Light grey studio background. Professional studio lighting with soft key light and fill light. High-end fashion photography. Confident expression, looking at camera. No clothing visible in frame - crop shows only head and neck area.`;
      }
      
      console.log('Generating portrait...');
      const portraitResult = await base44.integrations.Core.GenerateImage({
        prompt: `${portraitPrompt} 4:5 aspect ratio, portrait orientation.`,
        existing_image_urls: referenceImages.length > 0 ? referenceImages : undefined
      });
      
      if (!portraitResult?.url) {
        throw new Error('Portrait generation failed - no URL returned');
      }
      
      console.log('Portrait generated:', portraitResult.url);
      setPortraitImage(portraitResult.url);
    } catch (error) {
      console.error('Generation failed:', error);
      alert(`Fel vid generering: ${error.message}. Försök igen eller kontrollera konsolen för mer information.`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!modelData.name.trim()) {
      alert('Vänligen ange ett namn för modellen');
      return;
    }

    try {
      const genderText = modelData.gender === 'female' ? 'female' : modelData.gender === 'male' ? 'male' : 'androgynous';
      const prompt = `Professional fashion model, ${genderText}, ${modelData.age} years old, ${modelData.ethnicity} ethnicity, ${modelData.body_type} body type, ${modelData.hair_color} ${modelData.hair_style} hair, ${modelData.skin_tone} skin tone, ${modelData.height}cm tall`;

      await base44.entities.Model.create({
        ...modelData,
        portrait_url: portraitImage || '',
        image_url: portraitImage || '',
        prompt: prompt
      });
      
      onSave();
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${darkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-black/10'} rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border`}
      >
        <div className={`sticky top-0 ${darkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-black/10'} border-b p-6 flex items-center justify-between`}>
          <h2 className="text-2xl font-semibold">Skapa modell</h2>
          <button
            onClick={onClose}
            className={`p-2 ${darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'} rounded-full transition-colors`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            {/* Reference Images Upload */}
            <div className={`p-4 rounded-xl border-2 border-dashed transition-colors ${
              darkMode ? 'border-white/20 bg-white/5' : 'border-black/20 bg-black/5'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Label className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                    <ImageIcon className="h-4 w-4" />
                    Referensbilder (Valfritt)
                  </Label>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>
                    Ladda upp bilder på ansikten eller stilar att basera modellen på
                  </p>
                </div>
                <label className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  darkMode ? 'bg-[#0071e3] hover:bg-[#0077ED]' : 'bg-[#0071e3] hover:bg-[#0077ED]'
                } text-white`}>
                  {uploadingReference ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-3 w-3 inline mr-1" />
                      Ladda upp
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleReferenceUpload}
                    className="hidden"
                    disabled={uploadingReference}
                  />
                </label>
              </div>
              
              {referenceImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {referenceImages.map((url, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden">
                      <SignedImage src={url} alt={`Reference ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeReferenceImage(url)}
                        className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className={darkMode ? 'text-white/80' : 'text-black/80'}>Namn</Label>
              <Input
                value={modelData.name}
                onChange={(e) => setModelData({ ...modelData, name: e.target.value })}
                placeholder="T.ex. Anna Nordic"
                className={`mt-2 ${darkMode ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40' : 'bg-[#f5f5f7] border-black/10 text-black'}`}
              />
            </div>

            <div>
              <Label className={darkMode ? 'text-white/80' : 'text-black/80'}>Kön</Label>
              <Select
                value={modelData.gender}
                onValueChange={(value) => setModelData({ ...modelData, gender: value })}
              >
                <SelectTrigger className={`mt-2 ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-[#f5f5f7] border-black/10 text-black'}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Kvinna</SelectItem>
                  <SelectItem value="male">Man</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className={darkMode ? 'text-white/80' : 'text-black/80'}>Ålder: {modelData.age}</Label>
              <Slider
                value={[modelData.age]}
                onValueChange={([value]) => setModelData({ ...modelData, age: value })}
                min={18}
                max={60}
                step={1}
                className="mt-3"
              />
            </div>

            <div>
              <Label className={darkMode ? 'text-white/80' : 'text-black/80'}>Etnicitet</Label>
              <Select
                value={modelData.ethnicity}
                onValueChange={(value) => setModelData({ ...modelData, ethnicity: value })}
              >
                <SelectTrigger className={`mt-2 ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-[#f5f5f7] border-black/10 text-black'}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="caucasian">Kaukasisk</SelectItem>
                  <SelectItem value="african">Afrikansk</SelectItem>
                  <SelectItem value="asian">Asiatisk</SelectItem>
                  <SelectItem value="hispanic">Latinamerikansk</SelectItem>
                  <SelectItem value="middle-eastern">Mellanöstern</SelectItem>
                  <SelectItem value="mixed">Blandad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className={darkMode ? 'text-white/80' : 'text-black/80'}>Kroppstyp</Label>
              <Select
                value={modelData.body_type}
                onValueChange={(value) => setModelData({ ...modelData, body_type: value })}
              >
                <SelectTrigger className={`mt-2 ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-[#f5f5f7] border-black/10 text-black'}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slim">Smal</SelectItem>
                  <SelectItem value="athletic">Atletisk</SelectItem>
                  <SelectItem value="average">Genomsnittlig</SelectItem>
                  <SelectItem value="curvy">Kurvig</SelectItem>
                  <SelectItem value="plus-size">Plus-size</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className={darkMode ? 'text-white/80' : 'text-black/80'}>Hårfärg</Label>
              <Select
                value={modelData.hair_color}
                onValueChange={(value) => setModelData({ ...modelData, hair_color: value })}
              >
                <SelectTrigger className={`mt-2 ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-[#f5f5f7] border-black/10 text-black'}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blonde">Blond</SelectItem>
                  <SelectItem value="brunette">Brunett</SelectItem>
                  <SelectItem value="black">Svart</SelectItem>
                  <SelectItem value="red">Röd</SelectItem>
                  <SelectItem value="gray">Grå</SelectItem>
                  <SelectItem value="colored">Färgat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className={darkMode ? 'text-white/80' : 'text-black/80'}>Hårstil</Label>
              <Input
                value={modelData.hair_style}
                onChange={(e) => setModelData({ ...modelData, hair_style: e.target.value })}
                placeholder="T.ex. långt rakt"
                className={`mt-2 ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-[#f5f5f7] border-black/10 text-black'}`}
              />
            </div>

            <div>
              <Label className={darkMode ? 'text-white/80' : 'text-black/80'}>Hudton</Label>
              <Select
                value={modelData.skin_tone}
                onValueChange={(value) => setModelData({ ...modelData, skin_tone: value })}
              >
                <SelectTrigger className={`mt-2 ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-[#f5f5f7] border-black/10 text-black'}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fair">Ljus</SelectItem>
                  <SelectItem value="light">Mellanljus</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="tan">Solbränd</SelectItem>
                  <SelectItem value="dark">Mörk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className={darkMode ? 'text-white/80' : 'text-black/80'}>Längd: {modelData.height} cm</Label>
              <Slider
                value={[modelData.height]}
                onValueChange={([value]) => setModelData({ ...modelData, height: value })}
                min={150}
                max={200}
                step={1}
                className="mt-3"
              />
            </div>

            {/* Expert Mode Toggle */}
            <div className={`border-t pt-6 ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
              <button
                onClick={() => setShowExpert(!showExpert)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                  darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-[#0071e3]" />
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                    Expert-läge
                  </span>
                </div>
                <ChevronDown 
                  className={`h-5 w-5 transition-transform ${
                    showExpert ? 'rotate-180' : ''
                  } ${darkMode ? 'text-white/60' : 'text-black/60'}`}
                />
              </button>

              <AnimatePresence>
                {showExpert && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4">
                      <Label className={darkMode ? 'text-white/80' : 'text-black/80'}>
                        Egen prompt för specifik modelllook
                      </Label>
                      <Textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="T.ex. 'Swedish female model, 28 years old, platinum blonde pixie cut, piercing blue eyes, high cheekbones, tall and lean, athletic build, minimal makeup, confident and edgy look'"
                        className={`mt-2 min-h-[120px] ${darkMode ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40' : 'bg-[#f5f5f7] border-black/10 text-black placeholder:text-black/40'}`}
                      />
                      <p className={`text-xs mt-2 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>
                        💡 Beskriv modellen så specifikt som möjligt för bästa resultat. Detta kommer att ersätta de valda attributen ovan.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div className={`aspect-[3/4] rounded-2xl ${darkMode ? 'bg-[#2a2a2a]' : 'bg-[#e8e8e8]'} overflow-hidden`}>
              {portraitImage ? (
                <img 
                  src={portraitImage} 
                  alt="Portrait"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Sparkles className={`h-8 w-8 ${darkMode ? 'text-white/20' : 'text-black/20'} mx-auto mb-2`} />
                    <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-black/40'}`}>Headshot</p>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Genererar...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generera förhandsvisning
                </>
              )}
            </Button>
          </div>
        </div>

        <div className={`border-t ${darkMode ? 'border-white/10' : 'border-black/10'} p-6 flex justify-end gap-3`}>
          <Button
            onClick={onClose}
            variant="outline"
            className={`rounded-full ${darkMode ? 'border-white/10 hover:bg-white/10 text-white' : 'border-black/10 hover:bg-black/5'}`}
          >
            Avbryt
          </Button>
          <Button
            onClick={handleSave}
            disabled={!modelData.name.trim() || !portraitImage}
            className="bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full"
          >
            Spara modell
          </Button>
        </div>
      </motion.div>
    </div>
  );
}