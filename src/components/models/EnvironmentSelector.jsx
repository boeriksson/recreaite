import React from 'react';
import { cn } from "@/lib/utils";
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

const environments = [
  {
    id: 'studio',
    name: 'Studio',
    description: 'Ren vit/grå bakgrund',
    prompt: 'professional studio photography with clean white or grey background, soft studio lighting, high-end product photography',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=600&fit=crop'
  },
  {
    id: 'urban-street',
    name: 'Urban gata',
    description: 'Stadsmiljö och street style',
    prompt: 'editorial fashion photography. Urban street setting, modern city background, natural daylight, street fashion photography style',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop'
  },
  {
    id: 'minimalist-interior',
    name: 'Minimalistisk interiör',
    description: 'Modern interiör med rena linjer',
    prompt: 'editorial fashion photography. Minimalist modern interior, clean architectural space, natural window light, Scandinavian aesthetic',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=600&fit=crop'
  },
  {
    id: 'nature',
    name: 'Natur',
    description: 'Utomhus i naturlig miljö',
    prompt: 'editorial fashion photography. Natural outdoor setting, beautiful nature background, soft natural lighting, lifestyle photography',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop'
  },
  {
    id: 'cafe',
    name: 'Café',
    description: 'Mysig café-miljö',
    prompt: 'editorial fashion photography. Cozy cafe setting, warm ambient lighting, lifestyle photography, casual and relaxed atmosphere',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop'
  },
  {
    id: 'rooftop',
    name: 'Takyta',
    description: 'Urban takyta med stadsvy',
    prompt: 'editorial fashion photography. Urban rooftop setting, city skyline background, golden hour lighting, modern fashion photography',
    image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=600&fit=crop'
  },
  {
    id: 'beach',
    name: 'Strand',
    description: 'Avslappnad strandmiljö',
    prompt: 'editorial fashion photography. Beach setting, coastal background, soft natural light, relaxed summer vibes',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop'
  },
  {
    id: 'industrial',
    name: 'Industriell',
    description: 'Rå industriell miljö',
    prompt: 'editorial fashion photography. Industrial setting, warehouse or loft space, dramatic lighting, edgy fashion photography style',
    image: 'https://images.unsplash.com/photo-1565688534245-05d6b5be184a?w=800&h=600&fit=crop'
  },
  {
    id: 'ugc',
    name: 'UGC (iPhone)',
    description: 'User-generated content stil',
    prompt: 'casual user-generated content style photo taken with iPhone. Natural authentic feel, candid moment, casual everyday setting, natural lighting, authentic and relatable vibe, slightly imperfect composition',
    image: 'https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?w=800&h=600&fit=crop'
  },
];

export default function EnvironmentSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {environments.map((environment, index) => (
        <motion.button
          key={environment.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelect(environment)}
          className={cn(
            "relative group rounded-2xl overflow-hidden aspect-[4/3] transition-all duration-300",
            "border-2",
            selected?.id === environment.id 
              ? "border-[#C9A962] ring-2 ring-[#C9A962]/30" 
              : "border-transparent hover:border-white/20"
          )}
        >
          <img 
            src={environment.image} 
            alt={environment.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          
          {/* Selected indicator */}
          {selected?.id === environment.id && (
            <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-[#C9A962] flex items-center justify-center">
              <Check className="h-4 w-4 text-black" />
            </div>
          )}
          
          {/* Environment info */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-medium mb-1">{environment.name}</h3>
            <p className="text-white/60 text-sm">{environment.description}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}