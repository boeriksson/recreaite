import React, { useState } from 'react';
import { base44 } from '@/api/amplifyClient';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { cn } from "@/lib/utils";

export default function BatchJobCreator({
  selectedGarments,
  configuration,
  onJobCreated,
  onCancel
}) {
  const queryClient = useQueryClient();
  const [jobName, setJobName] = useState(`Batch ${format(new Date(), 'd MMM yyyy HH:mm', { locale: sv })}`);
  const [scheduledDate, setScheduledDate] = useState(null);
  const [priority, setPriority] = useState(5);

  const createJobMutation = useMutation({
    mutationFn: (data) => base44.entities.BatchJob.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['batch-jobs'] });
      if (onJobCreated) {
        onJobCreated(data);
      }
    }
  });

  const handleCreate = async () => {
    await createJobMutation.mutateAsync({
      name: jobName,
      status: scheduledDate && new Date(scheduledDate) > new Date() ? 'pending' : 'pending',
      garment_ids: selectedGarments.map(g => g.id),
      configuration,
      scheduled_for: scheduledDate ? scheduledDate.toISOString() : null,
      total_items: selectedGarments.length,
      processed_items: 0,
      successful_items: 0,
      failed_items: 0,
      failed_garment_ids: [],
      error_log: [],
      priority
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-2xl p-6 space-y-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-black dark:text-white">Skapa batch-jobb</h3>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-black dark:text-white" />
        </button>
      </div>

      <div>
        <Label className="text-black/80 dark:text-white/80">Jobbnamn</Label>
        <Input
          value={jobName}
          onChange={(e) => setJobName(e.target.value)}
          placeholder="T.ex. Sommarkampanj 2025"
          className="mt-2 bg-[#f5f5f7] border-black/10 text-black dark:bg-white/5 dark:border-white/10 dark:text-white"
        />
      </div>

      <div>
        <Label className="text-black/80 dark:text-white/80">Schemalägg (valfritt)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal mt-2",
                !scheduledDate && "text-black/40 dark:text-white/40"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {scheduledDate ? format(scheduledDate, 'PPP HH:mm', { locale: sv }) : 'Välj datum och tid'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white dark:bg-[#1a1a1a]" align="start">
            <Calendar
              mode="single"
              selected={scheduledDate}
              onSelect={(date) => {
                if (date) {
                  const now = new Date();
                  date.setHours(now.getHours());
                  date.setMinutes(now.getMinutes());
                }
                setScheduledDate(date);
              }}
              disabled={(date) => date < new Date()}
              initialFocus
            />
            {scheduledDate && (
              <div className="p-3 border-t border-black/10 dark:border-white/10">
                <Label className="text-xs text-black/60 dark:text-white/60">Tid</Label>
                <Input
                  type="time"
                  value={scheduledDate ? format(scheduledDate, 'HH:mm') : ''}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':');
                    const newDate = new Date(scheduledDate);
                    newDate.setHours(parseInt(hours));
                    newDate.setMinutes(parseInt(minutes));
                    setScheduledDate(newDate);
                  }}
                  className="mt-1 bg-[#f5f5f7] dark:bg-white/5"
                />
              </div>
            )}
          </PopoverContent>
        </Popover>
        {scheduledDate && (
          <Button
            onClick={() => setScheduledDate(null)}
            variant="ghost"
            size="sm"
            className="mt-2 text-xs"
          >
            Rensa schemaläggning
          </Button>
        )}
      </div>

      <div>
        <Label className="text-black/80 dark:text-white/80">Prioritet (1-10)</Label>
        <Input
          type="number"
          min="1"
          max="10"
          value={priority}
          onChange={(e) => setPriority(parseInt(e.target.value))}
          className="mt-2 bg-[#f5f5f7] border-black/10 text-black dark:bg-white/5 dark:border-white/10 dark:text-white"
        />
        <p className="text-xs text-black/50 dark:text-white/50 mt-1">
          Högre nummer = högre prioritet i kön
        </p>
      </div>

      <div className="p-4 bg-[#f5f5f7] dark:bg-white/5 rounded-lg">
        <h4 className="text-sm font-medium text-black dark:text-white mb-2">Sammanfattning</h4>
        <div className="space-y-1 text-sm text-black/60 dark:text-white/60">
          <p>• {selectedGarments.length} plagg att generera</p>
          <p>• {configuration.model_id ? 'Specifik modell vald' : `Kön: ${configuration.gender || 'standard'}`}</p>
          <p>• Miljö: {configuration.environment || 'studio'}</p>
          {configuration.brand_seed_id && <p>• Med varumärkesstil</p>}
          {scheduledDate && (
            <p className="text-amber-600 dark:text-amber-400">
              • Startar: {format(scheduledDate, 'PPP HH:mm', { locale: sv })}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1 border-black/10 dark:border-white/10 rounded-full"
        >
          Avbryt
        </Button>
        <Button
          onClick={handleCreate}
          disabled={createJobMutation.isPending || !jobName.trim()}
          className="flex-1 bg-[#392599] hover:bg-[#4a2fb3] text-white rounded-full"
        >
          {createJobMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Skapar...
            </>
          ) : (
            'Skapa jobb'
          )}
        </Button>
      </div>
    </motion.div>
  );
}
