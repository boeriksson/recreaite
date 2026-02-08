import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/amplifyClient';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Sparkles, 
  Search, 
  Loader2, 
  CheckCircle2,
  Image as ImageIcon,
  Globe,
  Trash2,
  Save
} from 'lucide-react';
import { cn } from "@/lib/utils";
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

export default function SiteScanner() {
  const queryClient = useQueryClient();
  const [domain, setDomain] = useState('');
  const [scanning, setScanning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [currentGenerating, setCurrentGenerating] = useState(0);
  const [deleteId, setDeleteId] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedSeeds, setSelectedSeeds] = useState([]);

  const { data: seeds = [], isLoading: seedsLoading } = useQuery({
    queryKey: ['brand-seeds'],
    queryFn: () => base44.entities.BrandSeed.list('-created_date')
  });

  const createGarmentMutation = useMutation({
    mutationFn: (data) => base44.entities.Garment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garments'] });
    }
  });

  const createGeneratedImageMutation = useMutation({
    mutationFn: (data) => base44.entities.GeneratedImage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-images'] });
    }
  });

  const createBrandSeedMutation = useMutation({
    mutationFn: (data) => base44.entities.BrandSeed.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-seeds'] });
      setScannedData(null);
      setDomain('');
    }
  });

  const deleteBrandSeedMutation = useMutation({
    mutationFn: (id) => base44.entities.BrandSeed.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-seeds'] });
      setDeleteId(null);
    }
  });

  const handleScan = async () => {
    if (!domain.trim()) return;
    
    setScanning(true);
    setScannedData(null);
    setGeneratedImages([]);
    
    try {
      // Scan the site with AI - detailed analysis
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Perform a comprehensive visual brand identity analysis for this e-commerce fashion website: ${domain}

ANALYZE THE FOLLOWING:

1. BASIC IDENTITY:
   - Brand style: Overall aesthetic in 1-2 sentences
   - Character: Choose ONE from: luxury, minimalist, urban, sporty, bohemian, classic, edgy, casual
   - Model gender: Typical model gender (female/male/neutral)
   - Environment: ONE typical setting from: studio, urban_street, minimalist_interior, nature, cafe, rooftop, beach, industrial, ugc

2. OVERALL STYLE SUMMARY (1 paragraph):
   - A concise, comprehensive description of the brand's complete visual identity that could be used as a reference for replicating their style. Include key visual elements, mood, and target aesthetic.

3. TYPOGRAPHY & FONTS (2-3 sentences):
   - Font families or styles used (serif, sans-serif, modern, classic, etc.)
   - Typography hierarchy and text treatment
   - How typography contributes to brand identity

4. IMAGE STYLE & COMPOSITION (2-3 sentences):
   - Image cropping and framing patterns (full body, close-up, lifestyle shots, etc.)
   - Composition rules (rule of thirds, centered, negative space, etc.)
   - Image editing style (natural, high contrast, vintage, etc.)

5. DETAILED VISUAL ANALYSIS (2-3 paragraphs):
   - Photography techniques and composition style
   - Lighting and mood
   - Overall visual consistency
   - Target audience perception

6. COLOR PALETTE:
   - Describe the main colors used (2-3 sentences)
   - Tone and color psychology

7. PHOTOGRAPHY STYLE (2-3 sentences):
   - Technical approach (editorial, commercial, lifestyle, etc.)
   - Distinctive visual elements

8. RECOMMENDATIONS (3-4 actionable points):
   - How to replicate their style
   - Key elements to maintain consistency
   - Best practices for their aesthetic

9. STRENGTHS (2-3 points):
   - What works well in their visual communication
   - Competitive advantages

10. WEAKNESSES/OPPORTUNITIES (2-3 points):
   - Areas for potential improvement
   - Opportunities to enhance visual impact

Be specific, professional, and actionable in your analysis.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            brand_style: {
              type: "string",
              description: "Overall brand aesthetic and style in 1-2 sentences"
            },
            overall_style_summary: {
              type: "string",
              description: "Comprehensive single-paragraph summary of complete visual identity"
            },
            character: {
              type: "string",
              enum: ["luxury", "minimalist", "urban", "sporty", "bohemian", "classic", "edgy", "casual"],
              description: "Brand character that best matches"
            },
            typical_gender: {
              type: "string",
              enum: ["female", "male", "neutral"],
              description: "Typical model gender used"
            },
            environment: {
              type: "string",
              enum: ["studio", "urban_street", "minimalist_interior", "nature", "cafe", "rooftop", "beach", "industrial", "ugc"],
              description: "Typical photography environment"
            },
            typography: {
              type: "string",
              description: "Typography and font style analysis"
            },
            image_style: {
              type: "string",
              description: "Image composition, cropping, and editing style"
            },
            visual_analysis: {
              type: "string",
              description: "Detailed 2-3 paragraph analysis of visual identity"
            },
            color_palette: {
              type: "string",
              description: "Description of main colors and color psychology"
            },
            photography_style: {
              type: "string",
              description: "Technical photography style description"
            },
            recommendations: {
              type: "string",
              description: "3-4 actionable recommendations for replicating style"
            },
            strengths: {
              type: "string",
              description: "2-3 visual communication strengths"
            },
            weaknesses: {
              type: "string",
              description: "2-3 areas for improvement"
            },
            product_count: {
              type: "number",
              description: "Estimated number of products"
            }
          }
        }
      });
      
      setScannedData(result);
    } catch (error) {
      console.error('Scanning failed:', error);
    } finally {
      setScanning(false);
    }
  };

  const handleSaveSeed = async () => {
    if (!scannedData) return;
    
    try {
      await createBrandSeedMutation.mutateAsync({
        name: `${domain} Seed`,
        domain: domain,
        brand_style: scannedData.brand_style,
        character: scannedData.character,
        typical_gender: scannedData.typical_gender,
        environment: scannedData.environment,
        visual_analysis: scannedData.visual_analysis || '',
        recommendations: scannedData.recommendations || '',
        strengths: scannedData.strengths || '',
        weaknesses: scannedData.weaknesses || '',
        color_palette: scannedData.color_palette || '',
        photography_style: scannedData.photography_style || '',
        overall_style_summary: scannedData.overall_style_summary || '',
        typography: scannedData.typography || '',
        image_style: scannedData.image_style || ''
      });
    } catch (error) {
      console.error('Failed to save brand seed:', error);
    }
  };

  const toggleSeedSelection = (seedId) => {
    setSelectedSeeds(prev => 
      prev.includes(seedId) 
        ? prev.filter(id => id !== seedId)
        : [...prev, seedId].slice(0, 3) // Max 3 for comparison
    );
  };

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#f5f5f7] dark:bg-black rounded-2xl p-6 sm:p-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-[#392599] flex items-center justify-center">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white">AI Site Scanner</h3>
            <p className="text-sm text-black/60 dark:text-white/60">Analysera en e-commerce-sajt och skapa varumärkesseed</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="exempel.com eller www.exempel.com"
            className="flex-1 bg-white dark:bg-white/10 border-black/10 dark:border-white/20 text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:border-[#392599]"
            disabled={scanning || generating}
          />
          <Button
            onClick={handleScan}
            disabled={!domain.trim() || scanning || generating}
            className="bg-[#392599] hover:bg-[#4a2fb3] text-white font-medium rounded-full"
          >
            {scanning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Skannar...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Skanna
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Saved Seeds */}
      {seeds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#f5f5f7] dark:bg-black rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black dark:text-white">Sparade Seeds</h3>
            {seeds.length > 1 && (
              <Button
                onClick={() => {
                  setCompareMode(!compareMode);
                  if (!compareMode) setSelectedSeeds([]);
                }}
                variant="outline"
                size="sm"
                className={cn(
                  "text-xs",
                  compareMode ? "bg-[#392599] text-white border-[#392599]" : "border-black/10 dark:border-white/10 text-black dark:text-white"
                )}
              >
                {compareMode ? 'Avsluta jämförelse' : 'Jämför seeds'}
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {seeds.map((seed) => (
              <div
                key={seed.id}
                onClick={() => compareMode && toggleSeedSelection(seed.id)}
                className={cn(
                  "flex items-center justify-between p-4 bg-white dark:bg-white/10 rounded-xl border transition-all",
                  compareMode 
                    ? selectedSeeds.includes(seed.id)
                      ? "border-[#392599] bg-[#392599]/5 cursor-pointer"
                      : "border-black/10 dark:border-white/10 hover:border-[#392599]/50 cursor-pointer"
                    : "border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20"
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-black dark:text-white font-medium">{seed.name}</h4>
                    <span className="px-2 py-0.5 bg-[#392599]/20 text-[#392599] text-xs rounded-full capitalize">
                      {seed.character}
                    </span>
                  </div>
                  <p className="text-sm text-black/60 dark:text-white/60">{seed.domain}</p>
                </div>
                {!compareMode && (
                  <Button
                    onClick={() => setDeleteId(seed.id)}
                    variant="ghost"
                    size="icon"
                    className="text-black/40 dark:text-white/40 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {compareMode && selectedSeeds.length > 0 && (
            <p className="text-xs text-black/50 dark:text-white/50 mt-3">
              {selectedSeeds.length} seed(s) valda (max 3)
            </p>
          )}
        </motion.div>
      )}

      {/* Comparison View */}
      {compareMode && selectedSeeds.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-black/10 dark:border-white/10"
        >
          <h3 className="text-lg font-semibold text-black dark:text-white mb-6">Jämförelse av Seeds</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedSeeds.map(seedId => {
              const seed = seeds.find(s => s.id === seedId);
              if (!seed) return null;
              return (
                <div key={seed.id} className="space-y-4">
                  <div className="pb-3 border-b border-black/10 dark:border-white/10">
                    <h4 className="font-semibold text-black dark:text-white">{seed.name}</h4>
                    <p className="text-xs text-black/50 dark:text-white/50">{seed.domain}</p>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-black/40 dark:text-white/40 uppercase tracking-wide mb-1">Karaktär</p>
                      <p className="text-black dark:text-white capitalize">{seed.character}</p>
                    </div>
                    <div>
                      <p className="text-xs text-black/40 dark:text-white/40 uppercase tracking-wide mb-1">Miljö</p>
                      <p className="text-black dark:text-white capitalize">{seed.environment?.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-black/40 dark:text-white/40 uppercase tracking-wide mb-1">Modell</p>
                      <p className="text-black dark:text-white capitalize">{seed.typical_gender}</p>
                    </div>
                    {seed.overall_style_summary && (
                      <div>
                        <p className="text-xs text-black/40 dark:text-white/40 uppercase tracking-wide mb-1">Stilsammanfattning</p>
                        <p className="text-black/80 dark:text-white/80 leading-relaxed">{seed.overall_style_summary}</p>
                      </div>
                    )}
                    {seed.typography && (
                      <div>
                        <p className="text-xs text-black/40 dark:text-white/40 uppercase tracking-wide mb-1">Typsnitt</p>
                        <p className="text-black/80 dark:text-white/80">{seed.typography}</p>
                      </div>
                    )}
                    {seed.image_style && (
                      <div>
                        <p className="text-xs text-black/40 dark:text-white/40 uppercase tracking-wide mb-1">Bildstil</p>
                        <p className="text-black/80 dark:text-white/80">{seed.image_style}</p>
                      </div>
                    )}
                    {seed.color_palette && (
                      <div>
                        <p className="text-xs text-black/40 dark:text-white/40 uppercase tracking-wide mb-1">Färgpalett</p>
                        <p className="text-black/80 dark:text-white/80">{seed.color_palette}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Scanned Results */}
      <AnimatePresence>
        {scannedData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-white border border-black/10 dark:border-black/10 rounded-2xl p-6 space-y-6"
          >
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-black/10 dark:border-black/10">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <h4 className="text-black font-medium text-lg">Varumärkesanalys klar</h4>
                <p className="text-sm text-black/60">Detaljerad visuell identitetsanalys sparad som seed</p>
              </div>
            </div>
            
            {/* Overall Style Summary */}
            {scannedData.overall_style_summary && (
              <div className="p-4 bg-gradient-to-br from-[#392599]/5 to-[#0071e3]/5 border border-[#392599]/20 rounded-xl">
                <p className="text-xs text-[#392599] uppercase tracking-wide mb-2 font-medium">Övergripande stilbeskrivning</p>
                <p className="text-black leading-relaxed font-medium">{scannedData.overall_style_summary}</p>
              </div>
            )}

            {/* Core Identity */}
            <div className="space-y-3">
              <h5 className="text-black/80 font-medium text-sm uppercase tracking-wide">Grundläggande identitet</h5>
              
              <div className="p-4 bg-[#0071e3]/5 border border-[#0071e3]/20 rounded-xl">
                <p className="text-xs text-black/40 uppercase tracking-wide mb-2">Varumärkesbeskrivning</p>
                <p className="text-black leading-relaxed">{scannedData.brand_style}</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-[#f5f5f7] rounded-xl border border-black/5">
                  <p className="text-xs text-black/40 uppercase tracking-wide mb-1">Karaktär</p>
                  <p className="text-black capitalize font-medium">{scannedData.character}</p>
                </div>
                <div className="p-3 bg-[#f5f5f7] rounded-xl border border-black/5">
                  <p className="text-xs text-black/40 uppercase tracking-wide mb-1">Modell</p>
                  <p className="text-black capitalize font-medium">{scannedData.typical_gender}</p>
                </div>
                <div className="p-3 bg-[#f5f5f7] rounded-xl border border-black/5">
                  <p className="text-xs text-black/40 uppercase tracking-wide mb-1">Miljö</p>
                  <p className="text-black capitalize font-medium">{scannedData.environment?.replace(/_/g, ' ')}</p>
                </div>
                {scannedData.product_count && (
                  <div className="p-3 bg-[#f5f5f7] rounded-xl border border-black/5">
                    <p className="text-xs text-black/40 uppercase tracking-wide mb-1">Produkter</p>
                    <p className="text-black font-medium">~{scannedData.product_count}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Typography & Image Style */}
            {(scannedData.typography || scannedData.image_style) && (
              <div className="grid md:grid-cols-2 gap-3">
                {scannedData.typography && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                    <p className="text-xs text-purple-600 uppercase tracking-wide mb-2 font-medium">Typografi</p>
                    <p className="text-black/80 leading-relaxed">{scannedData.typography}</p>
                  </div>
                )}
                {scannedData.image_style && (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <p className="text-xs text-indigo-600 uppercase tracking-wide mb-2 font-medium">Bildstil & Komposition</p>
                    <p className="text-black/80 leading-relaxed">{scannedData.image_style}</p>
                  </div>
                )}
              </div>
            )}

            {/* Visual Analysis */}
            {scannedData.visual_analysis && (
              <div className="space-y-3">
                <h5 className="text-black/80 font-medium text-sm uppercase tracking-wide">Visuell analys</h5>
                <div className="p-4 bg-[#f5f5f7] rounded-xl border border-black/5">
                  <p className="text-black/80 leading-relaxed whitespace-pre-line">{scannedData.visual_analysis}</p>
                </div>
              </div>
            )}

            {/* Color & Style */}
            {(scannedData.color_palette || scannedData.photography_style) && (
              <div className="grid md:grid-cols-2 gap-3">
                {scannedData.color_palette && (
                  <div className="p-4 bg-[#f5f5f7] rounded-xl border border-black/5">
                    <p className="text-xs text-black/40 uppercase tracking-wide mb-2">Färgpalett</p>
                    <p className="text-black/80 leading-relaxed">{scannedData.color_palette}</p>
                  </div>
                )}
                {scannedData.photography_style && (
                  <div className="p-4 bg-[#f5f5f7] rounded-xl border border-black/5">
                    <p className="text-xs text-black/40 uppercase tracking-wide mb-2">Fotostil</p>
                    <p className="text-black/80 leading-relaxed">{scannedData.photography_style}</p>
                  </div>
                )}
              </div>
            )}

            {/* Recommendations */}
            {scannedData.recommendations && (
              <div className="space-y-3">
                <h5 className="text-black/80 font-medium text-sm uppercase tracking-wide">Rekommendationer</h5>
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-black/80 leading-relaxed whitespace-pre-line">{scannedData.recommendations}</p>
                </div>
              </div>
            )}

            {/* Strengths & Weaknesses */}
            {(scannedData.strengths || scannedData.weaknesses) && (
              <div className="grid md:grid-cols-2 gap-3">
                {scannedData.strengths && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-xs text-blue-600 uppercase tracking-wide mb-2 font-medium">Styrkor</p>
                    <p className="text-black/80 leading-relaxed whitespace-pre-line">{scannedData.strengths}</p>
                  </div>
                )}
                {scannedData.weaknesses && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                    <p className="text-xs text-orange-600 uppercase tracking-wide mb-2 font-medium">Förbättringsområden</p>
                    <p className="text-black/80 leading-relaxed whitespace-pre-line">{scannedData.weaknesses}</p>
                  </div>
                )}
              </div>
            )}

            {/* Save Button */}
            <div className="pt-4 border-t border-black/10 dark:border-black/10">
              <Button
                onClick={handleSaveSeed}
                disabled={createBrandSeedMutation.isPending}
                className="w-full bg-[#0071e3] hover:bg-[#0077ED] text-white font-medium rounded-full"
              >
                {createBrandSeedMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sparar...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Spara Profil
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black">Ta bort seed?</AlertDialogTitle>
            <AlertDialogDescription className="text-black/60">
              Detta går inte att ångra. Seeden kommer att tas bort permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-black/10 text-black hover:bg-black/5">
              Avbryt
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteBrandSeedMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}