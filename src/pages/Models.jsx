import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Plus, Trash2, User, MoreVertical, Sparkles, Search, Edit, SlidersHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ModelGenerator from '../components/models/ModelGenerator';
import BulkModelGenerator from '../components/models/BulkModelGenerator';
import ModelEditor from '../components/models/ModelEditor';

export default function Models() {
  const queryClient = useQueryClient();
  const [darkMode, setDarkMode] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showBulkGenerator, setShowBulkGenerator] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [editingModel, setEditingModel] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterEthnicity, setFilterEthnicity] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const { data: models = [], isLoading } = useQuery({
    queryKey: ['models'],
    queryFn: () => base44.entities.Model.list('-created_date')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Model.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      setDeleteId(null);
    }
  });

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

  // Filter and search models
  const filteredModels = useMemo(() => {
    return models.filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGender = filterGender === 'all' || model.gender === filterGender;
      const matchesEthnicity = filterEthnicity === 'all' || model.ethnicity === filterEthnicity;
      return matchesSearch && matchesGender && matchesEthnicity;
    });
  }, [models, searchQuery, filterGender, filterEthnicity]);

  return (
    <div className="max-w-[980px] mx-auto px-5 py-20">
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-5xl font-semibold tracking-tight text-black dark:text-white mb-4">
              Modellarkiv
            </h1>
            <p className="text-xl text-black/60 dark:text-white/60">{models.length} sparade modeller</p>
          </div>
          
          <Button
            onClick={() => setShowGenerator(true)}
            className="bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full px-6"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Skapa modell</span>
            <span className="sm:hidden">Skapa</span>
          </Button>
        </div>
      </div>

      {/* Model Generator Modal */}
      {showGenerator && (
        <ModelGenerator
          onClose={() => setShowGenerator(false)}
          onSave={() => {
            setShowGenerator(false);
            queryClient.invalidateQueries({ queryKey: ['models'] });
          }}
          darkMode={darkMode}
        />
      )}

      {/* Bulk Model Generator */}
      {showBulkGenerator && (
        <BulkModelGenerator
          onClose={() => setShowBulkGenerator(false)}
          onSave={() => {
            setShowBulkGenerator(false);
            queryClient.invalidateQueries({ queryKey: ['models'] });
          }}
          darkMode={darkMode}
        />
      )}

      {/* User Created Models Section - First */}
      {models.length > 0 && (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-black dark:text-white mb-2">
                  Dina skapade modeller
                </h2>
                <p className="text-black/60 dark:text-white/60">
                  {filteredModels.length} av {models.length} modeller
                </p>
              </div>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40 dark:text-white/40" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Sök efter modellnamn..."
                  className="pl-10 bg-[#f5f5f7] dark:bg-white/5 border-black/10 dark:border-white/10 text-black dark:text-white"
                />
              </div>

              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 gap-3"
                >
                  <div>
                    <label className="text-xs text-black/60 dark:text-white/60 mb-1.5 block">Kön</label>
                    <select
                      value={filterGender}
                      onChange={(e) => setFilterGender(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#f5f5f7] dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white text-sm"
                    >
                      <option value="all">Alla</option>
                      <option value="female">Kvinna</option>
                      <option value="male">Man</option>
                      <option value="neutral">Neutral</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-black/60 dark:text-white/60 mb-1.5 block">Etnicitet</label>
                    <select
                      value={filterEthnicity}
                      onChange={(e) => setFilterEthnicity(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#f5f5f7] dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white text-sm"
                    >
                      <option value="all">Alla</option>
                      <option value="caucasian">Kaukasisk</option>
                      <option value="african">Afrikansk</option>
                      <option value="asian">Asiatisk</option>
                      <option value="hispanic">Latinamerikansk</option>
                      <option value="middle-eastern">Mellanöstern</option>
                      <option value="mixed">Blandad</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {filteredModels.length === 0 ? (
            <div className="text-center py-12 bg-[#f5f5f7] dark:bg-white/5 rounded-2xl mb-16">
              <Search className="h-12 w-12 text-black/20 dark:text-white/20 mx-auto mb-4" />
              <p className="text-black/60 dark:text-white/60">
                Inga modeller matchar dina filter
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {filteredModels.map((model, index) => (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <button
                  onClick={() => setSelectedModel(model)}
                  className="aspect-[3/4] rounded-2xl overflow-hidden bg-[#f5f5f7] dark:bg-white/5 hover:shadow-lg transition-all w-full relative"
                >
                  {(model.portrait_url || model.image_url) ? (
                    <img 
                      src={model.portrait_url || model.image_url} 
                      alt={model.name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-12 w-12 text-black/20 dark:text-white/20" />
                    </div>
                  )}
                </button>
                
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-black dark:text-white font-medium truncate">{model.name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="secondary" className="bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60 text-xs">
                        {genderLabels[model.gender]}
                      </Badge>
                      <span className="text-xs text-black/40 dark:text-white/40">{model.age} år</span>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/5 flex-shrink-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className={darkMode ? 'bg-gray-800 border-white/10' : 'bg-white border-black/10'}>
                      <DropdownMenuItem 
                        onClick={() => setEditingModel(model)}
                        className={darkMode ? 'text-white hover:bg-white/5' : 'text-black hover:bg-black/5'}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Redigera
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteId(model.id)}
                        className="text-red-500 focus:text-red-500"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Ta bort
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))}
            </div>
            )}

            {/* Divider */}
            <div className="border-t border-black/10 dark:border-white/10 mb-12" />
            </>
            )}

            {/* Model Editor Modal */}
            {editingModel && (
            <ModelEditor
            model={editingModel}
            onClose={() => setEditingModel(null)}
            onSave={() => {
            setEditingModel(null);
            queryClient.invalidateQueries({ queryKey: ['models'] });
            }}
            darkMode={darkMode}
            />
            )}

      {/* Model Detail Modal */}
      {selectedModel && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedModel(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            >
            <div className="flex-1 overflow-auto p-6">
              <div className="rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 max-w-md mx-auto">
                <img 
                  src={selectedModel.portrait_url || selectedModel.image_url} 
                  alt={`${selectedModel.name} - Portrait`}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
            <div className="p-6 border-t border-black/10 dark:border-white/10">
              <h3 className="text-2xl font-semibold text-black dark:text-white mb-2">{selectedModel.name}</h3>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary" className="bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60">
                  {genderLabels[selectedModel.gender]}
                </Badge>
                <span className="text-sm text-black/60 dark:text-white/60">{selectedModel.age} år</span>
                <span className="text-sm text-black/60 dark:text-white/60 capitalize">{selectedModel.ethnicity}</span>
                <span className="text-sm text-black/60 dark:text-white/60 capitalize">{selectedModel.body_type}</span>
              </div>
              <Button
                onClick={() => setSelectedModel(null)}
                className="w-full bg-black hover:bg-black/90 text-white rounded-full"
              >
                Stäng
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white border-black/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort modell</AlertDialogTitle>
            <AlertDialogDescription className="text-black/60">
              Är du säker på att du vill ta bort denna modell? Denna åtgärd kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-black/5 border-black/10 hover:bg-black/10">
              Avbryt
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}