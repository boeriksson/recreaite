import React from 'react';
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';

const genderOptions = [
  {
    id: 'female',
    name: 'Kvinnlig modell',
    icon: '👩',
    description: 'Kvinnlig presentation'
  },
  {
    id: 'male',
    name: 'Manlig modell',
    icon: '👨',
    description: 'Manlig presentation'
  },
  {
    id: 'neutral',
    name: 'Könsneutral',
    icon: '🧑',
    description: 'Neutral presentation'
  }
];

export default function GenderSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
      {genderOptions.map((option, index) => (
        <motion.button
          key={option.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onSelect(option)}
          className={cn(
            "relative p-6 rounded-2xl transition-all duration-300",
            "border-2 bg-white/5",
            selected?.id === option.id 
              ? "border-[#C9A962] ring-2 ring-[#C9A962]/30 bg-[#C9A962]/10" 
              : "border-white/10 hover:border-white/20 hover:bg-white/10"
          )}
        >
          <div className="text-center">
            <div className="text-5xl mb-3">{option.icon}</div>
            <h3 className="text-white font-medium mb-1">{option.name}</h3>
            <p className="text-white/60 text-sm">{option.description}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}