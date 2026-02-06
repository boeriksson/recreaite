import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Pre-made exclusive models
const preMadeModels = [
  {
    id: 'pm1',
    name: 'Emma Andersson',
    gender: 'female',
    age: 24,
    ethnicity: 'caucasian',
    body_type: 'athletic',
    height: 175,
    hair_color: 'blonde',
    skin_tone: 'fair',
    portrait: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
    fullBody: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=800&fit=crop',
    description: 'Professionell modell med skandinavisk look'
  },
  {
    id: 'pm2',
    name: 'Marcus Johansson',
    gender: 'male',
    age: 28,
    ethnicity: 'caucasian',
    body_type: 'athletic',
    height: 185,
    hair_color: 'brunette',
    skin_tone: 'light',
    portrait: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
    fullBody: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=800&fit=crop',
    description: 'Modern urban stil med stark närvaro'
  },
  {
    id: 'pm3',
    name: 'Aisha Mohammed',
    gender: 'female',
    age: 26,
    ethnicity: 'african',
    body_type: 'slim',
    height: 172,
    hair_color: 'black',
    skin_tone: 'dark',
    portrait: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=600&fit=crop',
    fullBody: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=400&h=800&fit=crop',
    description: 'Elegant och sofistikerad med naturlig charm'
  },
  {
    id: 'pm4',
    name: 'Lucas Berg',
    gender: 'male',
    age: 32,
    ethnicity: 'caucasian',
    body_type: 'athletic',
    height: 182,
    hair_color: 'brunette',
    skin_tone: 'tan',
    portrait: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop',
    fullBody: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=800&fit=crop',
    description: 'Mogen och stilren med professionell attityd'
  },
  {
    id: 'pm5',
    name: 'Sofia Lind',
    gender: 'female',
    age: 22,
    ethnicity: 'caucasian',
    body_type: 'slim',
    height: 168,
    hair_color: 'blonde',
    skin_tone: 'fair',
    portrait: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop',
    fullBody: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=800&fit=crop',
    description: 'Fräsch och ung med naturlig skönhet'
  },
  {
    id: 'pm6',
    name: 'Chen Wei',
    gender: 'male',
    age: 27,
    ethnicity: 'asian',
    body_type: 'slim',
    height: 178,
    hair_color: 'black',
    skin_tone: 'light',
    portrait: 'https://images.unsplash.com/photo-1492447166138-50c3889fccb1?w=400&h=600&fit=crop',
    fullBody: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=800&fit=crop',
    description: 'Minimalistisk elegans med asiatisk estetik'
  },
  {
    id: 'pm7',
    name: 'Isabella Rodriguez',
    gender: 'female',
    age: 29,
    ethnicity: 'hispanic',
    body_type: 'curvy',
    height: 170,
    hair_color: 'brunette',
    skin_tone: 'tan',
    portrait: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop',
    fullBody: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=400&h=800&fit=crop',
    description: 'Kurvig och självsäker med latinamerikansk flair'
  },
  {
    id: 'pm8',
    name: 'Oliver Karlsson',
    gender: 'male',
    age: 25,
    ethnicity: 'caucasian',
    body_type: 'average',
    height: 180,
    hair_color: 'blonde',
    skin_tone: 'fair',
    portrait: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
    fullBody: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=800&fit=crop',
    description: 'Casual och tillgänglig nordisk stil'
  },
  {
    id: 'pm9',
    name: 'Zara Hassan',
    gender: 'female',
    age: 31,
    ethnicity: 'middle-eastern',
    body_type: 'athletic',
    height: 173,
    hair_color: 'black',
    skin_tone: 'medium',
    portrait: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=600&fit=crop',
    fullBody: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=400&h=800&fit=crop',
    description: 'Stark och atletisk med mellanöstern elegans'
  },
  {
    id: 'pm10',
    name: 'Erik Nilsson',
    gender: 'male',
    age: 35,
    ethnicity: 'caucasian',
    body_type: 'average',
    height: 183,
    hair_color: 'gray',
    skin_tone: 'light',
    portrait: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=600&fit=crop',
    fullBody: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=800&fit=crop',
    description: 'Mogen och distingerad med grånat hår'
  },
  {
    id: 'pm11',
    name: 'Maya Patel',
    gender: 'female',
    age: 23,
    ethnicity: 'asian',
    body_type: 'slim',
    height: 165,
    hair_color: 'black',
    skin_tone: 'medium',
    portrait: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=600&fit=crop',
    fullBody: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=400&h=800&fit=crop',
    description: 'Ung och dynamisk med indisk bakgrund'
  },
  {
    id: 'pm12',
    name: 'Alex Thompson',
    gender: 'male',
    age: 30,
    ethnicity: 'mixed',
    body_type: 'athletic',
    height: 181,
    hair_color: 'brunette',
    skin_tone: 'tan',
    portrait: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=600&fit=crop',
    fullBody: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=800&fit=crop',
    description: 'Mångkulturell och modern med bred appeal'
  },
  {
    id: 'pm13',
    name: 'Linnea Svensson',
    gender: 'female',
    age: 27,
    ethnicity: 'caucasian',
    body_type: 'average',
    height: 169,
    hair_color: 'red',
    skin_tone: 'fair',
    portrait: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=600&fit=crop',
    fullBody: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=800&fit=crop',
    description: 'Unik med rött hår och nordisk charm'
  },
  {
    id: 'pm14',
    name: 'Jamal Williams',
    gender: 'male',
    age: 26,
    ethnicity: 'african',
    body_type: 'athletic',
    height: 188,
    hair_color: 'black',
    skin_tone: 'dark',
    portrait: 'https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=400&h=600&fit=crop',
    fullBody: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=800&fit=crop',
    description: 'Atletisk och kraftfull med stark närvaro'
  },
  {
    id: 'pm15',
    name: 'Hannah Lee',
    gender: 'female',
    age: 25,
    ethnicity: 'asian',
    body_type: 'slim',
    height: 167,
    hair_color: 'black',
    skin_tone: 'light',
    portrait: 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=400&h=600&fit=crop',
    fullBody: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=400&h=800&fit=crop',
    description: 'Sofistikerad och modern östasiatisk stil'
  },
  {
    id: 'pm16',
    name: 'Daniel Okoye',
    gender: 'male',
    age: 29,
    ethnicity: 'african',
    body_type: 'average',
    height: 179,
    hair_color: 'black',
    skin_tone: 'dark',
    portrait: 'https://images.unsplash.com/photo-1558203728-00f45181dd84?w=400&h=600&fit=crop',
    fullBody: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=800&fit=crop',
    description: 'Varm och tillgänglig afrikansk elegans'
  },
  {
    id: 'pm17',
    name: 'Victoria Borg',
    gender: 'female',
    age: 33,
    ethnicity: 'caucasian',
    body_type: 'curvy',
    height: 171,
    hair_color: 'brunette',
    skin_tone: 'light',
    portrait: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop',
    fullBody: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=400&h=800&fit=crop',
    description: 'Mogen och självsäker plus-size modell'
  },
  {
    id: 'pm18',
    name: 'Ravi Kumar',
    gender: 'male',
    age: 24,
    ethnicity: 'asian',
    body_type: 'slim',
    height: 176,
    hair_color: 'black',
    skin_tone: 'tan',
    portrait: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=600&fit=crop',
    fullBody: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=800&fit=crop',
    description: 'Ung och energisk med sydasiatisk bakgrund'
  },
  {
    id: 'pm19',
    name: 'Amelia Larsson',
    gender: 'female',
    age: 30,
    ethnicity: 'caucasian',
    body_type: 'athletic',
    height: 174,
    hair_color: 'blonde',
    skin_tone: 'light',
    portrait: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop',
    fullBody: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=800&fit=crop',
    description: 'Sportig och aktiv med skandinavisk charm'
  },
  {
    id: 'pm20',
    name: 'Carlos Santos',
    gender: 'male',
    age: 31,
    ethnicity: 'hispanic',
    body_type: 'average',
    height: 177,
    hair_color: 'black',
    skin_tone: 'tan',
    portrait: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400&h=600&fit=crop',
    fullBody: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=800&fit=crop',
    description: 'Varm och karismatisk latinsk stil'
  }
];

