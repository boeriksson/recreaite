import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/amplifyClient';
import { motion } from 'framer-motion';
import { Sparkles, Trash2, Plus } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

export default function BrandSeedSelector({ selectedSeed, onSelect, onManualMode }) {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = React.useState(null);

  const { data: seeds = [], isLoading } = useQuery({
    queryKey: ['brand-seeds'],
    queryFn: () => base44.entities.BrandSeed.list('-created_date')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BrandSeed.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-seeds'] });
      if (selectedSeed && selectedSeed.id === deleteId) {
        onSelect(null);
      }
      setDeleteId(null);
    }
  });

  if (isLoading) {
    return (
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-white/10 rounded w-1/3" />
          <div className="h-10 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-white/5 border border-white/10"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-[#C9A962]" />
          <h3 className="text-white font-medium">Varumärkesstil (Seed)</h3>
        </div>

        {seeds.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-white/60 text-sm mb-3">
              Inga sparade seeds ännu. Skanna en sajt på Dashboard för att skapa en.
            </p>
            <Button
              onClick={onManualMode}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Plus className="h-4 w-4 mr-2" />
              Välj manuellt istället
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Select
              value={selectedSeed?.id || ''}
              onValueChange={(value) => {
                if (value === 'manual') {
                  onSelect(null);
                  onManualMode();
                } else {
                  const seed = seeds.find(s => s.id === value);
                  onSelect(seed);
                }
              }}
            >
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Välj en sparad stil..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Välj manuellt
                  </div>
                </SelectItem>
                {seeds.map((seed) => (
                  <SelectItem key={seed.id} value={seed.id}>
                    {seed.name} ({seed.domain})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedSeed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-[#C9A962]/10 border border-[#C9A962]/30 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">{selectedSeed.name}</h4>
                    <p className="text-sm text-white/60">{selectedSeed.domain}</p>
                  </div>
                  <Button
                    onClick={() => setDeleteId(selectedSeed.id)}
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                  <div>
                    <p className="text-xs text-white/40">Karaktär</p>
                    <p className="text-sm text-white capitalize">{selectedSeed.character}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Kön</p>
                    <p className="text-sm text-white capitalize">{selectedSeed.typical_gender}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Miljö</p>
                    <p className="text-sm text-white capitalize">{selectedSeed.environment?.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Fotostil</p>
                    <p className="text-sm text-white capitalize">{selectedSeed.photography_style ? 'Detaljerad' : 'Standard'}</p>
                  </div>
                </div>

                {selectedSeed.visual_analysis && (
                  <div className="pt-2 border-t border-white/10">
                    <p className="text-xs text-white/40 mb-1">Full analys tillgänglig</p>
                    <p className="text-xs text-white/60">Inkluderar rekommendationer, styrkor och förbättringsområden</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}
      </motion.div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#1A1A1A] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Ta bort seed</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Är du säker på att du vill ta bort denna varumärkesstil? Denna åtgärd kan inte ångras.
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
    </>
  );
}