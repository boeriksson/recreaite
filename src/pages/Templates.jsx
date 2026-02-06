import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus,
  Download,
  Upload,
  Trash2,
  Edit2,
  Copy,
  FileText,
  Sparkles,
  Loader2,
  X,
  Check,
  Search
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { SignedImage } from "@/components/ui/SignedImage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import SiteScanner from '../components/dashboard/SiteScanner';

export default function Templates() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.Template.list('-created_date')
  });

  const { data: models = [] } = useQuery({
    queryKey: ['models'],
    queryFn: () => base44.entities.Model.list()
  });

  const { data: seeds = [] } = useQuery({
    queryKey: ['brand-seeds'],
    queryFn: () => base44.entities.BrandSeed.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Template.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowCreateModal(false);
      setEditingTemplate(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Template.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setEditingTemplate(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Template.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setDeleteId(null);
    }
  });

  const handleExport = (template) => {
    const exportData = {
      name: template.name,
      description: template.description,
      category: template.category,
      configuration: template.configuration,
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${template.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      await createMutation.mutateAsync({
        name: importData.name + ' (Importerad)',
        description: importData.description,
        category: importData.category,
        configuration: importData.configuration
      });
    } catch (error) {
      console.error('Import failed:', error);
      alert('Kunde inte importera mall. Kontrollera att filen är korrekt.');
    }
  };

  const handleDuplicate = async (template) => {
    await createMutation.mutateAsync({
      name: template.name + ' (Kopia)',
      description: template.description,
      category: template.category,
      configuration: template.configuration,
      thumbnail_url: template.thumbnail_url
    });
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getModelName = (modelId) => {
    const model = models.find(m => m.id === modelId);
    return model?.name || 'Okänd modell';
  };

  const getSeedName = (seedId) => {
    const seed = seeds.find(s => s.id === seedId);
    return seed?.name || 'Ingen seed';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-black dark:text-white mb-2">Mallar & Seeds</h1>
        <p className="text-black/60 dark:text-white/60">
          Spara och återanvänd kampanjkonfigurationer och varumärkesstilar
        </p>
      </div>

      {/* Site Scanner */}
      <div className="mb-12">
        <SiteScanner />
      </div>

      {/* Actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40 dark:text-white/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sök mallar..."
            className="pl-10 bg-white dark:bg-white/5 border-black/10 dark:border-white/10"
          />
        </div>
        <div className="flex gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-white/5 border-black/10 dark:border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla kategorier</SelectItem>
              <SelectItem value="campaign">Kampanj</SelectItem>
              <SelectItem value="product_category">Produktkategori</SelectItem>
              <SelectItem value="seasonal">Säsong</SelectItem>
              <SelectItem value="brand_style">Varumärkesstil</SelectItem>
              <SelectItem value="custom">Anpassad</SelectItem>
            </SelectContent>
          </Select>
          
          <label>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <Button variant="outline" className="border-black/10 dark:border-white/10" asChild>
              <span className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Importera
              </span>
            </Button>
          </label>
          
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#0071e3] hover:bg-[#0077ED] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ny mall
          </Button>
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="aspect-[4/3] rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-16 w-16 text-white/20 mx-auto mb-4" />
          <h2 className="text-xl text-white mb-2">Inga mallar ännu</h2>
          <p className="text-white/60 mb-6">
            Skapa din första mall för att snabbt återanvända konfigurationer
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Skapa mall
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden hover:border-[#0071e3] transition-all"
            >
              {/* Preview */}
              <div className="aspect-[4/3] bg-gradient-to-br from-[#0071e3]/20 to-[#C9A962]/20 flex items-center justify-center">
                {template.thumbnail_url ? (
                  <SignedImage src={template.thumbnail_url} alt={template.name} className="w-full h-full object-cover" />
                ) : (
                  <Sparkles className="h-12 w-12 text-black/20 dark:text-white/20" />
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-black dark:text-white mb-1 truncate">
                      {template.name}
                    </h3>
                    <p className="text-xs text-black/60 dark:text-white/60 capitalize">
                      {template.category.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>

                {template.description && (
                  <p className="text-sm text-black/60 dark:text-white/60 line-clamp-2 mb-3">
                    {template.description}
                  </p>
                )}

                {/* Config Preview */}
                <div className="mb-3 space-y-1 text-xs">
                  {template.configuration.model_id && (
                    <div className="flex items-center gap-2 text-black/60 dark:text-white/60">
                      <span>Modell:</span>
                      <span className="font-medium text-black dark:text-white">
                        {getModelName(template.configuration.model_id)}
                      </span>
                    </div>
                  )}
                  {template.configuration.gender && !template.configuration.model_id && (
                    <div className="flex items-center gap-2 text-black/60 dark:text-white/60">
                      <span>Kön:</span>
                      <span className="font-medium text-black dark:text-white capitalize">
                        {template.configuration.gender === 'female' ? 'Kvinna' : template.configuration.gender === 'male' ? 'Man' : 'Neutral'}
                      </span>
                    </div>
                  )}
                  {template.configuration.environment && (
                    <div className="flex items-center gap-2 text-black/60 dark:text-white/60">
                      <span>Miljö:</span>
                      <span className="font-medium text-black dark:text-white capitalize">
                        {template.configuration.environment.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                  {template.configuration.brand_seed_id && (
                    <div className="flex items-center gap-2 text-black/60 dark:text-white/60">
                      <span>Seed:</span>
                      <span className="font-medium text-black dark:text-white">
                        {getSeedName(template.configuration.brand_seed_id)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-black/40 dark:text-white/40 mb-3">
                  <span>Använd {template.usage_count || 0} ggr</span>
                  {template.last_used && (
                    <span>• {format(new Date(template.last_used), 'd MMM', { locale: sv })}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link to={createPageUrl('Upload') + `?template=${template.id}`} className="flex-1">
                    <Button className="w-full bg-[#0071e3] hover:bg-[#0077ED] text-white text-sm">
                      Använd mall
                    </Button>
                  </Link>
                  <Button
                    onClick={() => handleDuplicate(template)}
                    size="icon"
                    variant="outline"
                    className="border-black/10 dark:border-white/10"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleExport(template)}
                    size="icon"
                    variant="outline"
                    className="border-black/10 dark:border-white/10"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setEditingTemplate(template)}
                    size="icon"
                    variant="outline"
                    className="border-black/10 dark:border-white/10"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setDeleteId(template.id)}
                    size="icon"
                    variant="outline"
                    className="border-red-500/50 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingTemplate) && (
          <TemplateModal
            template={editingTemplate}
            models={models}
            seeds={seeds}
            onClose={() => {
              setShowCreateModal(false);
              setEditingTemplate(null);
            }}
            onSave={async (data) => {
              if (editingTemplate) {
                await updateMutation.mutateAsync({ id: editingTemplate.id, data });
              } else {
                await createMutation.mutateAsync(data);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#1A1A1A] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Ta bort mall</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Är du säker på att du vill ta bort denna mall? Denna åtgärd kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 text-white border-white/20 hover:bg-white/20">
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

function TemplateModal({ template, models, seeds, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || 'campaign',
    configuration: template?.configuration || {
      model_id: '',
      gender: '',
      environment: 'studio',
      custom_environment: '',
      brand_seed_id: '',
      use_seed_environment: false,
      custom_prompt: ''
    }
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#1A1A1A] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#1A1A1A] border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {template ? 'Redigera mall' : 'Skapa ny mall'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <Label className="text-white/80">Namn *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="T.ex. Sommarkampanj 2025"
              className="mt-2 bg-white/5 border-white/10 text-white"
            />
          </div>

          <div>
            <Label className="text-white/80">Beskrivning</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Beskriv vad denna mall används till..."
              className="mt-2 bg-white/5 border-white/10 text-white min-h-[80px]"
            />
          </div>

          <div>
            <Label className="text-white/80">Kategori *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="mt-2 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="campaign">Kampanj</SelectItem>
                <SelectItem value="product_category">Produktkategori</SelectItem>
                <SelectItem value="seasonal">Säsong</SelectItem>
                <SelectItem value="brand_style">Varumärkesstil</SelectItem>
                <SelectItem value="custom">Anpassad</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Configuration */}
          <div className="pt-4 border-t border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Konfiguration</h3>

            <div className="space-y-4">
              <div>
                <Label className="text-white/80">Modell</Label>
                <Select
                  value={formData.configuration.model_id}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    configuration: { ...formData.configuration, model_id: value, gender: '' }
                  })}
                >
                  <SelectTrigger className="mt-2 bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Välj modell (valfritt)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Ingen specifik modell</SelectItem>
                    {models.map(model => (
                      <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!formData.configuration.model_id && (
                <div>
                  <Label className="text-white/80">Kön</Label>
                  <Select
                    value={formData.configuration.gender}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      configuration: { ...formData.configuration, gender: value }
                    })}
                  >
                    <SelectTrigger className="mt-2 bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Välj kön (valfritt)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Inget kön valt</SelectItem>
                      <SelectItem value="female">Kvinna</SelectItem>
                      <SelectItem value="male">Man</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label className="text-white/80">Miljö</Label>
                <Select
                  value={formData.configuration.environment}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    configuration: { ...formData.configuration, environment: value }
                  })}
                >
                  <SelectTrigger className="mt-2 bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="urban">Urban</SelectItem>
                    <SelectItem value="minimal">Minimalistisk</SelectItem>
                    <SelectItem value="nature">Natur</SelectItem>
                    <SelectItem value="ugc">UGC</SelectItem>
                    <SelectItem value="ugc_selfie">UGC Selfie</SelectItem>
                    <SelectItem value="custom">Anpassad</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.configuration.environment === 'custom' && (
                <div>
                  <Label className="text-white/80">Anpassad miljö</Label>
                  <Textarea
                    value={formData.configuration.custom_environment}
                    onChange={(e) => setFormData({
                      ...formData,
                      configuration: { ...formData.configuration, custom_environment: e.target.value }
                    })}
                    placeholder="Beskriv miljön..."
                    className="mt-2 bg-white/5 border-white/10 text-white min-h-[60px]"
                  />
                </div>
              )}

              <div>
                <Label className="text-white/80">Brand Seed</Label>
                <Select
                  value={formData.configuration.brand_seed_id}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    configuration: { ...formData.configuration, brand_seed_id: value }
                  })}
                >
                  <SelectTrigger className="mt-2 bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Välj seed (valfritt)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Ingen seed</SelectItem>
                    {seeds.map(seed => (
                      <SelectItem key={seed.id} value={seed.id}>{seed.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.configuration.brand_seed_id && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.configuration.use_seed_environment}
                    onChange={(e) => setFormData({
                      ...formData,
                      configuration: { ...formData.configuration, use_seed_environment: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <Label className="text-white/80 text-sm">Använd seedens miljö</Label>
                </div>
              )}

              <div>
                <Label className="text-white/80">Anpassad prompt (valfritt)</Label>
                <Textarea
                  value={formData.configuration.custom_prompt}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuration: { ...formData.configuration, custom_prompt: e.target.value }
                  })}
                  placeholder="Expert-läge prompt..."
                  className="mt-2 bg-white/5 border-white/10 text-white min-h-[80px]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#1A1A1A] border-t border-white/10 p-6 flex justify-end gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-white/10 text-white hover:bg-white/10"
          >
            Avbryt
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.name.trim() || saving}
            className="bg-[#0071e3] hover:bg-[#0077ED] text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sparar...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {template ? 'Uppdatera' : 'Skapa mall'}
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}