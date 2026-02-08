import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/amplifyClient';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';
import {
  Image,
  Download,
  Trash2,
  X,
  Sparkles,
  Calendar,
  ZoomIn,
  Edit3,
  Info,
  Loader2,
  Search,
  Filter,
  ChevronDown,
  Tag
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { SignedImage } from "@/components/ui/SignedImage";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
import { format } from 'date-fns';
import { sv, enUS } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ImageRefinementPanel from '../components/generation/ImageRefinementPanel';
import { useLanguage } from '../components/LanguageContext';
import AICategorizationPanel from '../components/gallery/AICategorizationPanel';

export default function Gallery() {
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();
  const [selectedImage, setSelectedImage] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [fullScale, setFullScale] = useState(false);
  const [infoImage, setInfoImage] = useState(null);
  const [styleDescription, setStyleDescription] = useState(null);
  const [loadingStyleDescription, setLoadingStyleDescription] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerationProgress, setRegenerationProgress] = useState(0);
  const [descriptionLanguage, setDescriptionLanguage] = useState('sv');
  const [translatedDescription, setTranslatedDescription] = useState(null);
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const imagePreviewRef = React.useRef(null);
  const [generatingVariations, setGeneratingVariations] = useState(false);
  const [variationCount, setVariationCount] = useState(3);
  const [generatingGarmentDescription, setGeneratingGarmentDescription] = useState(null);
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Prevent body scroll when lightbox is open
  React.useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedImage]);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGarments, setSelectedGarments] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [dateRange, setDateRange] = useState('all'); // all, today, week, month
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 24;

  React.useEffect(() => {
    if (isRegenerating && imagePreviewRef.current) {
      setTimeout(() => {
        imagePreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isRegenerating]);

  const { data: allImages = [], isLoading } = useQuery({
    queryKey: ['generated-images'],
    queryFn: () => base44.entities.GeneratedImage.list('-created_date'),
    refetchInterval: 5000, // Poll every 5 seconds as fallback for subscriptions
  });

  // Subscribe to real-time updates
  React.useEffect(() => {
    console.log('Setting up GeneratedImage subscription...');
    const unsubscribe = base44.entities.GeneratedImage.subscribe((event) => {
      console.log('Subscription event received:', event.type, event.data?.id);
      queryClient.invalidateQueries({ queryKey: ['generated-images'] });
    });
    return unsubscribe;
  }, [queryClient]);

  // Separate processing and completed images, sorted by creation date (newest first)
  const sortByDate = (a, b) => {
    const dateA = new Date(a.created_date || a.createdAt || 0);
    const dateB = new Date(b.created_date || b.createdAt || 0);
    return dateB - dateA; // Newest first
  };

  const processingImages = allImages
    .filter(img => img.status === 'processing' || img.status === 'pending')
    .sort(sortByDate);
  const images = allImages
    .filter(img => img.status === 'completed' && img.image_url && img.image_url !== null)
    .sort(sortByDate);

  // Debug logging
  React.useEffect(() => {
    console.log('Gallery: Total images:', allImages.length,
      '| Processing:', processingImages.length,
      '| Completed:', images.length);
    if (processingImages.length > 0) {
      console.log('Processing images:', processingImages.map(img => ({ id: img.id, status: img.status })));
    }
  }, [allImages, processingImages, images]);

  const { data: garments = [] } = useQuery({
    queryKey: ['garments'],
    queryFn: () => base44.entities.Garment.list()
  });

  const { data: models = [] } = useQuery({
    queryKey: ['models'],
    queryFn: () => base44.entities.Model.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GeneratedImage.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-images'] });
      setDeleteId(null);
    }
  });

  const batchDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => base44.entities.GeneratedImage.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-images'] });
      setSelectedIds([]);
      setSelectionMode(false);
    }
  });

  const updateImageMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GeneratedImage.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-images'] });
    }
  });

  const getGarment = (garmentId) => {
    return garments.find(g => g.id === garmentId);
  };

  const handleDownload = async (imageUrl, imageName) => {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${imageName || 'generated'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleBatchDownload = async () => {
    const selectedImages = filteredAndSearchedImages.filter(img => selectedIds.includes(img.id));

    if (selectedImages.length === 0) return;

    setDownloadingZip(true);
    try {
      const zip = new JSZip();

      // Fetch all images in parallel
      const imagePromises = selectedImages.map(async (image, index) => {
        try {
          const response = await fetch(image.image_url);
          const blob = await response.blob();
          const garment = getGarment(image.garment_id);
          const fileName = `${index + 1}_${garment?.name || 'image'}_${image.id.slice(0, 8)}.png`;
          zip.file(fileName, blob);
        } catch (error) {
          console.error(`Failed to fetch image ${image.id}:`, error);
        }
      });

      await Promise.all(imagePromises);

      // Generate and download zip
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `heylook_images_${format(new Date(), 'yyyy-MM-dd')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to create ZIP:', error);
    } finally {
      setDownloadingZip(false);
    }
  };

  const generateStyleDescription = async (imageUrl) => {
    setLoadingStyleDescription(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: 'Analysera denna outfit och beskriv stilen professionellt. Ge en kort, säljande beskrivning (2-3 meningar) som passar för e-handel. Fokusera på helhetsintrycket, stilkänslan och hur plaggen kompletterar varandra.',
        file_urls: [imageUrl],
        response_json_schema: {
          type: 'object',
          properties: {
            style_description: { type: 'string', description: 'Professionell beskrivning av outfitens stil och känsla' },
            vibe: { type: 'string', description: 'Stilkänsla i ett ord, t.ex. "Elegant", "Casual", "Urban"' }
          }
        }
      });
      setStyleDescription(result);
    } catch (error) {
      console.error('Failed to generate style description:', error);
    } finally {
      setLoadingStyleDescription(false);
    }
  };

  const translateDescription = async (text, targetLang) => {
    setLoadingTranslation(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: targetLang === 'en'
          ? `Translate this product description to English. Keep it professional and suitable for e-commerce: "${text}"`
          : `Översätt denna produktbeskrivning till svenska. Håll den professionell och lämplig för e-handel: "${text}"`,
        response_json_schema: {
          type: 'object',
          properties: {
            translated_text: { type: 'string' }
          }
        }
      });
      setTranslatedDescription(result.translated_text);
    } catch (error) {
      console.error('Failed to translate:', error);
    } finally {
      setLoadingTranslation(false);
    }
  };

  const generateImageVariations = async (image) => {
    setGeneratingVariations(true);
    try {
      const promises = Array.from({ length: variationCount }, async () => {
        const result = await base44.integrations.Core.GenerateImage({
          prompt: `${image.prompt_used}. Create a slightly different variation with similar style and composition.`,
          existing_image_urls: [image.image_url]
        });

        await base44.entities.GeneratedImage.create({
          garment_id: image.garment_id,
          garment_urls: image.garment_urls,
          model_type: image.model_type,
          image_url: result.url,
          prompt_used: image.prompt_used,
          status: 'completed',
          ai_analysis: image.ai_analysis,
          collection_id: image.collection_id,
          tags: image.tags,
          metadata: image.metadata
        });
      });

      await Promise.all(promises);
      queryClient.invalidateQueries({ queryKey: ['generated-images'] });
    } catch (error) {
      console.error('Failed to generate variations:', error);
    } finally {
      setGeneratingVariations(false);
    }
  };

  const generateGarmentDescription = async (garmentId) => {
    setGeneratingGarmentDescription(garmentId);
    try {
      const garment = getGarment(garmentId);
      if (!garment?.image_url) return;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: 'Analysera detta plagg och skapa en professionell produktbeskrivning för e-handel. Fokusera på stil, material, passform och hur den kan kombineras. Håll det till 2-3 meningar.',
        file_urls: [garment.image_url],
        response_json_schema: {
          type: 'object',
          properties: {
            description: { type: 'string' }
          }
        }
      });

      await base44.entities.Garment.update(garmentId, {
        ai_description: result.description
      });

      queryClient.invalidateQueries({ queryKey: ['garments'] });
    } catch (error) {
      console.error('Failed to generate garment description:', error);
    } finally {
      setGeneratingGarmentDescription(null);
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(paginatedImages.map(img => img.id));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  // Get all unique AI categories and tags from images
  const allAICategories = useMemo(() => {
    const categories = new Set();
    images.forEach(img => {
      img.ai_categories?.forEach(cat => categories.add(cat));
    });
    return Array.from(categories).sort();
  }, [images]);

  const allAITags = useMemo(() => {
    const tags = new Set();
    images.forEach(img => {
      img.ai_tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [images]);

  // Filter and search logic
  const filteredAndSearchedImages = useMemo(() => {
    let result = images;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(img => {
        const garment = getGarment(img.garment_id);
        const garmentMatch = garment?.name?.toLowerCase().includes(query) ||
                            garment?.brand?.toLowerCase().includes(query) ||
                            garment?.sku?.toLowerCase().includes(query);
        const promptMatch = img.prompt_used?.toLowerCase().includes(query);
        const categoryMatch = img.ai_categories?.some(cat => cat.toLowerCase().includes(query));
        const tagMatch = img.ai_tags?.some(tag => tag.toLowerCase().includes(query));
        return garmentMatch || promptMatch || categoryMatch || tagMatch;
      });
    }

    // Garment filter
    if (selectedGarments.length > 0) {
      result = result.filter(img => selectedGarments.includes(img.garment_id));
    }

    // Model filter
    if (selectedModels.length > 0) {
      result = result.filter(img => selectedModels.includes(img.model_type));
    }

    // AI Category filter
    if (selectedCategories.length > 0) {
      result = result.filter(img =>
        img.ai_categories?.some(cat => selectedCategories.includes(cat))
      );
    }

    // AI Tag filter
    if (selectedTags.length > 0) {
      result = result.filter(img =>
        img.ai_tags?.some(tag => selectedTags.includes(tag))
      );
    }

    // Date filter
    if (dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      result = result.filter(img => {
        const imgDate = new Date(img.created_date || img.createdAt);
        if (dateRange === 'today') return imgDate >= today;
        if (dateRange === 'week') return imgDate >= weekAgo;
        if (dateRange === 'month') return imgDate >= monthAgo;
        return true;
      });
    }

    return result;
  }, [images, searchQuery, selectedGarments, selectedModels, selectedCategories, selectedTags, dateRange, garments]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSearchedImages.length / imagesPerPage);
  const paginatedImages = useMemo(() => {
    const startIndex = (currentPage - 1) * imagesPerPage;
    return filteredAndSearchedImages.slice(startIndex, startIndex + imagesPerPage);
  }, [filteredAndSearchedImages, currentPage, imagesPerPage]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGarments, selectedModels, selectedCategories, selectedTags, dateRange]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedGarments([]);
    setSelectedModels([]);
    setSelectedCategories([]);
    setSelectedTags([]);
    setDateRange('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || selectedGarments.length > 0 || selectedModels.length > 0 || selectedCategories.length > 0 || selectedTags.length > 0 || dateRange !== 'all';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-light text-black dark:text-white mb-1">{t.gallery}</h1>
            <p className="text-black/60 dark:text-white/60">
              {selectionMode && selectedIds.length > 0
                ? t.selectedOf?.replace('{selected}', selectedIds.length).replace('{total}', filteredAndSearchedImages.length) || `${selectedIds.length} valda av ${filteredAndSearchedImages.length}`
                : `${filteredAndSearchedImages.length} ${language === 'sv' ? 'av' : 'of'} ${images.length} ${t.generatedImages || 'genererade bilder'}`}
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectionMode(!selectionMode);
              setSelectedIds([]);
            }}
            variant="outline"
            className="border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
          >
            {selectionMode ? (t.cancel || 'Avbryt') : (t.selectMultiple || 'Välj flera')}
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40 dark:text-white/40" />
            <Input
              placeholder={language === 'sv' ? 'Sök på plagg, märke, SKU eller prompt...' : 'Search by garment, brand, SKU or prompt...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 bg-white dark:bg-white/5 border-black/10 dark:border-white/10"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Garment Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-black/20 dark:border-white/20">
                  <Filter className="h-4 w-4 mr-2" />
                  {language === 'sv' ? 'Plagg' : 'Garments'}
                  {selectedGarments.length > 0 && ` (${selectedGarments.length})`}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 max-h-80 overflow-y-auto">
                <DropdownMenuLabel>{language === 'sv' ? 'Välj plagg' : 'Select garments'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {garments.map(garment => (
                  <DropdownMenuCheckboxItem
                    key={garment.id}
                    checked={selectedGarments.includes(garment.id)}
                    onCheckedChange={(checked) => {
                      setSelectedGarments(prev =>
                        checked ? [...prev, garment.id] : prev.filter(id => id !== garment.id)
                      );
                    }}
                  >
                    {garment.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Model Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-black/20 dark:border-white/20">
                  <Filter className="h-4 w-4 mr-2" />
                  {language === 'sv' ? 'Modell' : 'Model'}
                  {selectedModels.length > 0 && ` (${selectedModels.length})`}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 max-h-80 overflow-y-auto">
                <DropdownMenuLabel>{language === 'sv' ? 'Välj modell' : 'Select model'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {models.map(model => (
                  <DropdownMenuCheckboxItem
                    key={model.id}
                    checked={selectedModels.includes(model.id)}
                    onCheckedChange={(checked) => {
                      setSelectedModels(prev =>
                        checked ? [...prev, model.id] : prev.filter(id => id !== model.id)
                      );
                    }}
                  >
                    {model.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* AI Category Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-black/20 dark:border-white/20">
                  <Sparkles className="h-4 w-4 mr-2" />
                  {language === 'sv' ? 'Kategori' : 'Category'}
                  {selectedCategories.length > 0 && ` (${selectedCategories.length})`}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 max-h-80 overflow-y-auto">
                <DropdownMenuLabel>{language === 'sv' ? 'AI-kategorier' : 'AI Categories'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allAICategories.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-black/40 dark:text-white/40">
                    {language === 'sv' ? 'Inga kategorier ännu' : 'No categories yet'}
                  </div>
                ) : (
                  allAICategories.map(category => (
                    <DropdownMenuCheckboxItem
                      key={category}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={(checked) => {
                        setSelectedCategories(prev =>
                          checked ? [...prev, category] : prev.filter(c => c !== category)
                        );
                      }}
                    >
                      {category}
                    </DropdownMenuCheckboxItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* AI Tag Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-black/20 dark:border-white/20">
                  <Tag className="h-4 w-4 mr-2" />
                  {language === 'sv' ? 'Taggar' : 'Tags'}
                  {selectedTags.length > 0 && ` (${selectedTags.length})`}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 max-h-80 overflow-y-auto">
                <DropdownMenuLabel>{language === 'sv' ? 'AI-taggar' : 'AI Tags'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allAITags.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-black/40 dark:text-white/40">
                    {language === 'sv' ? 'Inga taggar ännu' : 'No tags yet'}
                  </div>
                ) : (
                  allAITags.map(tag => (
                    <DropdownMenuCheckboxItem
                      key={tag}
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={(checked) => {
                        setSelectedTags(prev =>
                          checked ? [...prev, tag] : prev.filter(t => t !== tag)
                        );
                      }}
                    >
                      {tag}
                    </DropdownMenuCheckboxItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Date Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-black/20 dark:border-white/20">
                  <Calendar className="h-4 w-4 mr-2" />
                  {language === 'sv' ? 'Datum' : 'Date'}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuCheckboxItem
                  checked={dateRange === 'all'}
                  onCheckedChange={() => setDateRange('all')}
                >
                  {language === 'sv' ? 'Alla' : 'All time'}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={dateRange === 'today'}
                  onCheckedChange={() => setDateRange('today')}
                >
                  {language === 'sv' ? 'Idag' : 'Today'}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={dateRange === 'week'}
                  onCheckedChange={() => setDateRange('week')}
                >
                  {language === 'sv' ? 'Senaste veckan' : 'Last week'}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={dateRange === 'month'}
                  onCheckedChange={() => setDateRange('month')}
                >
                  {language === 'sv' ? 'Senaste månaden' : 'Last month'}
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                onClick={clearAllFilters}
                variant="ghost"
                size="sm"
                className="text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
              >
                <X className="h-4 w-4 mr-1" />
                {language === 'sv' ? 'Rensa filter' : 'Clear filters'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Batch Actions */}
      {selectionMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl flex items-center gap-3 flex-wrap"
        >
          <Button
            onClick={selectAll}
            variant="ghost"
            size="sm"
            className="text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
          >
            {t.selectAll || 'Markera alla'}
          </Button>
          <Button
            onClick={deselectAll}
            variant="ghost"
            size="sm"
            className="text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
          >
            {t.deselectAll || 'Avmarkera alla'}
          </Button>
          <div className="flex-1" />
          <Button
            onClick={handleBatchDownload}
            disabled={selectedIds.length === 0 || downloadingZip}
            className="bg-[#392599] hover:bg-[#4a2fb3] text-white"
          >
            {downloadingZip ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {t.download || 'Ladda ner'} ({selectedIds.length})
          </Button>
          <Button
            onClick={() => setDeleteId('batch')}
            disabled={selectedIds.length === 0}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t.delete || 'Ta bort'} ({selectedIds.length})
          </Button>
        </motion.div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filteredAndSearchedImages.length === 0 ? (
        <div className="text-center py-16">
          <Image className="h-16 w-16 text-black/20 dark:text-white/20 mx-auto mb-4" />
          <h2 className="text-xl text-black dark:text-white mb-2">
            {images.length === 0
              ? (t.noImagesYet || 'Inga bilder genererade ännu')
              : (language === 'sv' ? 'Inga bilder matchar filtren' : 'No images match filters')}
          </h2>
          <p className="text-black/60 dark:text-white/60 mb-6">
            {images.length === 0
              ? (t.uploadGarmentAndGenerate || 'Ladda upp ett plagg och generera din första bild')
              : (language === 'sv' ? 'Prova att justera dina filter eller sök' : 'Try adjusting your filters or search')}
          </p>
          {images.length === 0 ? (
            <Link to={createPageUrl('Upload')}>
              <Button className="bg-[#C9A962] hover:bg-[#B89952] text-black font-medium rounded-full">
                <Sparkles className="h-4 w-4 mr-2" />
                {t.generateImage || 'Generera bild'}
              </Button>
            </Link>
          ) : (
            <Button onClick={clearAllFilters} variant="outline">
              <X className="h-4 w-4 mr-2" />
              {language === 'sv' ? 'Rensa alla filter' : 'Clear all filters'}
            </Button>
          )}
        </div>
      ) : (
        <>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Processing Images */}
          {processingImages.map((image) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-[#392599]/20 to-[#392599]/10 border-2 border-[#392599]/30 flex items-center justify-center relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#392599]/30 to-transparent animate-pulse" />
              <div className="relative z-10 text-center p-4">
                <div className="h-12 w-12 rounded-full bg-[#392599]/20 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="h-6 w-6 animate-pulse text-[#392599]" />
                </div>
                <p className="text-sm font-medium text-[#392599]">{t.generating || 'Genererar'}</p>
                <p className="text-xs text-[#392599]/60 mt-1">{t.comingSoon || 'Kommer snart...'}</p>
              </div>
            </motion.div>
          ))}

          {/* Completed Images */}
          {paginatedImages.map((image, index) => {
            const garment = getGarment(image.garment_id);
            return (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
              >
                <div
                  className={`aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 border transition-all cursor-pointer relative ${
                    selectionMode && selectedIds.includes(image.id)
                      ? 'border-[#392599] ring-2 ring-[#392599]/50'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => selectionMode ? toggleSelection(image.id) : setSelectedImage(image)}
                >
                  {image.image_url ? (
                    <SignedImage
                      src={image.image_url}
                      alt="Generated"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="h-12 w-12 text-white/20" />
                    </div>
                  )}

                  {/* Selection Checkbox */}
                  {selectionMode && (
                    <div className="absolute top-3 left-3 z-10">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors ${
                        selectedIds.includes(image.id)
                          ? 'bg-[#392599]'
                          : 'bg-white/20 backdrop-blur-sm'
                      }`}>
                        {selectedIds.includes(image.id) && (
                          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Info Button */}
                  {!selectionMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoImage(image);
                        setStyleDescription(null);
                        setDescriptionLanguage('sv');
                        setTranslatedDescription(null);
                        if (image.garment_urls && image.garment_urls.length > 0) {
                          generateStyleDescription(image.image_url);
                        }
                      }}
                      className="absolute top-3 left-3 z-10 h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Info className="h-4 w-4 text-white" />
                    </button>
                  )}

                  {/* Delete Button */}
                  {!selectionMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(image.id);
                      }}
                      className="absolute top-3 left-1/2 -translate-x-1/2 z-10 h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                  )}

                  {/* Hover Overlay with Info */}
                  {!selectionMode && (
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#392599] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-2xl flex flex-col justify-end p-4">
                      <h3 className="text-white font-medium truncate">
                        {garment?.name || (t.unknownGarment || 'Okänt plagg')}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-white/80 mt-1">
                        <Calendar className="h-3 w-3" />
                        {(image.created_date || image.createdAt)
                          ? format(new Date(image.created_date || image.createdAt), 'd MMMM yyyy', { locale: language === 'sv' ? sv : enUS })
                          : '-'}
                      </div>
                    </div>
                  )}

                  {/* Zoom indicator */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                      <ZoomIn className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="border-black/20 dark:border-white/20"
            >
              {language === 'sv' ? 'Föregående' : 'Previous'}
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className={currentPage === pageNum
                      ? "bg-[#392599] hover:bg-[#4a2fb3] text-white"
                      : "border-black/20 dark:border-white/20"}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              className="border-black/20 dark:border-white/20"
            >
              {language === 'sv' ? 'Nästa' : 'Next'}
            </Button>
          </div>
        )}
        </>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black overflow-y-auto overscroll-contain"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedImage(null);
                setFullScale(false);
              }
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
                setFullScale(false);
              }}
              className="fixed top-4 sm:top-6 right-4 sm:right-6 z-20 p-3 bg-white/90 hover:bg-white rounded-lg transition-colors shadow-lg"
            >
              <X className="h-6 w-6 text-black" />
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="min-h-screen flex flex-col pt-20 pb-32 sm:pb-24"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex-1 flex justify-center items-start sm:items-center px-4"
                onClick={() => setFullScale(!fullScale)}
              >
                <SignedImage
                  src={selectedImage.image_url}
                  alt="Generated"
                  className={`${fullScale ? 'cursor-zoom-out w-full' : 'max-w-full max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-200px)] object-contain cursor-zoom-in'}`}
                />
              </div>

              <div className="fixed bottom-0 left-0 right-0 flex flex-col gap-3 p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
                {/* AI Variations Section */}
                <div className="flex items-center gap-3 justify-center">
                  <div className="flex items-center gap-2">
                    <label className="text-white text-sm">
                      {language === 'sv' ? 'Variationer:' : 'Variations:'}
                    </label>
                    <select
                      value={variationCount}
                      onChange={(e) => setVariationCount(Number(e.target.value))}
                      className="px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5</option>
                    </select>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      generateImageVariations(selectedImage);
                    }}
                    disabled={generatingVariations}
                    className="bg-[#C9A962] hover:bg-[#B89952] text-black font-medium rounded-full"
                  >
                    {generatingVariations ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {language === 'sv' ? 'Genererar...' : 'Generating...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        {language === 'sv' ? 'Skapa variationer' : 'Create variations'}
                      </>
                    )}
                  </Button>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingImage({
                        ...selectedImage,
                        showAdvanced: true
                      });
                      setCurrentImageUrl(selectedImage.image_url);
                      setSelectedImage(null);
                      setFullScale(false);
                    }}
                    className="bg-[#392599] hover:bg-[#4a2fb3] text-white font-medium rounded-full w-full sm:w-auto"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    {t.edit || 'Redigera'}
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(selectedImage.image_url, getGarment(selectedImage.garment_id)?.name);
                    }}
                    className="bg-black hover:bg-black/80 border border-white/20 text-white font-medium rounded-full w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t.download || 'Ladda ner'}
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(selectedImage.id);
                      setSelectedImage(null);
                      setFullScale(false);
                    }}
                    variant="outline"
                    className="border-red-600 text-white bg-red-600 hover:bg-red-700 rounded-full w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t.delete || 'Ta bort'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl overflow-y-auto"
            onClick={() => {
              setEditingImage(null);
              setCurrentImageUrl(null);
            }}
          >
            <div className="min-h-screen flex items-start justify-center p-4 py-8">
              <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setEditingImage(null);
                    setCurrentImageUrl(null);
                  }}
                  className="fixed top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="h-6 w-6 text-white" />
                </button>

                <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/10">
                  <h2 className="text-2xl font-semibold text-white mb-6">{t.editImage || 'Redigera bild'}</h2>

                  <div ref={imagePreviewRef} className="mb-6 rounded-2xl overflow-hidden bg-white/5 relative">
                    <SignedImage
                      src={currentImageUrl}
                      alt="Editing"
                      className="w-full h-auto object-contain"
                    />
                    {isRegenerating && (
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-[#392599]/30"
                          animate={{
                            opacity: [0.3, 0.6, 0.3],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <div className="relative z-10 text-white text-6xl font-bold">
                          {regenerationProgress}%
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <ImageRefinementPanel
                    currentImage={currentImageUrl}
                    originalGeneratedImageId={editingImage.id}
                    originalPrompt={editingImage.prompt_used}
                    garmentImageUrl={editingImage.garment_urls || (getGarment(editingImage.garment_id)?.image_url ? [getGarment(editingImage.garment_id).image_url] : [])}
                    initialShowAdvanced={editingImage.showAdvanced}
                    onImageUpdated={(newUrl) => setCurrentImageUrl(newUrl)}
                    onProcessingChange={(isProcessing, progress) => {
                      setIsRegenerating(isProcessing);
                      setRegenerationProgress(progress);
                    }}
                    onGenerateImage={async (prompt, imageUrls) => {
                      const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
                      const result = await base44.integrations.Core.GenerateImage({
                        prompt: prompt,
                        existing_image_urls: urls
                      });
                      return { image_url: result.url };
                    }}
                    onSaveImage={async (imageUrl, promptUsed) => {
                      await updateImageMutation.mutateAsync({
                        id: editingImage.id,
                        data: {
                          image_url: imageUrl,
                          prompt_used: promptUsed
                        }
                      });
                      setEditingImage(null);
                      setCurrentImageUrl(null);
                    }}
                    onClose={() => {
                      setEditingImage(null);
                      setCurrentImageUrl(null);
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {infoImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setInfoImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#1A1A1A] border dark:border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-black/10 dark:border-white/10 flex items-center justify-between sticky top-0 bg-white dark:bg-[#1A1A1A] z-10">
                <h2 className="text-xl font-semibold text-black dark:text-white">{t.generationInfo || 'Genereringsinformation'}</h2>
                <button
                  onClick={() => setInfoImage(null)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-black dark:text-white" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* 1. Generated Image */}
                <div>
                  <h3 className="text-sm font-medium text-black/60 dark:text-white/60 mb-3">{language === 'sv' ? 'Genererad bild' : 'Generated image'}</h3>
                  <div className="rounded-xl overflow-hidden bg-[#f5f5f7] dark:bg-white/5">
                    <SignedImage src={infoImage.image_url} alt="Generated" className="w-full h-auto" />
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-black/60 dark:text-white/60">{t.created || 'Skapad'}</span>
                      <span className="text-black dark:text-white">
                        {(infoImage.created_date || infoImage.createdAt)
                          ? format(new Date(infoImage.created_date || infoImage.createdAt), 'd MMMM yyyy', { locale: language === 'sv' ? sv : enUS })
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/60 dark:text-white/60">{t.status || 'Status'}</span>
                      <span className="text-black dark:text-white capitalize">{infoImage.status}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Garments Used */}
                {infoImage.garment_urls && infoImage.garment_urls.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-medium text-black/60 dark:text-white/60 mb-3">{t.garmentsInOutfit || 'Plagg i outfiten'}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {infoImage.garment_urls.map((url, idx) => {
                        const garment = garments.find(g => g.image_url === url);
                        return (
                          <div key={idx} className="space-y-2">
                            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-[#f5f5f7] dark:bg-white/5">
                              <SignedImage src={url} alt={garment?.name || `Plagg ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                            {garment && (
                              <div>
                                <p className="text-xs font-medium text-black dark:text-white truncate">{garment.name}</p>
                                {garment.category && (
                                  <p className="text-xs text-black/40 dark:text-white/40 capitalize">{garment.category}</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  (() => {
                    const garment = getGarment(infoImage.garment_id);
                    return (
                      <div>
                        <h3 className="text-sm font-medium text-black/60 dark:text-white/60 mb-3">{t.originalGarment || 'Originalplagg'}</h3>
                        <div className="flex gap-4">
                          <div className="w-24 h-32 rounded-lg overflow-hidden bg-[#f5f5f7] dark:bg-white/5">
                            {garment?.image_url ? (
                              <SignedImage src={garment.image_url} alt="Original" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Sparkles className="h-8 w-8 text-white/20" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-black dark:text-white mb-1">{garment?.name || 'Okänt'}</p>
                            {garment?.category && (
                              <p className="text-xs text-black/40 dark:text-white/40 capitalize mb-2">{garment.category}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* 3. AI Descriptions */}
                {infoImage.garment_urls && infoImage.garment_urls.length > 0 ? (
                  /* AI Style Description for Style Mode */
                  <div>
                    <h3 className="text-sm font-medium text-black/60 dark:text-white/60 mb-3">{t.styleDescription || 'Stilbeskrivning'}</h3>
                    {loadingStyleDescription ? (
                      <div className="p-4 bg-[#f5f5f7] dark:bg-white/5 rounded-lg flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-[#392599]" />
                        <p className="text-sm text-black/60 dark:text-white/60">{t.aiAnalyzingStyle || 'AI analyserar stil...'}</p>
                      </div>
                    ) : styleDescription ? (
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/30 rounded-lg space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-600 text-white font-medium">
                            {styleDescription.vibe}
                          </span>
                        </div>
                        <p className="text-sm text-purple-800 dark:text-purple-200 italic leading-relaxed">
                          {styleDescription.style_description}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  /* AI Description for Single Garment */
                  (() => {
                    const garment = getGarment(infoImage.garment_id);
                    return (
                      <>
                        {!garment?.ai_description && (
                          <div>
                            <h3 className="text-sm font-medium text-black/60 dark:text-white/60 mb-3">{t.aiDescription || 'AI-beskrivning'}</h3>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                generateGarmentDescription(infoImage.garment_id);
                              }}
                              disabled={generatingGarmentDescription === infoImage.garment_id}
                              className="bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm w-full"
                            >
                              {generatingGarmentDescription === infoImage.garment_id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  {language === 'sv' ? 'Genererar beskrivning...' : 'Generating description...'}
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  {language === 'sv' ? 'Generera AI-beskrivning' : 'Generate AI description'}
                                </>
                              )}
                            </Button>
                          </div>
                        )}

                        {garment?.ai_description && (
                          <div>
                            <h3 className="text-sm font-medium text-black/60 dark:text-white/60 mb-3">{t.aiDescription || 'AI-beskrivning'}</h3>
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-green-600 dark:text-green-400">{language === 'sv' ? 'Produktbeskrivning' : 'Product description'}</p>
                                <div className="flex gap-1 bg-white/60 dark:bg-black/20 rounded-lg p-0.5">
                                  <button
                                    onClick={() => {
                                      setDescriptionLanguage('sv');
                                      setTranslatedDescription(null);
                                    }}
                                    className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                                      descriptionLanguage === 'sv'
                                        ? 'bg-green-600 text-white'
                                        : 'text-green-700 dark:text-green-300 hover:bg-white/40 dark:hover:bg-white/10'
                                    }`}
                                  >
                                    SV
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDescriptionLanguage('en');
                                      if (!translatedDescription) {
                                        translateDescription(garment.ai_description, 'en');
                                      }
                                    }}
                                    className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                                      descriptionLanguage === 'en'
                                        ? 'bg-green-600 text-white'
                                        : 'text-green-700 dark:text-green-300 hover:bg-white/40 dark:hover:bg-white/10'
                                    }`}
                                  >
                                    EN
                                  </button>
                                </div>
                              </div>
                              {loadingTranslation ? (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin text-green-600 dark:text-green-400" />
                                  <p className="text-xs text-green-600 dark:text-green-400">Översätter...</p>
                                </div>
                              ) : (
                                <p className="text-sm text-green-700 dark:text-green-300 italic leading-relaxed">
                                  "{descriptionLanguage === 'sv' ? garment.ai_description : (translatedDescription || garment.ai_description)}"
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {infoImage.ai_analysis && (
                          <div>
                            <h3 className="text-sm font-medium text-black/60 dark:text-white/60 mb-3">{t.aiAnalysisProductDescription || 'AI-analys (Produktbeskrivning)'}</h3>
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30 rounded-xl space-y-3">
                              {infoImage.ai_analysis.description && (
                                <div>
                                  <p className="text-sm text-green-700 dark:text-green-300 italic mb-3">
                                    "{infoImage.ai_analysis.description}"
                                  </p>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(infoImage.ai_analysis.description);
                                    }}
                                    className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                  >
                                    {t.copyProductText || 'Kopiera produkttext'}
                                  </button>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {infoImage.ai_analysis.style && (
                                  <div className="p-2 bg-white/60 dark:bg-black/20 rounded">
                                    <p className="text-green-600 dark:text-green-400">{t.style || 'Stil'}</p>
                                    <p className="text-black dark:text-white capitalize">{infoImage.ai_analysis.style}</p>
                                  </div>
                                )}
                                {infoImage.ai_analysis.category && (
                                  <div className="p-2 bg-white/60 dark:bg-black/20 rounded">
                                    <p className="text-green-600 dark:text-green-400">{t.category || 'Kategori'}</p>
                                    <p className="text-black dark:text-white capitalize">{infoImage.ai_analysis.category}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()
                )}

                {/* 4. AI Categorization */}
                <AICategorizationPanel
                  image={infoImage}
                  onUpdate={() => queryClient.invalidateQueries({ queryKey: ['generated-images'] })}
                />

                {/* 5. PIM Data */}
                {(() => {
                  const garment = getGarment(infoImage.garment_id);
                  return (garment?.brand || garment?.sku || garment?.category) && (
                    <div>
                      <h3 className="text-sm font-medium text-black/60 dark:text-white/60 mb-3">{language === 'sv' ? 'Produktinformation' : 'Product information'}</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {garment?.brand && (
                          <div className="p-3 bg-[#f5f5f7] dark:bg-white/5 rounded-lg">
                            <p className="text-xs text-black/40 dark:text-white/40 mb-1">Varumärke</p>
                            <p className="text-sm text-black dark:text-white font-medium">{garment.brand}</p>
                          </div>
                        )}
                        {garment?.sku && (
                          <div className="p-3 bg-[#f5f5f7] dark:bg-white/5 rounded-lg">
                            <p className="text-xs text-black/40 dark:text-white/40 mb-1">SKU</p>
                            <p className="text-sm text-black dark:text-white font-medium">{garment.sku}</p>
                          </div>
                        )}
                        {garment?.category && (
                          <div className="p-3 bg-[#f5f5f7] dark:bg-white/5 rounded-lg">
                            <p className="text-xs text-black/40 dark:text-white/40 mb-1">Kategori</p>
                            <p className="text-sm text-black dark:text-white font-medium capitalize">{garment.category}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Prompt */}
                {infoImage.prompt_used && (
                  <div>
                    <button
                      onClick={() => setPromptExpanded(!promptExpanded)}
                      className="w-full flex items-center justify-between text-sm font-medium text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors mb-3"
                    >
                      <span>{t.promptUsed || 'Använd prompt'}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${promptExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {promptExpanded && (
                      <div className="p-3 bg-[#f5f5f7] dark:bg-white/5 rounded-lg text-xs text-black dark:text-white font-mono whitespace-pre-wrap break-words">
                        {infoImage.prompt_used}
                      </div>
                    )}
                  </div>
                )}

                {/* Generated Image Link */}
                <div>
                  <h3 className="text-sm font-medium text-black/60 dark:text-white/60 mb-3">{t.imageLink || 'Bildlänk'}</h3>
                  <a
                    href={infoImage.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#392599] hover:underline inline-flex items-center gap-1 break-all"
                  >
                    {infoImage.image_url}
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#1A1A1A] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {deleteId === 'batch' ? (t.deleteSelectedImages || 'Ta bort valda bilder') : (t.deleteImage || 'Ta bort bild')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {deleteId === 'batch'
                ? (t.deleteImagesConfirm?.replace('{count}', selectedIds.length) || `Är du säker på att du vill ta bort ${selectedIds.length} bilder? Denna åtgärd kan inte ångras.`)
                : (t.deleteImageConfirm || 'Är du säker på att du vill ta bort denna bild? Denna åtgärd kan inte ångras.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              {t.cancel || 'Avbryt'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId === 'batch') {
                  batchDeleteMutation.mutate(selectedIds);
                } else {
                  deleteMutation.mutate(deleteId);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {t.delete || 'Ta bort'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
