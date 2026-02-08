import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/amplifyClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  Plus,
  X,
  Edit2,
  Trash2,
  FolderOpen,
  Check
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const colorOptions = [
  { value: 'blue', label: 'Blå', bg: 'bg-blue-500', text: 'text-blue-500' },
  { value: 'green', label: 'Grön', bg: 'bg-green-500', text: 'text-green-500' },
  { value: 'purple', label: 'Lila', bg: 'bg-purple-500', text: 'text-purple-500' },
  { value: 'red', label: 'Röd', bg: 'bg-red-500', text: 'text-red-500' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-500', text: 'text-orange-500' },
  { value: 'pink', label: 'Rosa', bg: 'bg-pink-500', text: 'text-pink-500' },
  { value: 'yellow', label: 'Gul', bg: 'bg-yellow-500', text: 'text-yellow-500' },
  { value: 'gray', label: 'Grå', bg: 'bg-gray-500', text: 'text-gray-500' },
];

export default function CollectionManager({
  selectedCollection,
  onSelectCollection,
  onCollectionCreated
}) {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'blue'
  });

  const { data: collections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: () => base44.entities.Collection.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Collection.create(data),
    onSuccess: (newCollection) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setShowCreateForm(false);
      setFormData({ name: '', description: '', color: 'blue' });
      if (onCollectionCreated) onCollectionCreated(newCollection.id);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Collection.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setEditingCollection(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Collection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['generated-images'] });
      setDeleteId(null);
      if (selectedCollection === deleteId) {
        onSelectCollection(null);
      }
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCollection) {
      updateMutation.mutate({ id: editingCollection.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getColorClass = (color) => {
    return colorOptions.find(c => c.value === color) || colorOptions[0];
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-black/60 dark:text-white/60" />
          <h3 className="text-sm font-medium text-black dark:text-white">Samlingar</h3>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-black dark:text-white"
        >
          {showCreateForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {(showCreateForm || editingCollection) && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleSubmit}
            className="space-y-3 overflow-hidden"
          >
            <Input
              placeholder="Samlingsnamn"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-white dark:bg-white/5 border-black/10 dark:border-white/10"
              required
            />
            <Input
              placeholder="Beskrivning (valfritt)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-white dark:bg-white/5 border-black/10 dark:border-white/10"
            />
            <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
              <SelectTrigger className="bg-white dark:bg-white/5 border-black/10 dark:border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div className={cn("h-3 w-3 rounded-full", color.bg)} />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                className="flex-1 bg-[#392599] hover:bg-[#4a2fb3] text-white"
                disabled={!formData.name}
              >
                {editingCollection ? 'Uppdatera' : 'Skapa'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingCollection(null);
                  setFormData({ name: '', description: '', color: 'blue' });
                }}
              >
                Avbryt
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Collections List */}
      <div className="space-y-2">
        {/* All Images Option */}
        <button
          onClick={() => onSelectCollection(null)}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
            !selectedCollection
              ? "bg-[#392599] text-white"
              : "bg-white/5 hover:bg-white/10 text-black dark:text-white"
          )}
        >
          <FolderOpen className="h-4 w-4 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Alla bilder</p>
          </div>
        </button>

        {collections.map((collection) => {
          const colorClass = getColorClass(collection.color);
          const isSelected = selectedCollection === collection.id;

          return (
            <div
              key={collection.id}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg transition-colors group",
                isSelected
                  ? "bg-[#392599] text-white"
                  : "bg-white dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white"
              )}
            >
              <button
                onClick={() => onSelectCollection(collection.id)}
                className="flex-1 flex items-center gap-3 min-w-0 text-left"
              >
                <div className={cn("h-4 w-4 rounded-full flex-shrink-0", isSelected ? "bg-white/30" : colorClass.bg)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{collection.name}</p>
                  {collection.description && (
                    <p className={cn("text-xs truncate", isSelected ? "text-white/60" : "text-black/40 dark:text-white/40")}>
                      {collection.description}
                    </p>
                  )}
                </div>
                <span className={cn("text-xs px-2 py-0.5 rounded-full", isSelected ? "bg-white/20" : "bg-black/10 dark:bg-white/10")}>
                  {collection.image_count || 0}
                </span>
              </button>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCollection(collection);
                    setFormData({
                      name: collection.name,
                      description: collection.description || '',
                      color: collection.color
                    });
                    setShowCreateForm(false);
                  }}
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(collection.id);
                  }}
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-red-600 hover:bg-red-600/10"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {collections.length === 0 && !showCreateForm && (
        <p className="text-xs text-black/40 dark:text-white/40 text-center py-4">
          Inga samlingar än. Skapa din första!
        </p>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#1A1A1A] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Ta bort samling</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Är du säker? Bilder i samlingen förblir kvar men förlorar sin samlingskoppling.
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
