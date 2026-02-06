import React from 'react';
import { cn } from "@/lib/utils";
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

const brandCharacters = [
  {
    id: 'luxury',
    name: 'Lyxig',
    description: 'Exklusiv och sofistikerad',
    keywords: 'elegant, högkvalitet, premium',
    color: 'from-amber-500/20 to-yellow-600/20',
    icon: '💎'
  },
  {
    id: 'minimalist',
    name: 'Minimalistisk',
    description: 'Ren och modern',
    keywords: 'skandinavisk, enkel, tidlös',
    color: 'from-slate-500/20 to-gray-600/20',
    icon: '⚪'
  },
  {
    id: 'urban',
    name: 'Urban',
    description: 'Street style och trendigt',
    keywords: 'modern, streetwear, cool',
    color: 'from-blue-500/20 to-indigo-600/20',
    icon: '🏙️'
  },
  {
    id: 'sporty',
    name: 'Sportig',
    description: 'Aktiv och dynamisk',
    keywords: 'athletic, energisk, funktionell',
    color: 'from-green-500/20 to-emerald-600/20',
    icon: '⚡'
  },
  {
    id: 'bohemian',
    name: 'Bohemisk',
    description: 'Fri och kreativ',
    keywords: 'artistisk, avslappnad, unik',
    color: 'from-purple-500/20 to-pink-600/20',
    icon: '🌸'
  },
  {
    id: 'classic',
    name: 'Klassisk',
    description: 'Tidlös och elegant',
    keywords: 'traditionell, sofistikerad, tidlös',
    color: 'from-rose-500/20 to-red-600/20',
    icon: '👔'
  },
  {
    id: 'edgy',
    name: 'Edgy',
    description: 'Modig och uttrycksfull',
    keywords: 'modern, djärv, innovativ',
    color: 'from-orange-500/20 to-red-600/20',
    icon: '🔥'
  },
  {
    id: 'casual',
    name: 'Casual',
    description: 'Bekväm och vardaglig',
    keywords: 'avslappnad, vardaglig, ledig',
    color: 'from-cyan-500/20 to-blue-600/20',
    icon: '👕'
  },
];

export default function BrandCharacterSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {brandCharacters.map((character, index) => (
        <motion.button
          key={character.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelect(character)}
          className={cn(
            "relative p-6 rounded-2xl transition-all duration-300",
            "border-2 bg-gradient-to-br",
            character.color,
            selected?.id === character.id 
              ? "border-[#C9A962] ring-2 ring-[#C9A962]/30" 
              : "border-transparent hover:border-white/20"
          )}
        >
          {/* Selected indicator */}
          {selected?.id === character.id && (
            <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-[#C9A962] flex items-center justify-center">
              <Check className="h-4 w-4 text-black" />
            </div>
          )}
          
          <div className="text-center">
            <div className="text-4xl mb-3">{character.icon}</div>
            <h3 className="text-white font-medium mb-1">{character.name}</h3>
            <p className="text-white/60 text-sm mb-2">{character.description}</p>
            <p className="text-white/40 text-xs">{character.keywords}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}