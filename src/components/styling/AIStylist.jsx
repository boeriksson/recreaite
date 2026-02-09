import React, { useState } from 'react';
import { base44 } from '@/api/amplifyClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Loader2,
  Check,
  X,
  Plus,
  Shirt,
  RefreshCw
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useLanguage } from '../LanguageContext';
import { SignedImage } from '@/components/ui/SignedImage';

export default function AIStylist({
  allGarments,
  brandSeed,
  onSelectOutfit,
  initialSelectedGarments = []
}) {
  const { t } = useLanguage();
  const [analyzing, setAnalyzing] = useState(false);
  const [outfitSuggestions, setOutfitSuggestions] = useState([]);
  const [selectedOutfit, setSelectedOutfit] = useState(null);

  const analyzeAndSuggest = async () => {
    setAnalyzing(true);
    try {
      // Prepare garment data for AI
      const garmentDescriptions = allGarments.map(g => ({
        id: g.id,
        name: g.name,
        category: g.category,
        brand: g.brand,
        style: g.style || 'unknown'
      }));

      // Build prompt with brand context
      let brandContext = '';
      if (brandSeed) {
        brandContext = `Varumärkesidentitet: ${brandSeed.name}. Stil: ${brandSeed.brand_style}. Karaktär: ${brandSeed.character}. Färgpalett: ${brandSeed.color_palette || 'varies'}. `;
      }

      const prompt = `Du är en expert mode-stylist. ${brandContext}

Här är tillgängliga plagg att styla:
${garmentDescriptions.map((g, i) => `${i + 1}. ${g.name} (${g.category}) - ${g.brand || 'No brand'}`).join('\n')}

Skapa exakt 3 kompletta outfit-förslag som:
1. Kombinerar minst 2-3 plagg från listan
2. Är estetiskt tilltalande och välbalanserade
3. Följer grundläggande mode-regler (t.ex. färgkombinationer, stilenhet)
4. Passar varumärkets identitet (om angiven)
5. Om ett viktigt plagg saknas för en outfit (t.ex. skor, jacka), specificera vad som bör läggas till

För varje outfit, förklara kort varför plaggen passar ihop.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            outfits: {
              type: 'array',
              minItems: 3,
              maxItems: 3,
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Outfit namn, t.ex. "Casual Weekend Look"' },
                  garment_names: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Lista med plaggnamn från tillgängliga plagg'
                  },
                  missing_items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        item: { type: 'string', description: 'Vad som saknas, t.ex. "Vita sneakers"' },
                        category: { type: 'string', enum: ['tops', 'bottoms', 'dresses', 'outerwear', 'accessories'] }
                      }
                    },
                    description: 'Plagg som bör läggas till för en komplett outfit'
                  },
                  reasoning: { type: 'string', description: 'Kort förklaring varför dessa plagg passar ihop' },
                  vibe: { type: 'string', description: 'Känslan i outfiten, t.ex. "casual", "elegant", "sporty"' }
                }
              }
            }
          }
        }
      });

      // Match suggested garment names to actual garments - more flexible matching
      if (result && result.outfits && Array.isArray(result.outfits)) {
        const suggestions = result.outfits.map(outfit => {
          const matchedGarments = outfit.garment_names
            .map(name => {
              // Try exact match first
              let match = allGarments.find(g =>
                g.name.toLowerCase() === name.toLowerCase()
              );

              // If no exact match, try partial match (both directions)
              if (!match) {
                match = allGarments.find(g =>
                  g.name.toLowerCase().includes(name.toLowerCase()) ||
                  name.toLowerCase().includes(g.name.toLowerCase())
                );
              }

              // If still no match, try word-by-word matching
              if (!match) {
                const nameWords = name.toLowerCase().split(/\s+/);
                match = allGarments.find(g => {
                  const garmentWords = g.name.toLowerCase().split(/\s+/);
                  return nameWords.some(word => garmentWords.some(gWord =>
                    word.length > 3 && gWord.includes(word) || gWord.length > 3 && word.includes(gWord)
                  ));
                });
              }

              return match;
            })
            .filter(Boolean);

          return {
            ...outfit,
            garments: matchedGarments,
            id: Math.random().toString(36).substr(2, 9)
          };
        }).filter(outfit => outfit.garments.length >= 1); // Show outfits with at least 1 matched garment

        // Always ensure we have exactly 3 suggestions (even if some matching failed)
        if (suggestions.length < 3) {
          console.warn(`Only ${suggestions.length} outfits had matched garments. Expected 3.`);
        }

        setOutfitSuggestions(suggestions.slice(0, 3)); // Ensure max 3 suggestions
      } else {
        console.error('Invalid AI response format:', result);
      }
    } catch (error) {
      console.error('AI styling failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectOutfit = (outfit) => {
    setSelectedOutfit(outfit);
    onSelectOutfit(outfit.garments);
  };

  return (
    <div className="space-y-6">

      {/* Loading State */}
      {analyzing && (
        <div className="text-center py-12">
          <div className="h-16 w-16 rounded-full bg-[#392599]/10 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-8 w-8 text-[#392599] animate-spin" />
          </div>
          <p className="text-black dark:text-white font-medium">{t.analyzingYourGarments}</p>
          <p className="text-sm text-black/60 dark:text-white/60 mt-1">{t.aiCreatingCombinations}</p>
        </div>
      )}

      {/* Outfit Suggestions */}
      <AnimatePresence>
        {!analyzing && outfitSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h4 className="text-sm font-medium text-black dark:text-white">{t.suggestionsFromAi}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {outfitSuggestions.map((outfit) => (
                <motion.button
                  key={outfit.id}
                  onClick={() => handleSelectOutfit(outfit)}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all hover:shadow-lg",
                    selectedOutfit?.id === outfit.id
                      ? "border-[#392599] bg-[#392599]/5"
                      : "border-black/10 hover:border-[#392599]/50 dark:border-white/10"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Garment Preview Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {outfit.garments.slice(0, 4).map((garment) => (
                      <div key={garment.id} className="aspect-[3/4] rounded-lg overflow-hidden bg-[#f5f5f7] dark:bg-white/5">
                        {garment.image_url ? (
                          <SignedImage src={garment.image_url} alt={garment.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Shirt className="h-6 w-6 text-black/20 dark:text-white/20" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Outfit Details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-black dark:text-white">{outfit.name}</h5>
                      {selectedOutfit?.id === outfit.id && (
                        <div className="h-6 w-6 rounded-full bg-[#392599] flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-xs px-2 py-1 rounded-full bg-[#392599]/10 text-[#392599] capitalize">
                        {outfit.vibe}
                      </span>
                      <span className="text-xs text-black/60 dark:text-white/60">
                        {outfit.garments.length} {t.garments}
                      </span>
                    </div>

                    <p className="text-xs text-black/60 dark:text-white/60 line-clamp-2">
                      {outfit.reasoning}
                    </p>

                    {/* Missing Items */}
                    {outfit.missing_items && outfit.missing_items.length > 0 && (
                      <div className="pt-2 border-t border-black/10 dark:border-white/10">
                        <p className="text-xs text-black/40 dark:text-white/40 mb-1">{t.addForCompleteOutfit}</p>
                        <div className="flex flex-wrap gap-1">
                          {outfit.missing_items.map((missing, idx) => (
                            <span key={idx} className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 flex items-center gap-1">
                              <Plus className="h-3 w-3" />
                              {missing.item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Get New Suggestions Button */}
            <div className="flex justify-center pt-2">
              <Button
                onClick={() => {
                  setSelectedOutfit(null);
                  analyzeAndSuggest();
                }}
                variant="outline"
                size="sm"
                className="border-[#392599] text-[#392599] hover:bg-[#392599]/10"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                {t.getNewSuggestions}
              </Button>
            </div>

            {/* Selected Outfit Actions */}
            {selectedOutfit && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-[#392599]/10 border border-[#392599]/30 rounded-xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Check className="h-5 w-5 text-[#392599]" />
                  <p className="font-medium text-black dark:text-white">{t.outfitSelected} {selectedOutfit.name}</p>
                </div>
                <p className="text-sm text-black/60 dark:text-white/60 mb-3">
                  {selectedOutfit.garments.length} {t.garments}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setSelectedOutfit(null);
                      onSelectOutfit([]);
                    }}
                    variant="outline"
                    size="sm"
                    className="border-[#392599] text-[#392599] hover:bg-[#392599]/10"
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t.cancelSelection}
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!analyzing && outfitSuggestions.length === 0 && allGarments.length >= 2 && (
        <div className="text-center py-12 bg-[#f5f5f7] dark:bg-white/5 rounded-xl">
          <div className="h-16 w-16 rounded-full bg-[#392599]/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-[#392599]" />
          </div>
          <p className="text-black dark:text-white font-medium mb-2">{t.readyToStartStyling}</p>
          <p className="text-sm text-black/60 dark:text-white/60 mb-4">
            {t.clickGetSuggestionsToAnalyze}
          </p>
          <Button
            onClick={analyzeAndSuggest}
            disabled={analyzing || allGarments.length < 2}
            className="bg-[#392599] hover:bg-[#4a2fb3] text-white"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {t.getSuggestions}
          </Button>
        </div>
      )}

      {allGarments.length < 2 && (
        <div className="text-center py-12 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-xl">
          <p className="text-amber-800 dark:text-amber-200">
            {t.addAtLeast2Garments}
          </p>
        </div>
      )}

      {/* Brand Context - Moved to bottom */}
      {brandSeed && (
        <div className="p-4 bg-[#392599]/10 border border-[#392599]/30 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-[#392599]/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-[#392599]" />
            </div>
            <div>
              <p className="text-sm font-medium text-black dark:text-white">{brandSeed.name}</p>
              <p className="text-xs text-black/60 dark:text-white/60">{brandSeed.character} • {brandSeed.brand_style}</p>
            </div>
          </div>
          <p className="text-xs text-black/60 dark:text-white/60">
            {t.aiWillSuggestOutfits}
          </p>
        </div>
      )}
    </div>
  );
}
