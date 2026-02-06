import React from 'react';

export default function GarmentCollage({ garments }) {
  if (!garments || garments.length === 0) return null;

  // Layout positions for different garment types
  const getPosition = (index, total) => {
    if (total === 1) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '60%' };
    } else if (total === 2) {
      return index === 0 
        ? { top: '35%', left: '50%', transform: 'translate(-50%, -50%)', width: '55%' } // Top
        : { top: '70%', left: '50%', transform: 'translate(-50%, -50%)', width: '50%' }; // Bottom
    } else if (total === 3) {
      const positions = [
        { top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: '50%' }, // Top
        { top: '65%', left: '50%', transform: 'translate(-50%, -50%)', width: '45%' }, // Bottom
        { top: '50%', right: '5%', transform: 'translateY(-50%)', width: '25%' } // Accessory
      ];
      return positions[index];
    }
    // Default grid for more items
    return { 
      top: `${25 + (index * 20)}%`, 
      left: '50%', 
      transform: 'translate(-50%, -50%)', 
      width: '40%' 
    };
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-gray-100 to-gray-200">
      {garments.map((garment, index) => (
        <div
          key={index}
          className="absolute"
          style={getPosition(index, garments.length)}
        >
          <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden shadow-2xl bg-white">
            <img
              src={garment.url}
              alt={garment.name || `Garment ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {garment.name && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <p className="text-white text-xs font-medium">{garment.name}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}