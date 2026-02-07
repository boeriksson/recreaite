import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Tag, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const COMMON_TAGS = [
  'Sommar 2025',
  'Höst 2025',
  'Vår 2025',
  'Vinter 2025',
  'Kampanj',
  'Rea',
  'Nyhet',
  'Favorit',
  'Bästsäljare',
  'Vintage',
  'Minimalistisk',
  'Elegant',
  'Casual',
  'Sport',
  'Business'
];

export default function TagManager({
  currentTags = [],
  allExistingTags = [],
  onTagsUpdate,
  darkMode = false
}) {
  const [showInput, setShowInput] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Get unique tags from all images
  const existingTags = [...new Set(allExistingTags)];

  // Combine existing tags with common suggestions
  const allSuggestions = [...new Set([...existingTags, ...COMMON_TAGS])];

  // Filter suggestions based on input
  const filteredSuggestions = allSuggestions
    .filter(tag =>
      tag.toLowerCase().includes(newTag.toLowerCase()) &&
      !currentTags.includes(tag)
    )
    .slice(0, 8);

  const addTag = (tag) => {
    if (tag.trim() && !currentTags.includes(tag.trim())) {
      onTagsUpdate([...currentTags, tag.trim()]);
      setNewTag('');
      setShowInput(false);
      setShowSuggestions(false);
    }
  };

  const removeTag = (tagToRemove) => {
    onTagsUpdate(currentTags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Current Tags */}
        <AnimatePresence>
          {currentTags.map((tag) => (
            <motion.div
              key={tag}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <Badge
                variant="secondary"
                className={cn(
                  "flex items-center gap-1 pr-1 text-xs",
                  darkMode ? "bg-white/10 text-white" : "bg-black/10 text-black"
                )}
              >
                <Tag className="h-3 w-3" />
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className={cn(
                    "ml-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
                  )}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add Tag Button/Input */}
        {showInput ? (
          <div className="relative">
            <div className="flex items-center gap-1">
              <Input
                value={newTag}
                onChange={(e) => {
                  setNewTag(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(newTag);
                  } else if (e.key === 'Escape') {
                    setShowInput(false);
                    setNewTag('');
                    setShowSuggestions(false);
                  }
                }}
                placeholder="Skriv tagg..."
                className="h-7 text-xs w-32"
                autoFocus
              />
              <Button
                onClick={() => addTag(newTag)}
                size="icon"
                className="h-7 w-7 bg-[#392599] hover:bg-[#4a2fb3]"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                onClick={() => {
                  setShowInput(false);
                  setNewTag('');
                  setShowSuggestions(false);
                }}
                size="icon"
                variant="ghost"
                className="h-7 w-7"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Tag Suggestions */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "absolute top-full left-0 mt-1 p-2 rounded-lg border shadow-lg z-50 min-w-48",
                  darkMode
                    ? "bg-[#1a1a1a] border-white/10"
                    : "bg-white border-black/10"
                )}
              >
                <p className={cn("text-xs mb-2", darkMode ? "text-white/60" : "text-black/60")}>
                  Förslag:
                </p>
                <div className="flex flex-wrap gap-1">
                  {filteredSuggestions.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => addTag(tag)}
                      className={cn(
                        "text-xs px-2 py-1 rounded transition-colors",
                        darkMode
                          ? "bg-white/5 hover:bg-white/10 text-white"
                          : "bg-black/5 hover:bg-black/10 text-black"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <Button
            onClick={() => setShowInput(true)}
            size="sm"
            variant="outline"
            className="h-7 text-xs border-dashed"
          >
            <Plus className="h-3 w-3 mr-1" />
            Lägg till tagg
          </Button>
        )}
      </div>
    </div>
  );
}
