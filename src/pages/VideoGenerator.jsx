import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/amplifyClient';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Image as ImageIcon,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Download,
  Video,
  Zap
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const AccordionSection = ({ id, title, isComplete, children, openSection, setOpenSection }) => (
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

export default function VideoGenerator() {
  const { isAuthenticated, navigateToLogin } = useAuth();
  const [openSection, setOpenSection] = useState('select');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState('3');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedVideo, setGeneratedVideo] = useState(null);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['generated-images'],
    queryFn: () => base44.entities.GeneratedImage.list('-created_date')
  });

  const videoStyles = [
    {
      id: 'zoom_in',
      name: 'Zoom In',
      description: 'Smooth zoom from wide to close-up',
      icon: '🔍',
      prompt: 'Smooth cinematic zoom in effect, starting wide and slowly zooming closer to the subject, maintaining focus and clarity'
    },
    {
      id: 'pan_right',
      name: 'Pan Right',
      description: 'Elegant pan from left to right',
      icon: '➡️',
      prompt: 'Smooth horizontal pan from left to right, cinematic camera movement, maintaining stable framing'
    },
    {
      id: 'dolly',
      name: 'Dolly Forward',
      description: 'Camera moves closer to subject',
      icon: '🎬',
      prompt: 'Cinematic dolly forward movement, camera physically moving closer to the subject, professional smooth motion'
    },
    {
      id: 'orbit',
      name: 'Orbit',
      description: 'Circular movement around subject',
      icon: '🔄',
      prompt: 'Smooth orbital camera movement around the subject, 180 degree arc, cinematic rotation'
    },
    {
      id: 'tilt_up',
      name: 'Tilt Up',
      description: 'Camera tilts upward',
      icon: '⬆️',
      prompt: 'Smooth vertical tilt up, starting from bottom and moving upward, elegant camera movement'
    },
    {
      id: 'parallax',
      name: 'Parallax',
      description: '3D depth effect with layers',
      icon: '🌟',
      prompt: 'Parallax effect with depth layers, foreground and background move at different speeds, 2.5D effect'
    }
  ];

  const handleGenerate = async () => {
    // Require authentication for video generation
    if (!isAuthenticated) {
      navigateToLogin();
      return;
    }

    setGenerating(true);
    setProgress(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const progressInterval = setInterval(() => {
      setProgress(prev => prev >= 90 ? 90 : prev + Math.random() * 10);
    }, 800);

    try {
      // Generate animated video using AI
      const videoPrompt = `Generate a ${selectedDuration} second animated video from this image with the following effect: ${selectedStyle.prompt}. Create smooth, cinematic motion. Output as MP4 video file optimized for social media (9:16 vertical format). High quality, professional animation.`;

      const result = await base44.integrations.Core.GenerateImage({
        prompt: videoPrompt,
        existing_image_urls: [selectedImage.image_url]
      });

      setProgress(100);
      clearInterval(progressInterval);
      
      setGeneratedVideo({
        url: result.url,
        originalImage: selectedImage.image_url,
        style: selectedStyle.name,
        duration: selectedDuration
      });
    } catch (error) {
      console.error('Video generation failed:', error);
      clearInterval(progressInterval);
    } finally {
      setGenerating(false);
    }
  };

  const canGenerate = selectedImage && selectedStyle && selectedDuration;

  return (
    <div className="max-w-[980px] mx-auto px-5 py-20">
      <div className="mb-12">
        <h1 className="text-5xl font-semibold tracking-tight mb-4 text-black dark:text-white">
          Video Generator
        </h1>
        <p className="text-xl text-black/60 dark:text-white/60">Skapa engagerande videos för social media från dina bilder</p>
      </div>

      {!generating && !generatedVideo ? (
        <div className="space-y-4">
          {/* Step 1: Select Image */}
          <AccordionSection 
            id="select" 
            title="1. Välj bild" 
            isComplete={!!selectedImage} 
            openSection={openSection} 
            setOpenSection={setOpenSection}
          >
            <div className="space-y-4">
              <p className="text-sm text-black/60 dark:text-white/60">
                Välj en av dina genererade bilder som bas för videon
              </p>
              
              {isLoading ? (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="aspect-[3/4] rounded-xl bg-[#f5f5f7] dark:bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : images.length === 0 ? (
                <div className="p-8 text-center bg-[#f5f5f7] dark:bg-white/5 rounded-xl">
                  <ImageIcon className="h-12 w-12 text-black/20 dark:text-white/20 mx-auto mb-3" />
                  <p className="text-black/60 dark:text-white/60">Inga bilder finns ännu</p>
                  <p className="text-sm text-black/40 dark:text-white/40 mt-2">Generera en bild först</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {images.filter(img => img.image_url).map((image) => (
                    <button
                      key={image.id}
                      onClick={() => {
                        setSelectedImage(image);
                        setOpenSection('style');
                      }}
                      className={cn(
                        "aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all relative",
                        selectedImage?.id === image.id 
                          ? "border-[#0071e3] ring-2 ring-[#0071e3]/20" 
                          : "border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
                      )}
                    >
                      <img 
                        src={image.image_url} 
                        alt="Generated" 
                        className="w-full h-full object-cover"
                      />
                      {selectedImage?.id === image.id && (
                        <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-[#0071e3] flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </AccordionSection>

          {/* Step 2: Select Style */}
          {selectedImage && (
            <AccordionSection 
              id="style" 
              title="2. Välj videostil" 
              isComplete={!!selectedStyle} 
              openSection={openSection} 
              setOpenSection={setOpenSection}
            >
              <div className="space-y-4">
                <p className="text-sm text-black/60 dark:text-white/60">
                  Välj hur kameran ska röra sig i videon
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {videoStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => {
                        setSelectedStyle(style);
                        setOpenSection('duration');
                      }}
                      className={cn(
                        "p-4 rounded-xl border-2 text-left transition-all",
                        selectedStyle?.id === style.id
                          ? "border-[#0071e3] bg-[#0071e3]/5"
                          : "border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
                      )}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{style.icon}</span>
                        <p className="font-medium text-black dark:text-white">{style.name}</p>
                      </div>
                      <p className="text-sm text-black/60 dark:text-white/60">{style.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </AccordionSection>
          )}

          {/* Step 3: Select Duration */}
          {selectedStyle && (
            <AccordionSection 
              id="duration" 
              title="3. Välj längd" 
              isComplete={!!selectedDuration} 
              openSection={openSection} 
              setOpenSection={setOpenSection}
            >
              <div className="space-y-4">
                <p className="text-sm text-black/60 dark:text-white/60">
                  Välj hur lång videon ska vara (optimerat för social media)
                </p>
                
                <div className="grid grid-cols-3 gap-3">
                  {['3', '5', '7'].map((duration) => (
                    <button
                      key={duration}
                      onClick={() => setSelectedDuration(duration)}
                      className={cn(
                        "p-4 rounded-xl border-2 text-center transition-all",
                        selectedDuration === duration
                          ? "border-[#0071e3] bg-[#0071e3]/5"
                          : "border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
                      )}
                    >
                      <p className="text-2xl font-bold text-black dark:text-white">{duration}s</p>
                      <p className="text-xs text-black/60 dark:text-white/60 mt-1">
                        {duration === '3' ? 'Stories' : duration === '5' ? 'Reels' : 'Extended'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </AccordionSection>
          )}

          {/* Generate Button */}
          {canGenerate && (
            <Button
              onClick={handleGenerate}
              className="w-full bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full py-6 text-lg"
            >
              <Play className="h-5 w-5 mr-2" />
              Generera video
            </Button>
          )}
        </div>
      ) : generating ? (
        <div className="max-w-sm mx-auto py-12 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Video className="h-16 w-16 mx-auto mb-4 text-[#0071e3]" />
          </motion.div>
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-2">
            Genererar video
          </h2>
          <p className="text-black/60 dark:text-white/60 mb-6">
            {selectedStyle.name} effekt • {selectedDuration}s
          </p>
          <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-[#0071e3]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-sm text-black/40 dark:text-white/40 mt-2">{Math.round(progress)}%</p>
        </div>
      ) : generatedVideo ? (
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-black dark:text-white mb-2">Videon är klar!</h2>
          <p className="text-black/60 dark:text-white/60 mb-8">
            {generatedVideo.style} • {generatedVideo.duration} sekunder
          </p>

          <div className="max-w-lg mx-auto mb-6">
            <div className="aspect-[9/16] rounded-2xl overflow-hidden bg-black">
              <img 
                src={generatedVideo.url} 
                alt="Generated animation" 
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-black/60 dark:text-white/60 text-center mt-3">
              Animerad version genererad med {generatedVideo.style}
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => {
                // Download logic here
                console.log('Download video');
              }}
              className="bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Ladda ner
            </Button>
            <Button
              onClick={() => {
                setSelectedImage(null);
                setSelectedStyle(null);
                setSelectedDuration('3');
                setGeneratedVideo(null);
                setOpenSection('select');
              }}
              variant="outline"
              className="border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5 rounded-full"
            >
              <Zap className="h-4 w-4 mr-2" />
              Skapa ny
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}