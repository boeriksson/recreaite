import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Tag, RefreshCw } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useLanguage } from '../LanguageContext';

export default function AICategorizationPanel({ image, onUpdate }) {
  const { language } = useLanguage();
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeImage = async () => {
    setAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analysera denna produktbild och kategorisera den.

Identifiera:
1. Huvudmotiv (t.ex. 'klänning', 'kostym', 'jeans', 'topp')
2. Stil (t.ex. 'casual', 'formell', 'sport', 'elegant')
3. Säsong/tillfälle (t.ex. 'sommar', 'vinter', 'fest', 'vardag')
4. Färgtema (t.ex. 'mörk', 'ljus', 'färgglad', 'neutral')
5. Relevanta taggar (ge 5-8 specifika taggar)

Var specifik och använd svenska ord som är lämpliga för e-handel.`,
        file_urls: [image.image_url],
        response_json_schema: {
          type: 'object',
          properties: {
            main_subject: {
              type: 'string',
              description: 'Huvudmotiv, t.ex. "klänning", "kostym", "jeans"'
            },
            categories: {
              type: 'array',
              items: { type: 'string' },
              description: 'Lista av kategorier (huvudmotiv, stil, säsong, etc.)'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: '5-8 specifika taggar för bilden'
            },
            style_description: {
              type: 'string',
              description: 'Kort beskrivning av stilen'
            }
          }
        }
      });

      await base44.entities.GeneratedImage.update(image.id, {
        ai_categories: result.categories || [],
        ai_tags: result.tags || [],
        ai_analysis: {
          ...image.ai_analysis,
          main_subject: result.main_subject,
          style_description: result.style_description
        }
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to analyze image:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const hasAIData = image.ai_categories?.length > 0 || image.ai_tags?.length > 0;

  return (
    <div className="space-y-4">
      {/* AI Categorization Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-black/60 dark:text-white/60">
          {language === 'sv' ? 'AI-kategorisering' : 'AI Categorization'}
        </h3>
        <Button
          onClick={analyzeImage}
          disabled={analyzing}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {analyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {language === 'sv' ? 'Analyserar...' : 'Analyzing...'}
            </>
          ) : (
            <>
              {hasAIData ? <RefreshCw className="h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {hasAIData
                ? (language === 'sv' ? 'Uppdatera' : 'Update')
                : (language === 'sv' ? 'Analysera' : 'Analyze')}
            </>
          )}
        </Button>
      </div>

      {/* Display AI Categories */}
      {image.ai_categories?.length > 0 && (
        <div>
          <p className="text-xs text-black/40 dark:text-white/40 mb-2">
            {language === 'sv' ? 'Kategorier' : 'Categories'}
          </p>
          <div className="flex flex-wrap gap-2">
            {image.ai_categories.map((category, idx) => (
              <Badge
                key={idx}
                className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700"
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Display AI Tags */}
      {image.ai_tags?.length > 0 && (
        <div>
          <p className="text-xs text-black/40 dark:text-white/40 mb-2 flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {language === 'sv' ? 'AI-föreslagna taggar' : 'AI-suggested tags'}
          </p>
          <div className="flex flex-wrap gap-2">
            {image.ai_tags.map((tag, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-700/50"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Style Description */}
      {image.ai_analysis?.style_description && (
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/30 rounded-lg">
          <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">
            {language === 'sv' ? 'Stilbeskrivning' : 'Style description'}
          </p>
          <p className="text-sm text-purple-800 dark:text-purple-200">
            {image.ai_analysis.style_description}
          </p>
        </div>
      )}
    </div>
  );
}
