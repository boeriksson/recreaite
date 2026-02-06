import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function BulkProgressTracker({ items, currentIndex, totalCount }) {
  const completedCount = items.filter(item => item.status === 'completed').length;
  const failedCount = items.filter(item => item.status === 'failed').length;
  const progressPercentage = (completedCount / totalCount) * 100;

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <Sparkles className="h-8 w-8 text-[#C9A962]" />
          <div className="text-left">
            <h3 className="text-2xl font-light text-white">
              {completedCount} / {totalCount}
            </h3>
            <p className="text-white/60 text-sm">
              {completedCount === totalCount 
                ? 'Alla bilder genererade!' 
                : `Genererar bilder...`}
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full max-w-md mx-auto h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-[#C9A962] to-[#E5D4A1]"
          />
        </div>
        
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-white/60">{completedCount} klara</span>
          </div>
          {failedCount > 0 && (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-white/60">{failedCount} misslyckade</span>
            </div>
          )}
        </div>
      </div>

      {/* Item List */}
      <div className="max-h-[400px] overflow-y-auto space-y-3 px-2">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "flex items-center gap-4 p-4 rounded-xl border transition-all",
              item.status === 'completed' && "bg-green-500/5 border-green-500/20",
              item.status === 'processing' && "bg-[#C9A962]/10 border-[#C9A962]/30",
              item.status === 'failed' && "bg-red-500/5 border-red-500/20",
              item.status === 'pending' && "bg-white/5 border-white/10"
            )}
          >
            {/* Preview */}
            <div className="h-16 w-16 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
              {item.preview ? (
                <img 
                  src={item.preview} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-white/20" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{item.name}</p>
              <p className="text-sm text-white/60">
                {item.status === 'pending' && 'Väntar...'}
                {item.status === 'processing' && 'Genererar...'}
                {item.status === 'completed' && 'Klar!'}
                {item.status === 'failed' && 'Misslyckades'}
              </p>
            </div>

            {/* Status Icon */}
            <div className="flex-shrink-0">
              {item.status === 'pending' && (
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-xs text-white/40">#{index + 1}</span>
                </div>
              )}
              {item.status === 'processing' && (
                <Loader2 className="h-8 w-8 text-[#C9A962] animate-spin" />
              )}
              {item.status === 'completed' && (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              )}
              {item.status === 'failed' && (
                <AlertCircle className="h-8 w-8 text-red-500" />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}