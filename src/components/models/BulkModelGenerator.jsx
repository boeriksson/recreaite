import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from "@/components/ui/button";
import { SignedImage } from "@/components/ui/SignedImage";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Sparkles, Loader2, Check, Edit3 } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function BulkModelGenerator({ onClose, onSave, darkMode }) {
  const { isAuthenticated, navigateToLogin } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [editingModel, setEditingModel] = useState(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [abortController, setAbortController] = useState(null);

  const generateRandomModels = async () => {
    // Require authentication for image generation
    if (!isAuthenticated) {
      navigateToLogin();
      return;
    }

    setGenerating(true);
    const controller = new AbortController();
    setAbortController(controller);
    
    try {
      for (let i = 0; i < 10; i++) {
        if (controller.signal.aborted) {
          break;
        }
        const genders = ['female', 'male', 'neutral'];
        const ethnicities = ['caucasian', 'african', 'asian', 'hispanic', 'middle-eastern', 'mixed'];
        const bodyTypes = ['slim', 'athletic', 'average', 'curvy', 'plus-size'];
        const hairColors = ['blonde', 'brunette', 'black', 'red'];
        const ages = [22, 25, 28, 30, 35, 40];

        const gender = genders[Math.floor(Math.random() * genders.length)];
        const ethnicity = ethnicities[Math.floor(Math.random() * ethnicities.length)];
        const bodyType = bodyTypes[Math.floor(Math.random() * bodyTypes.length)];
        const hairColor = hairColors[Math.floor(Math.random() * hairColors.length)];
        const age = ages[Math.floor(Math.random() * ages.length)];

        const genderText = gender === 'female' ? 'female' : gender === 'male' ? 'male' : 'androgynous';
        
        // Portrait - face only
        const portraitPrompt = `Professional studio portrait photography of ${genderText} model, ${age} years old, ${ethnicity} ethnicity, ${hairColor} hair. Close-up face portrait, shoulders visible wearing white clothing. Shot with Hasselblad 50mm f1.2 lens. Studio lighting setup with key light, fill light and rim light. Light gray seamless background. High-end fashion photography. Extremely sharp focus on eyes. Professional makeup and styling. Natural confident expression.`;
        
        const portraitResult = await base44.integrations.Core.GenerateImage({
          prompt: `${portraitPrompt} 4:5 aspect ratio, portrait orientation.`
        });

        // Full body - with white clothes
        const fullBodyPrompt = `Professional studio fashion photography of ${genderText} model, ${age} years old, ${ethnicity} ethnicity, ${bodyType} body type, ${hairColor} hair. Full body shot wearing elegant white clothing. Shot with Hasselblad 50mm f1.2 lens. Studio lighting setup with key light, fill light and rim light. Light gray seamless background. High-end fashion photography. Professional styling. Confident pose.`;
        
        const fullBodyResult = await base44.integrations.Core.GenerateImage({
          prompt: `${fullBodyPrompt} 4:5 aspect ratio, portrait orientation.`
        });

        const newModel = {
          id: `temp-${i}`,
          name: `Model ${i + 1}`,
          gender,
          age,
          ethnicity,
          body_type: bodyType,
          hair_color: hairColor,
          portraitUrl: portraitResult.url,
          fullBodyUrl: fullBodyResult.url,
          prompt: fullBodyPrompt
        };
        
        // Add model immediately when generated
        setModels(prev => [...prev, newModel]);
        setSelectedModels(prev => [...prev, newModel.id]);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Generation failed:', error);
      }
    } finally {
      setGenerating(false);
      setAbortController(null);
    }
  };

  const handleAbort = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  const handleEditModel = async (model) => {
    if (!editPrompt.trim()) return;
    
    setGenerating(true);
    try {
      const modifiedPrompt = `${model.prompt}. ${editPrompt}`;
      
      const portraitResult = await base44.integrations.Core.GenerateImage({
        prompt: `${modifiedPrompt.replace('full body', 'headshot portrait')} 4:5 aspect ratio, portrait orientation.`
      });
      
      const fullBodyResult = await base44.integrations.Core.GenerateImage({
        prompt: `${modifiedPrompt} 4:5 aspect ratio, portrait orientation.`
      });

      setModels(prev => prev.map(m => 
        m.id === model.id 
          ? { ...m, portraitUrl: portraitResult.url, fullBodyUrl: fullBodyResult.url, prompt: modifiedPrompt }
          : m
      ));
      
      setEditingModel(null);
      setEditPrompt('');
    } catch (error) {
      console.error('Edit failed:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveSelected = async () => {
    const selected = models.filter(m => selectedModels.includes(m.id));
    
    for (const model of selected) {
      await base44.entities.Model.create({
        name: model.name,
        gender: model.gender,
        age: model.age,
        ethnicity: model.ethnicity,
        body_type: model.body_type,
        hair_color: model.hair_color,
        portrait_url: model.portraitUrl,
        full_body_url: model.fullBodyUrl,
        image_url: model.portraitUrl,
        prompt: model.prompt
      });
    }
    
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${darkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-black/10'} rounded-3xl max-w-7xl w-full border my-8`}
      >
        <div className={`sticky top-0 ${darkMode ? 'bg-[#1a1a1a]' : 'bg-white'} border-b ${darkMode ? 'border-white/10' : 'border-black/10'} p-6 flex items-center justify-between rounded-t-3xl`}>
          <h2 className="text-2xl font-semibold">Generera 10 slumpmässiga modeller</h2>
          <button
            onClick={onClose}
            className={`p-2 ${darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'} rounded-full transition-colors`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {models.length === 0 && !generating ? (
            <div className="text-center py-12">
              <Sparkles className={`h-16 w-16 ${darkMode ? 'text-white/20' : 'text-black/20'} mx-auto mb-4`} />
              <p className={`${darkMode ? 'text-white/60' : 'text-black/60'} mb-6`}>
                Generera 10 unika modeller med AI
              </p>
              <Button
                onClick={generateRandomModels}
                disabled={generating}
                className="bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full px-8"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generera 10 modeller
              </Button>
            </div>
          ) : (
            <>
              {generating && (
                <div className="mb-4 p-4 bg-[#0071e3]/10 border border-[#0071e3]/30 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 text-[#0071e3] animate-spin" />
                    <div>
                      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                        Genererar modeller...
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-white/60' : 'text-black/60'}`}>
                        {models.length} av 10 klara
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleAbort}
                    variant="outline"
                    size="sm"
                    className="border-red-500/50 text-red-600 hover:bg-red-500/10"
                  >
                    Avbryt generering
                  </Button>
                </div>
              )}

              <div className="grid md:grid-cols-5 gap-4 mb-6">
                {models.map((model) => (
                  <div
                    key={model.id}
                    className={cn(
                      "relative rounded-2xl border-2 overflow-hidden transition-all cursor-pointer",
                      selectedModels.includes(model.id)
                        ? "border-[#0071e3] ring-2 ring-[#0071e3]/20"
                        : darkMode ? "border-white/10" : "border-black/10"
                    )}
                    onClick={() => {
                      setSelectedModels(prev =>
                        prev.includes(model.id)
                          ? prev.filter(id => id !== model.id)
                          : [...prev, model.id]
                      );
                    }}
                  >
                    {selectedModels.includes(model.id) && (
                      <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-[#0071e3] flex items-center justify-center z-10">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-1">
                      <SignedImage src={model.portraitUrl} alt="Portrait" className="w-full aspect-[3/4] object-cover" />
                      <SignedImage src={model.fullBodyUrl} alt="Full body" className="w-full aspect-[3/4] object-cover" />
                    </div>

                    <div className={`p-2 ${darkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
                      <Input
                        value={model.name}
                        onChange={(e) => {
                          e.stopPropagation();
                          setModels(prev => prev.map(m => 
                            m.id === model.id ? { ...m, name: e.target.value } : m
                          ));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-xs h-7 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
                      />
                      
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingModel(model.id);
                        }}
                        size="sm"
                        variant="ghost"
                        className="w-full mt-1 text-xs h-6"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Redigera
                      </Button>
                    </div>

                    {editingModel === model.id && (
                      <div 
                        className={`absolute inset-0 ${darkMode ? 'bg-[#1a1a1a]' : 'bg-white'} p-3 flex flex-col`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Textarea
                          value={editPrompt}
                          onChange={(e) => setEditPrompt(e.target.value)}
                          placeholder="T.ex. 'längre hår', 'äldre', 'mer muskulös'"
                          className={`flex-1 text-xs ${darkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
                        />
                        <div className="flex gap-1 mt-2">
                          <Button
                            onClick={() => handleEditModel(model)}
                            disabled={!editPrompt.trim() || generating}
                            size="sm"
                            className="flex-1 bg-[#0071e3] text-white h-7 text-xs"
                          >
                            OK
                          </Button>
                          <Button
                            onClick={() => {
                              setEditingModel(null);
                              setEditPrompt('');
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                          >
                            Avbryt
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {!generating && (
                <div className="flex justify-end gap-3">
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className={`rounded-full ${darkMode ? 'border-white/10 hover:bg-white/10' : 'border-black/10 hover:bg-black/5'}`}
                  >
                    Stäng
                  </Button>
                  <Button
                    onClick={handleSaveSelected}
                    disabled={selectedModels.length === 0}
                    className="bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full"
                  >
                    Spara {selectedModels.length} modeller
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}