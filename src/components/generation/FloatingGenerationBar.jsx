import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Image, X } from 'lucide-react';
import { useGenerationStatus } from './GenerationStatusProvider';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { cn } from '@/lib/utils';

export default function FloatingGenerationBar({ darkMode }) {
  const { processingImages } = useGenerationStatus();
  const [isExpanded, setIsExpanded] = React.useState(true);

  if (processingImages.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
          "rounded-2xl shadow-2xl backdrop-blur-xl border transition-all",
          darkMode 
            ? "bg-[#1a1a1a]/95 border-white/10" 
            : "bg-white/95 border-black/10"
        )}
        style={{ maxWidth: 'calc(100vw - 2rem)' }}
      >
        {isExpanded ? (
          <div className="flex items-center gap-4 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Loader2 className={cn(
                  "h-6 w-6 animate-spin",
                  darkMode ? "text-[#392599]" : "text-[#392599]"
                )} />
                <div className={cn(
                  "absolute inset-0 rounded-full blur-md opacity-50",
                  darkMode ? "bg-[#392599]" : "bg-[#392599]"
                )} />
              </div>
              <div>
                <p className={cn(
                  "text-sm font-medium",
                  darkMode ? "text-white" : "text-black"
                )}>
                  Genererar {processingImages.length} {processingImages.length === 1 ? 'bild' : 'bilder'}
                </p>
                <p className={cn(
                  "text-xs",
                  darkMode ? "text-white/60" : "text-black/60"
                )}>
                  Bilder visas i galleriet när de är klara
                </p>
              </div>
            </div>

            <Link
              to={createPageUrl('Gallery')}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                "bg-[#392599] hover:bg-[#4a2fb3] text-white"
              )}
            >
              <Image className="h-4 w-4 inline mr-2" />
              Se galleri
            </Link>

            <button
              onClick={() => setIsExpanded(false)}
              className={cn(
                "p-2 rounded-full transition-colors",
                darkMode ? "hover:bg-white/10" : "hover:bg-black/10"
              )}
            >
              <X className={cn("h-4 w-4", darkMode ? "text-white/60" : "text-black/60")} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsExpanded(true)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 w-full",
              darkMode ? "hover:bg-white/5" : "hover:bg-black/5"
            )}
          >
            <Loader2 className={cn(
              "h-5 w-5 animate-spin",
              darkMode ? "text-[#392599]" : "text-[#392599]"
            )} />
            <span className={cn(
              "text-sm font-medium",
              darkMode ? "text-white" : "text-black"
            )}>
              {processingImages.length} {processingImages.length === 1 ? 'bild' : 'bilder'}
            </span>
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}