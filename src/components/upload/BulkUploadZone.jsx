import React, { useCallback, useState } from 'react';
import { Upload, X, Loader2, FileImage, CheckCircle2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";

export default function BulkUploadZone({ onFilesSelect, uploading, uploadedFiles, onRemoveFile }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) {
      onFilesSelect(files);
    }
  }, [onFilesSelect]);

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelect(files);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <motion.label
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center",
          "min-h-[300px] rounded-2xl cursor-pointer",
          "border-2 border-dashed transition-all duration-300",
          isDragging 
            ? "border-[#C9A962] bg-[#C9A962]/10" 
            : "border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10"
        )}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        <div className={cn(
          "flex flex-col items-center gap-4 p-8 transition-transform",
          isDragging && "scale-105"
        )}>
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#C9A962]/20 to-transparent flex items-center justify-center">
              {isDragging ? (
                <FileImage className="h-8 w-8 text-[#C9A962]" />
              ) : (
                <Upload className="h-8 w-8 text-white/40" />
              )}
            </div>
          </div>
          <div className="text-center">
            <p className="text-white/80 font-medium">
              {isDragging ? 'Släpp bilderna här' : 'Dra och släpp flera bilder eller klicka'}
            </p>
            <p className="text-sm text-white/40 mt-1">
              PNG, JPG upp till 10MB per fil
            </p>
            <p className="text-sm text-[#C9A962] mt-2">
              {uploadedFiles.length > 0 
                ? `${uploadedFiles.length} ${uploadedFiles.length === 1 ? 'fil' : 'filer'} uppladdade` 
                : 'Välj flera filer samtidigt'}
            </p>
          </div>
        </div>
      </motion.label>

      {/* Uploaded Files Grid */}
      {uploadedFiles.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">
              Uppladdade plagg ({uploadedFiles.length})
            </h3>
            {!uploading && (
              <Button
                onClick={() => uploadedFiles.forEach(f => onRemoveFile(f.id))}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                Rensa alla
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <AnimatePresence>
              {uploadedFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10"
                >
                  <img 
                    src={file.preview} 
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Status overlay */}
                  {file.uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-[#C9A962] animate-spin" />
                    </div>
                  )}
                  
                  {file.uploaded && !file.uploading && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                  )}
                  
                  {/* Remove button */}
                  {!file.uploading && (
                    <button
                      onClick={() => onRemoveFile(file.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-red-500/80 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  )}
                  
                  {/* File name */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-xs truncate">{file.name}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}