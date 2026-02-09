import React, { useState } from 'react';
import { base44 } from '@/api/amplifyClient';
import { SignedImage } from "@/components/ui/SignedImage";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import {
  Loader2,
  X,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  Pause,
  Play,
  Trash2,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Calendar,
  AlertCircle,
  Shirt,
  Plus as PlusIcon
} from 'lucide-react';
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
import { sv } from 'date-fns/locale';
import { cn } from "@/lib/utils";

export default function BatchJobsList({ hideHeader = false, showEmptyStateAtBottom = false }) {
  const queryClient = useQueryClient();
  const [expandedJob, setExpandedJob] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [processingJobId, setProcessingJobId] = useState(null);
  const [showCreator, setShowCreator] = useState(false);
  const [selectedGarments, setSelectedGarments] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState([]);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['batch-jobs'],
    queryFn: () => base44.entities.BatchJob.list('-created_date')
  });

  const { data: allGarments = [] } = useQuery({
    queryKey: ['garments-batch'],
    queryFn: () => base44.entities.Garment.list()
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BatchJob.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-jobs'] });
    }
  });

  const deleteJobMutation = useMutation({
    mutationFn: (id) => base44.entities.BatchJob.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-jobs'] });
      setDeleteId(null);
    }
  });

  const batchDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => base44.entities.BatchJob.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-jobs'] });
      setSelectedJobIds([]);
      setSelectionMode(false);
      setDeleteId(null);
    }
  });

  const getGarment = (id) => allGarments.find(g => g.id === id);

  const processJob = async (job) => {
    if (processingJobId) return;

    setProcessingJobId(job.id);

    try {
      await updateJobMutation.mutateAsync({
        id: job.id,
        data: {
          status: 'processing',
          started_at: new Date().toISOString()
        }
      });

      const { garment_ids, configuration } = job;
      const errors = [];
      let successful = 0;
      let failed = 0;
      const failedIds = [];

      for (let i = 0; i < garment_ids.length; i++) {
        const garmentId = garment_ids[i];
        const garment = getGarment(garmentId);

        if (!garment) {
          errors.push({
            garment_id: garmentId,
            error: 'Garment not found',
            timestamp: new Date().toISOString()
          });
          failed++;
          failedIds.push(garmentId);
          continue;
        }

        try {
          let modelPrompt = 'professional fashion model';
          if (configuration.model_id) {
            const models = await base44.entities.Model.filter({ id: configuration.model_id });
            if (models.length > 0) {
              modelPrompt = models[0].prompt;
            }
          } else if (configuration.gender) {
            modelPrompt = `professional ${configuration.gender} fashion model`;
          }

          let seedPrompt = '';
          if (configuration.brand_seed_id) {
            const seeds = await base44.entities.BrandSeed.filter({ id: configuration.brand_seed_id });
            if (seeds.length > 0) {
              const seed = seeds[0];
              seedPrompt = `Style: ${seed.brand_style}. Character: ${seed.character}. `;
            }
          }

          const envPrompts = {
            studio: 'Professional studio photography with light grey background.',
            urban: 'Urban street photography in Stockholm, Sweden.',
          };
          const envPrompt = envPrompts[configuration.environment] || envPrompts.studio;

          const prompt = `${modelPrompt} wearing the garment. ${seedPrompt}${envPrompt} High-quality product photography. MANDATORY: 4:5 aspect ratio, portrait orientation.`;

          const result = await base44.integrations.Core.GenerateImage({
            prompt: prompt,
            existing_image_urls: [garment.image_url]
          });

          await base44.entities.GeneratedImage.create({
            garment_id: garmentId,
            model_type: configuration.model_id || 'default',
            image_url: result.url,
            prompt_used: prompt,
            status: 'completed'
          });

          successful++;
        } catch (error) {
          console.error(`Failed to generate for ${garment.name}:`, error);
          errors.push({
            garment_id: garmentId,
            error: error.message || 'Generation failed',
            timestamp: new Date().toISOString()
          });
          failed++;
          failedIds.push(garmentId);
        }

        await updateJobMutation.mutateAsync({
          id: job.id,
          data: {
            processed_items: i + 1,
            successful_items: successful,
            failed_items: failed,
            failed_garment_ids: failedIds,
            error_log: errors
          }
        });
      }

      await updateJobMutation.mutateAsync({
        id: job.id,
        data: {
          status: failed === garment_ids.length ? 'failed' : 'completed',
          completed_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Job processing failed:', error);
      await updateJobMutation.mutateAsync({
        id: job.id,
        data: {
          status: 'failed'
        }
      });
    } finally {
      setProcessingJobId(null);
    }
  };

  const retryFailedItems = async (job) => {
    if (processingJobId || !job.failed_garment_ids || job.failed_garment_ids.length === 0) return;

    setProcessingJobId(job.id);

    try {
      await updateJobMutation.mutateAsync({
        id: job.id,
        data: {
          status: 'processing'
        }
      });

      const { failed_garment_ids, configuration, error_log = [] } = job;
      const errors = [...error_log];
      let successful = job.successful_items || 0;
      let failed = 0;
      const stillFailedIds = [];

      for (let i = 0; i < failed_garment_ids.length; i++) {
        const garmentId = failed_garment_ids[i];
        const garment = getGarment(garmentId);

        if (!garment) continue;

        try {
          let modelPrompt = 'professional fashion model';
          if (configuration.model_id) {
            const models = await base44.entities.Model.filter({ id: configuration.model_id });
            if (models.length > 0) {
              modelPrompt = models[0].prompt;
            }
          } else if (configuration.gender) {
            modelPrompt = `professional ${configuration.gender} fashion model`;
          }

          let seedPrompt = '';
          if (configuration.brand_seed_id) {
            const seeds = await base44.entities.BrandSeed.filter({ id: configuration.brand_seed_id });
            if (seeds.length > 0) {
              const seed = seeds[0];
              seedPrompt = `Style: ${seed.brand_style}. Character: ${seed.character}. `;
            }
          }

          const envPrompts = {
            studio: 'Professional studio photography with light grey background.',
            urban: 'Urban street photography in Stockholm, Sweden.',
          };
          const envPrompt = envPrompts[configuration.environment] || envPrompts.studio;

          const prompt = `${modelPrompt} wearing the garment. ${seedPrompt}${envPrompt} High-quality product photography. MANDATORY: 4:5 aspect ratio, portrait orientation.`;

          const result = await base44.integrations.Core.GenerateImage({
            prompt: prompt,
            existing_image_urls: [garment.image_url]
          });

          await base44.entities.GeneratedImage.create({
            garment_id: garmentId,
            model_type: configuration.model_id || 'default',
            image_url: result.url,
            prompt_used: prompt,
            status: 'completed'
          });

          successful++;
        } catch (error) {
          console.error(`Retry failed for ${garment.name}:`, error);
          errors.push({
            garment_id: garmentId,
            error: `Retry: ${error.message || 'Generation failed'}`,
            timestamp: new Date().toISOString()
          });
          failed++;
          stillFailedIds.push(garmentId);
        }
      }

      await updateJobMutation.mutateAsync({
        id: job.id,
        data: {
          status: stillFailedIds.length > 0 ? 'completed' : 'completed',
          successful_items: successful,
          failed_items: stillFailedIds.length,
          failed_garment_ids: stillFailedIds,
          error_log: errors,
          completed_at: new Date().toISOString()
        }
      });
    } finally {
      setProcessingJobId(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'paused':
        return <Pause className="h-5 w-5 text-amber-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-700/30';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-700/30';
      case 'processing':
        return 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/30';
      case 'paused':
        return 'bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/30';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700/30';
    }
  };

  if (!jobs) return null;

  return (
    <div className="space-y-6">
      {/* Header with Selection Mode Toggle - hidden if hideHeader prop is true */}
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            {selectionMode && selectedJobIds.length > 0
              ? `${selectedJobIds.length} jobb valda`
              : 'Befintliga batch-jobb'}
          </h2>
          {jobs.length > 0 && !showCreator && (
            <Button
              onClick={() => {
                setSelectionMode(!selectionMode);
                setSelectedJobIds([]);
              }}
              variant="outline"
              size="sm"
              className="border-black/20 dark:border-white/20"
            >
              {selectionMode ? 'Avbryt' : 'Välj flera'}
            </Button>
          )}
        </div>
      )}

      {/* Batch Actions */}
      {selectionMode && selectedJobIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl flex items-center gap-3 flex-wrap"
        >
          <Button
            onClick={() => setSelectedJobIds(jobs.map(j => j.id))}
            variant="ghost"
            size="sm"
          >
            Markera alla
          </Button>
          <Button
            onClick={() => setSelectedJobIds([])}
            variant="ghost"
            size="sm"
          >
            Avmarkera alla
          </Button>
          <div className="flex-1" />
          <Button
            onClick={() => setDeleteId('batch')}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Ta bort ({selectedJobIds.length})
          </Button>
        </motion.div>
      )}

      {/* Create New Batch Job Button - hidden when hideHeader is true (used in main flow) */}
      {!hideHeader && !showCreator && !selectionMode && (
        <div className="text-center py-8 bg-white dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10">
          <h3 className="text-xl text-black dark:text-white mb-2">Skapa nytt batch-jobb</h3>
          <p className="text-black/60 dark:text-white/60 mb-4">
            Välj plagg och skapa ett batch-jobb för att generera flera bilder samtidigt
          </p>
          <Button
            onClick={() => setShowCreator(true)}
            className="bg-[#392599] hover:bg-[#4a2fb3] text-white rounded-full"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Välj plagg
          </Button>
        </div>
      )}

      {/* Garment Selection for New Job */}
      {showCreator && (
        <div className="space-y-4 p-6 bg-white dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black dark:text-white">Välj plagg för batch-jobb</h3>
            <Button
              onClick={() => {
                setShowCreator(false);
                setSelectedGarments([]);
              }}
              variant="ghost"
              size="icon"
              className="text-black dark:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {allGarments.map((garment) => {
              const isSelected = selectedGarments.some(g => g.id === garment.id);
              return (
                <button
                  key={garment.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedGarments(selectedGarments.filter(g => g.id !== garment.id));
                    } else {
                      setSelectedGarments([...selectedGarments, garment]);
                    }
                  }}
                  className={cn(
                    "aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all relative",
                    isSelected ? "border-[#392599] ring-2 ring-[#392599]/20" : "border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
                  )}
                >
                  {garment.image_url ? (
                    <SignedImage src={garment.image_url} alt={garment.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#f5f5f7] dark:bg-white/5 flex items-center justify-center">
                      <Shirt className="h-6 w-6 text-black/20 dark:text-white/20" />
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-[#392599] flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-xs text-white truncate">{garment.name}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedGarments.length > 0 && (
            <div className="p-3 bg-[#392599]/10 rounded-lg">
              <p className="text-sm text-black dark:text-white">
                <span className="font-medium">{selectedGarments.length} plagg valda</span>
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => {
                setShowCreator(false);
                setSelectedGarments([]);
              }}
              variant="outline"
              className="flex-1 border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5 rounded-full"
            >
              Avbryt
            </Button>
            <Button
              onClick={() => {
                // Navigate to next step or open batch job creator
                // This will be handled by showing a modal or accordion
              }}
              disabled={selectedGarments.length === 0}
              className="flex-1 bg-[#392599] hover:bg-[#4a2fb3] text-white rounded-full"
            >
              Fortsätt ({selectedGarments.length})
            </Button>
          </div>
        </div>
      )}

      {/* Existing Jobs List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-white/5 dark:bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const isSelected = selectedJobIds.includes(job.id);
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "rounded-2xl border overflow-hidden bg-white dark:bg-[#1a1a1a] transition-all",
                  getStatusColor(job.status),
                  selectionMode && isSelected && "ring-2 ring-[#392599]"
                )}
                onClick={() => selectionMode && setSelectedJobIds(prev =>
                  prev.includes(job.id) ? prev.filter(id => id !== job.id) : [...prev, job.id]
                )}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      {selectionMode && (
                        <div className={cn(
                          "h-6 w-6 rounded-full flex items-center justify-center transition-colors mt-1",
                          isSelected ? 'bg-[#392599]' : 'bg-white/20 border-2 border-black/20 dark:border-white/20'
                        )}>
                          {isSelected && (
                            <Check className="h-4 w-4 text-white" />
                          )}
                        </div>
                      )}
                      {!selectionMode && getStatusIcon(job.status)}
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-black dark:text-white">{job.name}</h3>
                        <p className="text-sm text-black/60 dark:text-white/60 mt-1">
                          Skapad {format(new Date(job.created_date || job.createdAt), 'd MMM yyyy HH:mm', { locale: sv })}
                        </p>
                        {job.scheduled_for && new Date(job.scheduled_for) > new Date() && (
                          <p className="text-sm text-black/60 dark:text-white/60 flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            Schemalagd: {format(new Date(job.scheduled_for), 'd MMM yyyy HH:mm', { locale: sv })}
                          </p>
                        )}
                      </div>
                    </div>
                    {!selectionMode && (
                      <Button
                        onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                        variant="ghost"
                        size="icon"
                        className="text-black dark:text-white"
                      >
                        {expandedJob === job.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-black dark:text-white">{job.total_items}</p>
                      <p className="text-xs text-black/60 dark:text-white/60">Totalt</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-black dark:text-white">{job.processed_items || 0}</p>
                      <p className="text-xs text-black/60 dark:text-white/60">Processade</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{job.successful_items || 0}</p>
                      <p className="text-xs text-black/60 dark:text-white/60">Lyckade</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{job.failed_items || 0}</p>
                      <p className="text-xs text-black/60 dark:text-white/60">Misslyckade</p>
                    </div>
                  </div>

                  {job.status === 'processing' && (
                    <div className="mb-4">
                      <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="h-full bg-[#392599]"
                          initial={{ width: 0 }}
                          animate={{ width: `${((job.processed_items || 0) / job.total_items) * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="text-xs text-black/60 dark:text-white/60 mt-2 text-center">
                        {Math.round(((job.processed_items || 0) / job.total_items) * 100)}% färdigt
                      </p>
                    </div>
                  )}

                  {!selectionMode && (
                    <div className="flex gap-2">
                      {job.status === 'pending' && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            processJob(job);
                          }}
                          disabled={processingJobId !== null}
                          className="flex-1 bg-[#392599] hover:bg-[#4a2fb3] text-white rounded-full"
                        >
                          {processingJobId === job.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Startar...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Starta
                            </>
                          )}
                        </Button>
                      )}
                      {(job.status === 'completed' || job.status === 'failed') && job.failed_items > 0 && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            retryFailedItems(job);
                          }}
                          disabled={processingJobId !== null}
                          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-full"
                        >
                          {processingJobId === job.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Försöker igen...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Försök igen ({job.failed_items})
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(job.id);
                        }}
                        variant="outline"
                        className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white rounded-full"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {expandedJob === job.id && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden border-t border-black/10 dark:border-white/10"
                    >
                      <div className="p-6 bg-black/5 dark:bg-white/5">
                        <h4 className="text-sm font-medium text-black dark:text-white mb-3">Plagg i jobbet</h4>
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-4">
                          {job.garment_ids?.map((id) => {
                            const garment = getGarment(id);
                            const isFailed = job.failed_garment_ids?.includes(id);
                            return (
                              <div key={id} className="relative">
                                <div className={cn(
                                  "aspect-[3/4] rounded-lg overflow-hidden border-2",
                                  isFailed ? "border-red-500" : "border-black/10 dark:border-white/10"
                                )}>
                                  {garment?.image_url ? (
                                    <SignedImage src={garment.image_url} alt={garment.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                                      <AlertCircle className="h-4 w-4 text-black/20 dark:text-white/20" />
                                    </div>
                                  )}
                                </div>
                                {isFailed && (
                                  <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 flex items-center justify-center">
                                    <XCircle className="h-3 w-3 text-white" />
        </div>
      )}

      {/* Empty State at Bottom - only show when showEmptyStateAtBottom is true and there are no jobs */}
      {showEmptyStateAtBottom && jobs.length === 0 && !isLoading && (
        <div className="text-center py-16 bg-white dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10">
          <Clock className="h-16 w-16 text-black/20 dark:text-white/20 mx-auto mb-4" />
          <h2 className="text-xl text-black dark:text-white mb-2">Inga batch-jobb ännu</h2>
          <p className="text-black/60 dark:text-white/60 mb-6">
            Skapa ditt första batch-jobb för att generera flera bilder samtidigt
          </p>
        </div>
      )}
    </div>
  );
})}
                        </div>

                        {job.error_log && job.error_log.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-black dark:text-white mb-3">Fellog</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {job.error_log.map((error, idx) => {
                                const garment = getGarment(error.garment_id);
                                return (
                                  <div key={idx} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs">
                                    <p className="font-medium text-red-800 dark:text-red-200">
                                      {garment?.name || 'Okänt plagg'}
                                    </p>
                                    <p className="text-red-700 dark:text-red-300 mt-1">{error.error}</p>
                                    <p className="text-red-600 dark:text-red-400 mt-1">
                                      {format(new Date(error.timestamp), 'd MMM HH:mm:ss', { locale: sv })}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white dark:bg-[#1A1A1A] border-black/10 dark:border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black dark:text-white">
              {deleteId === 'batch' ? 'Ta bort valda batch-jobb' : 'Ta bort batch-jobb'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-black/60 dark:text-white/60">
              {deleteId === 'batch'
                ? `Är du säker på att du vill ta bort ${selectedJobIds.length} batch-jobb? Denna åtgärd kan inte ångras.`
                : 'Är du säker på att du vill ta bort detta jobb? Denna åtgärd kan inte ångras.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-black/5 dark:bg-white/10 text-black dark:text-white border-black/10 dark:border-white/20 hover:bg-black/10 dark:hover:bg-white/20">
              Avbryt
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId === 'batch') {
                  batchDeleteMutation.mutate(selectedJobIds);
                } else {
                  deleteJobMutation.mutate(deleteId);
                }
              }}
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
