import React, { useState } from 'react';
import { Upload, X, Camera } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function FileDropzone({ onFileSelect, uploading, preview, onClear }) {
  const [isDragging, setIsDragging] = useState(false);
  const [showFullSize, setShowFullSize] = useState(false);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div>
      <input
        id="file-input"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        id="camera-input"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {!preview ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
            className={cn(
              "relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer",
              isDragging 
                ? "border-[#0071e3] bg-[#0071e3]/10" 
                : "border-black/20 hover:border-black/30 bg-[#f5f5f7] dark:bg-white/5 dark:border-white/20"
            )}
          >
            {uploading ? (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#0071e3]/10 flex items-center justify-center flex-shrink-0">
                  <div className="h-4 w-4 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-black dark:text-white text-sm">Laddar upp...</p>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
                  <Upload className="h-4 w-4 text-white dark:text-black" />
                </div>
                <div className="text-left">
                  <p className="text-black dark:text-white text-sm font-medium">Dra och släpp eller klicka</p>
                  <p className="text-black/50 dark:text-white/50 text-xs">för att välja en bild</p>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => document.getElementById('camera-input').click()}
            disabled={uploading}
            className="py-6 px-4 rounded-xl bg-[#392599] hover:bg-[#4a2fb3] text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera className="h-4 w-4" />
            Ta foto med kamera
          </button>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden bg-[#f5f5f7] dark:bg-white/5">
          {!showFullSize ? (
            <>
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-32 object-cover cursor-pointer"
                onClick={() => setShowFullSize(true)}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full aspect-square object-contain cursor-pointer"
                onClick={() => setShowFullSize(false)}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}