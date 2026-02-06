import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function ModelCarousel({ models }) {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % models.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + models.length) % models.length);
  };

  if (!models || models.length === 0) return null;

  return (
    <div className="relative max-w-5xl mx-auto">
      <div className="overflow-hidden">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {models.slice(currentIndex, currentIndex + 4).map((model, idx) => (
            <div key={model.id} className="aspect-[3/4] rounded-2xl overflow-hidden bg-[#f5f5f7] dark:bg-white/5">
              <img 
                src={model.portrait_url || model.image_url} 
                alt={model.name}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </motion.div>
      </div>

      {models.length > 4 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            onClick={prev}
            variant="outline"
            size="icon"
            className="rounded-full border-black/10 dark:border-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex gap-2">
            {Array.from({ length: Math.ceil(models.length / 4) }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx * 4)}
                className={`h-2 rounded-full transition-all ${
                  Math.floor(currentIndex / 4) === idx 
                    ? 'w-8 bg-[#0071e3]' 
                    : 'w-2 bg-black/20 dark:bg-white/20'
                }`}
              />
            ))}
          </div>
          <Button
            onClick={next}
            variant="outline"
            size="icon"
            className="rounded-full border-black/10 dark:border-white/10"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}