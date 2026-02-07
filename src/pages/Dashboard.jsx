import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Upload, 
  Shirt, 
  Image, 
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  User
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

export default function Dashboard() {
  // Full data for stats
  const { data: allGarments = [] } = useQuery({
    queryKey: ['all-garments'],
    queryFn: () => base44.entities.Garment.list()
  });

  const { data: allGeneratedImages = [] } = useQuery({
    queryKey: ['all-generated-images'],
    queryFn: () => base44.entities.GeneratedImage.list()
  });

  // Limited data for display
  const { data: garments = [], isLoading: garmentsLoading } = useQuery({
    queryKey: ['recent-garments'],
    queryFn: () => base44.entities.Garment.list('-created_date', 5)
  });

  const { data: generatedImages = [], isLoading: imagesLoading } = useQuery({
    queryKey: ['recent-generated-images'],
    queryFn: () => base44.entities.GeneratedImage.list('-created_date', 6)
  });

  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['recent-models'],
    queryFn: () => base44.entities.Model.list('-created_date', 6)
  });

  const stats = [
    { 
      label: 'Uppladdade plagg', 
      value: garments.length, 
      icon: Shirt, 
      color: 'from-blue-500/20 to-blue-600/20',
      iconColor: 'text-blue-400'
    },
    { 
      label: 'Genererade bilder', 
      value: generatedImages.length, 
      icon: Image, 
      color: 'from-purple-500/20 to-purple-600/20',
      iconColor: 'text-purple-400'
    },
    {
      label: 'Denna vecka',
      value: generatedImages.filter(img => {
        if (!img.created_date && !img.createdAt) return false;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const imgDate = new Date(img.created_date || img.createdAt);
        return !isNaN(imgDate.getTime()) && imgDate > weekAgo;
      }).length,
      icon: TrendingUp,
      color: 'from-[#C9A962]/20 to-[#8B7355]/20',
      iconColor: 'text-[#C9A962]'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-black dark:via-gray-900 dark:to-black">
      <div className="max-w-[980px] mx-auto px-5 py-20">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-20"
      >
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-black dark:text-white mb-6 leading-[1.05]">
          One photo in. Every asset out.
        </h1>
        <p className="text-xl sm:text-2xl text-black/60 dark:text-white/60 mb-10 font-normal">
          Skapa professionella modellbilder på sekunder.
        </p>
        <Link to={createPageUrl('Upload')}>
          <motion.button
            className="inline-block bg-[#392599] text-white text-[17px] font-normal rounded-full px-6 py-3 hover:bg-[#4a2fb3] transition-colors"
          >
            Kom igång
          </motion.button>
        </Link>
      </motion.div>





      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4 mb-20"
      >
        <div className="bg-[#f5f5f7] dark:bg-white/5 rounded-2xl p-8">
          <div className="text-4xl font-semibold text-black dark:text-white mb-2">{allGarments.length}</div>
          <div className="text-sm text-black/60 dark:text-white/60">Plagg</div>
        </div>
        <div className="bg-[#f5f5f7] dark:bg-white/5 rounded-2xl p-8">
          <div className="text-4xl font-semibold text-black dark:text-white mb-2">{allGeneratedImages.length}</div>
          <div className="text-sm text-black/60 dark:text-white/60">Genererade</div>
        </div>
        <div className="bg-[#f5f5f7] dark:bg-white/5 rounded-2xl p-8">
          <div className="text-4xl font-semibold text-black dark:text-white mb-2">
            {allGeneratedImages.filter(img => {
              if (!img.created_date && !img.createdAt) return false;
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              const imgDate = new Date(img.created_date || img.createdAt);
              return !isNaN(imgDate.getTime()) && imgDate > weekAgo;
            }).length}
          </div>
          <div className="text-sm text-black/60 dark:text-white/60">Denna vecka</div>
        </div>
      </motion.div>

      <div className="space-y-20">
        {/* Recent Generated Images */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-semibold text-black dark:text-white">Senaste genererade</h2>
            <Link 
              to={createPageUrl('Gallery')}
              className="text-sm text-[#392599] hover:text-[#4a2fb3] transition-colors flex items-center gap-1"
            >
              Visa alla
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          {imagesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-[#f5f5f7] animate-pulse" />
              ))}
            </div>
          ) : generatedImages.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#f5f5f7] text-center">
              <Image className="h-12 w-12 text-black/20 mx-auto mb-4" />
              <p className="text-black/50 mb-6">Inga bilder genererade ännu</p>
              <Link to={createPageUrl('Upload')}>
                <button className="bg-[#392599] text-white px-5 py-2.5 rounded-full hover:bg-[#4a2fb3] transition-colors">
                  Generera bild
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {generatedImages.slice(0, 6).map((image) => (
                <div
                  key={image.id}
                  className="aspect-[3/4] rounded-2xl bg-[#f5f5f7] overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
                >
                  {image.image_url ? (
                    <img 
                      src={image.image_url} 
                      alt="Generated"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-black/20" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Garments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-semibold text-black dark:text-white">Senaste plagg</h2>
            <Link 
              to={createPageUrl('Garments')}
              className="text-sm text-[#392599] hover:text-[#4a2fb3] transition-colors flex items-center gap-1"
            >
              Visa alla
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          {garmentsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="aspect-square rounded-2xl bg-[#f5f5f7] animate-pulse" />
              ))}
            </div>
          ) : garments.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#f5f5f7] text-center">
              <Shirt className="h-12 w-12 text-black/20 mx-auto mb-4" />
              <p className="text-black/50 mb-6">Inga plagg uppladdade ännu</p>
              <Link to={createPageUrl('Upload')}>
                <button className="bg-[#392599] text-white px-5 py-2.5 rounded-full hover:bg-[#4a2fb3] transition-colors">
                  Ladda upp plagg
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {garments.map((garment) => (
                <div key={garment.id} className="group">
                  <div className="aspect-square rounded-2xl bg-[#f5f5f7] overflow-hidden mb-3 hover:shadow-lg transition-shadow">
                    {garment.image_url ? (
                      <img 
                        src={garment.image_url} 
                        alt={garment.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Shirt className="h-8 w-8 text-black/20" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-black text-sm font-medium truncate">{garment.name}</h3>
                  <p className="text-xs text-black/50">
                    {(garment.created_date || garment.createdAt)
                      ? format(new Date(garment.created_date || garment.createdAt), 'd MMM', { locale: sv })
                      : '-'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Models */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-semibold text-black dark:text-white">Senaste modeller</h2>
            <Link 
              to={createPageUrl('Models')}
              className="text-sm text-[#392599] hover:text-[#4a2fb3] transition-colors flex items-center gap-1"
            >
              Visa alla
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          {modelsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-[#f5f5f7] dark:bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : models.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#f5f5f7] dark:bg-white/5 text-center">
              <User className="h-12 w-12 text-black/20 dark:text-white/20 mx-auto mb-4" />
              <p className="text-black/50 dark:text-white/50 mb-6">Inga modeller skapade ännu</p>
              <Link to={createPageUrl('Models')}>
                <button className="bg-[#392599] text-white px-5 py-2.5 rounded-full hover:bg-[#4a2fb3] transition-colors">
                  Skapa modell
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {models.map((model) => (
                <div key={model.id} className="group">
                  <div className="aspect-[3/4] rounded-2xl bg-[#f5f5f7] dark:bg-white/5 overflow-hidden mb-3 hover:shadow-lg transition-shadow">
                    {model.portrait_url || model.image_url ? (
                      <img 
                        src={model.portrait_url || model.image_url} 
                        alt={model.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-8 w-8 text-black/20 dark:text-white/20" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-black dark:text-white text-sm font-medium truncate">{model.name}</h3>
                  <p className="text-xs text-black/50 dark:text-white/50 capitalize">{model.gender === 'female' ? 'Kvinna' : model.gender === 'male' ? 'Man' : 'Neutral'}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </div>
      </div>
    </div>
  );
}