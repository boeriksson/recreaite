import React from 'react';
import { motion } from 'framer-motion';

export default function ImageCarousel({ images }) {
  // Create a duplicated array for seamless loop
  const duplicatedImages = [...images, ...images, ...images];
  
  // Different sizes for visual interest
  const sizes = [
    { width: 'w-64', height: 'h-80' },
    { width: 'w-72', height: 'h-96' },
    { width: 'w-56', height: 'h-72' },
    { width: 'w-64', height: 'h-80' },
    { width: 'w-80', height: 'h-[26rem]' },
    { width: 'w-60', height: 'h-80' },
    { width: 'w-72', height: 'h-96' },
    { width: 'w-64', height: 'h-80' },
  ];

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Gradient overlays */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-50 dark:from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-50 dark:from-black to-transparent z-10 pointer-events-none" />
      
      {/* Scrolling container */}
      <motion.div
        className="flex gap-6"
        animate={{
          x: [0, -1920], // Moves left
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 40,
            ease: "linear",
          },
        }}
      >
        {duplicatedImages.map((image, idx) => {
          const sizeClass = sizes[idx % sizes.length];
          return (
            <div
              key={idx}
              className={`${sizeClass.width} ${sizeClass.height} flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300`}
            >
              <img
                src={image}
                alt={`Generated image ${idx}`}
                className="w-full h-full object-cover"
              />
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}