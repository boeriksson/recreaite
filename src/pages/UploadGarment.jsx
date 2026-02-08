import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/amplifyClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
  Check
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import FileDropzone from '../components/upload/FileDropzone';
import { useLanguage } from '../components/LanguageContext';
import { useAuth } from '@/lib/AuthContext';

export default function UploadGarment() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();
  const { isAuthenticated, isLoadingAuth, navigateToLogin } = useAuth();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const [garmentData, setGarmentData] = useState({
    name: '',
    category: '',
    brand: '',
    sku: ''
  });
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saved, setSaved] = useState(false);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      navigateToLogin();
      navigate('/');
    }
  }, [isAuthenticated, isLoadingAuth, navigateToLogin, navigate]);

  const createGarmentMutation = useMutation({
    mutationFn: (data) => base44.entities.Garment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garments'] });
      setSaved(true);
      setTimeout(() => {
        navigate(createPageUrl('Garments'));
      }, 1500);
    }
  });

  const analyzeGarment = async (imageUrl) => {
    setAnalyzing(true);
    setAiSuggestions(null);
    try {
      // Always generate description in Swedish for consistency
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: 'Analysera detta plagg och ge detaljerad information på svenska. Beskriv vad det är för typ av plagg, föreslå en passande kategori, och ge en kort produktbeskrivning (max 2 meningar) som passar för e-handel.',
        file_urls: [imageUrl],
        response_json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Kort produktnamn på svenska, t.ex. "Svart Blazer" eller "Blå Jeans"' },
            category: { type: 'string', enum: ['tops', 'bottoms', 'dresses', 'outerwear', 'accessories'] },
            description: { type: 'string', description: 'Kort, säljande beskrivning av plagget på svenska (max 2 meningar) för e-handel' },
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
        setAiSuggestions({ error: t.aiCouldNotIdentify });
      }
    } catch (error) {
      console.error('AI analys misslyckades:', error);
      setAiSuggestions({ error: t.couldNotAnalyze });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileSelect = async (selectedFile) => {
    if (!isAuthenticated) {
      navigateToLogin();
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);

    setAiSuggestions(null);

    setUploading(true);
    try {
      // Upload original image
      const { file_url: originalUrl } = await base44.integrations.Core.UploadFile({ file: selectedFile });

      // Generate flatlay image
      const flatlayResult = await base44.integrations.Core.GenerateImage({
        prompt: 'Create a professional flatlay product photography of this garment on a clean white background. The garment should be laid flat, well-lit, wrinkle-free, centered in frame with even lighting and shadows. Professional e-commerce product photography style.',
        existing_image_urls: [originalUrl]
      });

      setUploadedUrl(flatlayResult.url);

      // Analyze garment automatically using the flatlay image
      await analyzeGarment(flatlayResult.url);

      // Store both URLs in state for later saving
      setGarmentData(prev => ({
        ...prev,
        original_image_url: originalUrl
      }));
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!uploadedUrl || !garmentData.name) return;

    await createGarmentMutation.mutateAsync({
      ...garmentData,
      image_url: uploadedUrl,
      original_image_url: garmentData.original_image_url,
      ai_description: aiSuggestions?.description || ''
    });
  };

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#392599]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-20">
      <div className="mb-12">
        <h1 className="text-5xl font-semibold tracking-tight mb-4 text-black dark:text-white">
          {t.uploadGarmentPage}
        </h1>
        <p className="text-xl text-black/60 dark:text-white/60">{t.addNewGarmentToLibrary}</p>
      </div>

      {saved ? (
        <div className="text-center py-12">
          <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-2">{t.garmentSaved}</h2>
          <p className="text-black/60 dark:text-white/60">{t.redirectingToGarments}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upload Section */}
          <div className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-black dark:text-white mb-4">1. {t.selectImage}</h2>
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
          </div>

          {/* Details Section */}
          {uploadedUrl && (
            <div className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-black dark:text-white mb-4">2. {t.garmentInformation}</h2>

              <div className="space-y-4">
                {/* AI Analysis Status */}
                {analyzing && (
                  <div className="p-4 bg-[#392599]/10 border border-[#392599]/30 rounded-xl flex items-center gap-3">
                    <Loader2 className="h-5 w-5 text-[#392599] animate-spin" />
                    <div>
                      <p className="text-sm font-medium text-black dark:text-white">{t.aiAnalyzingGarment}</p>
                      <p className="text-xs text-black/60 dark:text-white/60">{t.suggestingCategoryName}</p>
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
                          {aiSuggestions.error ? t.analysisError : t.aiSuggestions}
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
                        {t.tryAgain}
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
                              <p className="text-green-600 dark:text-green-400">{t.style}</p>
                              <p className="text-black dark:text-white capitalize">{aiSuggestions.style}</p>
                            </div>
                          )}
                          {aiSuggestions.category && (
                            <div className="p-2 bg-white/60 dark:bg-black/20 rounded">
                              <p className="text-green-600 dark:text-green-400">{t.category}</p>
                              <p className="text-black dark:text-white capitalize">{aiSuggestions.category}</p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div>
                  <Label className="text-black/80 dark:text-white/80">{t.name} *</Label>
                  <Input
                    value={garmentData.name}
                    onChange={(e) => setGarmentData({ ...garmentData, name: e.target.value })}
                    placeholder={language === 'sv' ? 'T.ex. Svart Blazer' : 'E.g. Black Blazer'}
                    className="mt-2 bg-[#f5f5f7] border-black/10 text-black dark:bg-white/5 dark:border-white/10 dark:text-white"
                  />
                </div>

                <div>
                  <Label className="text-black/80 dark:text-white/80">{t.category}</Label>
                  <select
                    value={garmentData.category}
                    onChange={(e) => setGarmentData({ ...garmentData, category: e.target.value })}
                    className="w-full mt-2 px-3 py-2 rounded-lg bg-[#f5f5f7] border border-black/10 text-black dark:bg-white/5 dark:border-white/10 dark:text-white"
                  >
                    <option value="">{t.selectCategory}</option>
                    <option value="tops">{t.tops}</option>
                    <option value="bottoms">{t.bottoms}</option>
                    <option value="dresses">{t.dresses}</option>
                    <option value="outerwear">{t.outerwear}</option>
                    <option value="accessories">{t.accessories}</option>
                  </select>
                </div>

                <div>
                  <Label className="text-black/80 dark:text-white/80">{t.brand}</Label>
                  <Input
                    value={garmentData.brand}
                    onChange={(e) => setGarmentData({ ...garmentData, brand: e.target.value })}
                    placeholder={t.optional}
                    className="mt-2 bg-[#f5f5f7] border-black/10 text-black dark:bg-white/5 dark:border-white/10 dark:text-white"
                  />
                </div>

                <div>
                  <Label className="text-black/80 dark:text-white/80">{t.sku}</Label>
                  <Input
                    value={garmentData.sku}
                    onChange={(e) => setGarmentData({ ...garmentData, sku: e.target.value })}
                    placeholder={t.optional}
                    className="mt-2 bg-[#f5f5f7] border-black/10 text-black dark:bg-white/5 dark:border-white/10 dark:text-white"
                  />
                </div>

                <Button
                  onClick={handleSave}
                  disabled={!garmentData.name || createGarmentMutation.isPending}
                  className="w-full bg-[#392599] hover:bg-[#4a2fb3] text-white rounded-full py-6 text-lg"
                >
                  {createGarmentMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {t.saving}
                    </>
                  ) : (
                    t.saveGarment
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