const genderLabels = {
  female: 'Kvinna',
  male: 'Man',
  neutral: 'Neutral'
};

const ethnicityLabels = {
  caucasian: 'Kaukasisk',
  african: 'Afrikansk',
  asian: 'Asiatisk',
  hispanic: 'Latinamerikansk',
  'middle-eastern': 'Mellanöstern',
  mixed: 'Blandad'
};

const bodyTypeLabels = {
  slim: 'Smal',
  athletic: 'Atletisk',
  average: 'Genomsnittlig',
  curvy: 'Kurvig',
  'plus-size': 'Plus-size'
};

export default function PreMadeModels({ onSelectModel, selectedModelId, generatedPortraitUrls = {} }) {
  const [viewingModel, setViewingModel] = useState(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-black dark:text-white mb-2">
          Modellbibliotek
        </h2>
        <p className="text-black/60 dark:text-white/60">
          Välj från våra exklusiva förhandsgenererade modeller
        </p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
        {preMadeModels.map((model) => {
          const isSelected = selectedModelId === model.id;
          return (
            <motion.button
              key={model.id}
              onClick={() => {
                if (isSelected) {
                  onSelectModel(null);
                } else {
                  onSelectModel(model);
                }
              }}
              onDoubleClick={() => setViewingModel(model)}
              whileHover={{ scale: 1.05 }}
              className={cn(
                "aspect-[3/4] rounded-xl overflow-hidden relative transition-all group",
                isSelected 
                  ? "ring-2 ring-[#0071e3] ring-offset-2" 
                  : "hover:shadow-lg"
              )}
            >
              <img 
                src={generatedPortraitUrls[model.id] || model.portrait} 
                alt={model.name}
                className="w-full h-full object-cover"
              />
              {isSelected && (
                <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-[#0071e3] flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs font-medium truncate">{model.name}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Model Detail Modal */}
      <AnimatePresence>
        {viewingModel && (
          <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setViewingModel(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-1 overflow-auto">
                <div className="grid md:grid-cols-2 gap-4 p-6">
                  {/* Portrait */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-black/60 dark:text-white/60">Porträtt</h4>
                    <img 
                      src={generatedPortraitUrls[viewingModel.id] || viewingModel.portrait} 
                      alt={`${viewingModel.name} portrait`}
                      className="w-full rounded-xl"
                    />
                  </div>
                  
                  {/* Full Body */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-black/60 dark:text-white/60">Helkropp</h4>
                    <img 
                      src={viewingModel.fullBody} 
                      alt={`${viewingModel.name} full body`}
                      className="w-full rounded-xl"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-black/10 dark:border-white/10 bg-[#f5f5f7] dark:bg-gray-800">
                <h3 className="text-2xl font-semibold text-black dark:text-white mb-2">
                  {viewingModel.name}
                </h3>
                <p className="text-sm text-black/60 dark:text-white/60 mb-4">
                  {viewingModel.description}
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div>
                    <p className="text-xs text-black/40 dark:text-white/40">Kön</p>
                    <p className="text-sm font-medium text-black dark:text-white">
                      {genderLabels[viewingModel.gender]}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-black/40 dark:text-white/40">Ålder</p>
                    <p className="text-sm font-medium text-black dark:text-white">
                      {viewingModel.age} år
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-black/40 dark:text-white/40">Etnicitet</p>
                    <p className="text-sm font-medium text-black dark:text-white">
                      {ethnicityLabels[viewingModel.ethnicity]}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-black/40 dark:text-white/40">Kroppstyp</p>
                    <p className="text-sm font-medium text-black dark:text-white capitalize">
                      {bodyTypeLabels[viewingModel.body_type]}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-black/40 dark:text-white/40">Längd</p>
                    <p className="text-sm font-medium text-black dark:text-white">
                      {viewingModel.height} cm
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-black/40 dark:text-white/40">Hårfärg</p>
                    <p className="text-sm font-medium text-black dark:text-white capitalize">
                      {viewingModel.hair_color}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-black/40 dark:text-white/40">Hudton</p>
                    <p className="text-sm font-medium text-black dark:text-white capitalize">
                      {viewingModel.skin_tone}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      onSelectModel(viewingModel);
                      setViewingModel(null);
                    }}
                    className="flex-1 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full"
                  >
                    Välj modell
                  </Button>
                  <Button
                    onClick={() => setViewingModel(null)}
                    variant="outline"
                    className="flex-1 border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
                  >
                    Stäng
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}