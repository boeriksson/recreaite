import React from 'react';
import { Shirt, Check } from 'lucide-react';
import { cn } from "@/lib/utils";
import FileDropzone from './FileDropzone';
import { SignedImage } from "@/components/ui/SignedImage";

/**
 * Reusable component for selecting garments - supports both single and multiple selection
 * 
 * @param {Object} props
 * @param {Function} props.onFileSelect - Called when a file is selected for upload
 * @param {Function} props.onGarmentSelect - Called when a garment is selected (garment object)
 * @param {Function} props.onGarmentDeselect - Called when a garment is deselected (garment id)
 * @param {Array} props.allGarments - Array of all available garments
 * @param {Array|Object} props.selectedGarments - Selected garment(s) - array for multiple, single object for single mode
 * @param {boolean} props.allowMultiple - If true, allows multiple selection
 * @param {boolean} props.uploading - Upload in progress
 * @param {string} props.preview - Preview URL for uploaded file
 * @param {Function} props.onClear - Clear uploaded file
 * @param {number} props.maxGarments - Maximum number of garments to show in grid (default: 12)
 * @param {string} props.selectionLabel - Custom label for the garment selection section
 */
export default function GarmentSelector({
  onFileSelect,
  onGarmentSelect,
  onGarmentDeselect,
  allGarments = [],
  selectedGarments = [],
  allowMultiple = false,
  uploading = false,
  preview = null,
  onClear,
  maxGarments = 12,
  selectionLabel,
}) {
  // Normalize selectedGarments to always be an array for easier handling
  const selectedIds = allowMultiple 
    ? (Array.isArray(selectedGarments) ? selectedGarments.map(g => g.id) : [])
    : (selectedGarments?.id ? [selectedGarments.id] : []);

  const handleGarmentClick = (garment) => {
    const isSelected = selectedIds.includes(garment.id);
    
    if (isSelected) {
      onGarmentDeselect?.(garment.id);
    } else {
      if (allowMultiple) {
        onGarmentSelect?.(garment);
      } else {
        // Single mode: replace selection
        if (selectedGarments) {
          onGarmentDeselect?.(selectedGarments.id);
        }
        onGarmentSelect?.(garment);
      }
    }
  };

  // Show existing garments section only if there are garments and no preview (uploaded file)
  const showExistingGarments = allGarments.length > 0 && !preview;

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <FileDropzone
        onFileSelect={onFileSelect}
        uploading={uploading}
        preview={preview}
        onClear={onClear}
        allowMultiple={allowMultiple}
      />

      {/* Select from existing garments */}
      {showExistingGarments && (
        <div className="pt-6 border-t border-black/10 dark:border-white/10">
          <h4 className="text-sm font-medium text-black dark:text-white mb-3">
            {selectionLabel || (allowMultiple
              ? 'Eller välj från dina plagg (flera val möjliga)'
              : 'Eller välj från dina plagg')}
          </h4>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {allGarments.slice(0, maxGarments).map((garment) => {
              const isSelected = selectedIds.includes(garment.id);
              return (
                <button
                  key={garment.id}
                  onClick={() => handleGarmentClick(garment)}
                  className={cn(
                    "aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all relative",
                    isSelected 
                      ? "border-[#392599] ring-2 ring-[#392599]/20 dark:border-[#392599]" 
                      : "border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
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
          
          {/* Selection summary for multiple mode */}
          {allowMultiple && selectedIds.length > 0 && (
            <div className="mt-4 p-3 bg-[#392599]/10 rounded-lg">
              <p className="text-sm text-black dark:text-white">
                <span className="font-medium">{selectedIds.length} plagg valda</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
