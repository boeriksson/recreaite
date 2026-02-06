import React from 'react';
import SiteScanner from '../components/dashboard/SiteScanner';
import { motion } from 'framer-motion';

export default function SiteScannerPage() {
  return (
    <div className="max-w-[980px] mx-auto px-5 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-5xl font-semibold tracking-tight text-black dark:text-white mb-4">
          AI Site Scanner
        </h1>
        <p className="text-xl text-black/60 dark:text-white/60">
          Analysera varumärkets visuella identitet och skapa brand seeds
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#f5f5f7] rounded-2xl p-8"
      >
        <SiteScanner />
      </motion.div>
    </div>
  );
}