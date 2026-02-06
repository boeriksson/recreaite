import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  Shirt, 
  Search, 
  Plus, 
  Trash2,
  Sparkles,
  MoreVertical
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

const categoryLabels = {
  tops: 'Överdel',
  bottoms: 'Underdel',
  dresses: 'Klänningar',
  outerwear: 'Ytterkläder',
  accessories: 'Accessoarer'
};

export default function Garments() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const { data: garments = [], isLoading } = useQuery({
    queryKey: ['garments'],
    queryFn: () => base44.entities.Garment.list('-created_date')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Garment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garments'] });
      setDeleteId(null);
    }
  });

  const filteredGarments = garments.filter(garment =>
    garment.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    garment.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    garment.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-white mb-1">Mina plagg</h1>
          <p className="text-white/60">{garments.length} plagg totalt</p>
        </div>
        
        <Link to={createPageUrl('Upload')}>
          <Button className="bg-[#392599] hover:bg-[#4a2fb3] text-white font-medium rounded-full">
            <Plus className="h-4 w-4 mr-2" />
            Ladda upp plagg
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Sök på namn, märke eller SKU..."
          className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-[#C9A962] rounded-full"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filteredGarments.length === 0 ? (
        <div className="text-center py-16">
          <Shirt className="h-16 w-16 text-white/20 mx-auto mb-4" />
          <h2 className="text-xl text-white mb-2">
            {searchQuery ? 'Inga matchande plagg' : 'Inga plagg ännu'}
          </h2>
          <p className="text-white/60 mb-6">
            {searchQuery 
              ? 'Prova en annan sökning' 
              : 'Ladda upp ditt första plagg för att komma igång'}
          </p>
          {!searchQuery && (
            <Link to={createPageUrl('Upload')}>
              <Button className="bg-[#392599] hover:bg-[#4a2fb3] text-white font-medium rounded-full">
                <Plus className="h-4 w-4 mr-2" />
                Ladda upp plagg
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredGarments.map((garment, index) => (
            <motion.div
              key={garment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative"
            >
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                {garment.image_url ? (
                  <img 
                    src={garment.image_url} 
                    alt={garment.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Shirt className="h-12 w-12 text-white/20" />
                  </div>
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Actions */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`${createPageUrl('Upload')}?garment=${garment.id}`} className="flex items-center">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generera bild
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteId(garment.id)}
                        className="text-red-500 focus:text-red-500"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Ta bort
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Quick generate button */}
                <Link 
                  to={`${createPageUrl('Upload')}?garment=${garment.id}`}
                  className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Button className="w-full bg-[#C9A962] hover:bg-[#B89952] text-black font-medium rounded-full text-sm">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generera
                  </Button>
                </Link>
              </div>
              
              {/* Info */}
              <div className="mt-3 px-1">
                <h3 className="text-white font-medium truncate">{garment.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {garment.category && (
                    <Badge variant="secondary" className="bg-white/10 text-white/60 text-xs">
                      {categoryLabels[garment.category] || garment.category}
                    </Badge>
                  )}
                  {garment.brand && (
                    <span className="text-sm text-white/40">{garment.brand}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#1A1A1A] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Ta bort plagg</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Är du säker på att du vill ta bort detta plagg? Denna åtgärd kan inte ångras.
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