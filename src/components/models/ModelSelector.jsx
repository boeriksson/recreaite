import React from 'react';
import { cn } from "@/lib/utils";
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

const modelOptions = [
  {
    id: 'female-1',
    name: 'Sofia',
    description: 'Klassisk look',
    gender: 'female',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face'
  },
  {
    id: 'female-2',
    name: 'Emma',
    description: 'Modern stil',
    gender: 'female',
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop&crop=face'
  },
  {
    id: 'female-3',
    name: 'Isabella',
    description: 'Elegant',
    gender: 'female',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop&crop=face'
  },
  {
    id: 'male-1',
    name: 'Alexander',
    description: 'Professionell',
    gender: 'male',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face'
  },
  {
    id: 'male-2',
    name: 'Marcus',
    description: 'Casual',
    gender: 'male',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop&crop=face'
  },
  {
    id: 'male-3',
    name: 'Oliver',
    description: 'Urban stil',
    gender: 'male',
    image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=600&fit=crop&crop=face'
  },
];

export default function ModelSelector({ selectedModel, onSelect, genderFilter }) {
  const filteredModels = genderFilter 
    ? modelOptions.filter(m => m.gender === genderFilter)
    : modelOptions;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {filteredModels.map((model, index) => (
        <motion.button
          key={model.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelect(model)}
          className={cn(
            "relative group rounded-xl overflow-hidden aspect-[3/4] transition-all duration-300",
            "border-2",
            selectedModel?.id === model.id 
              ? "border-[#C9A962] ring-2 ring-[#C9A962]/30" 
              : "border-transparent hover:border-white/20"
          )}
        >
          <img 
            src={model.image} 
            alt={model.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Selected indicator */}
          {selectedModel?.id === model.id && (
            <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-[#C9A962] flex items-center justify-center">
              <Check className="h-4 w-4 text-black" />
            </div>
          )}
          
          {/* Model info */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-medium">{model.name}</h3>
            <p className="text-white/60 text-sm">{model.description}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}