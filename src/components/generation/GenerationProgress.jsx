import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';

export default function GenerationProgress({ status, progress }) {
  const steps = [
    { id: 1, label: 'Analyserar plagg' },
    { id: 2, label: 'Förbereder modell' },
    { id: 3, label: 'Genererar bild' },
    { id: 4, label: 'Slutför' },
  ];

  const currentStep = Math.ceil((progress / 100) * steps.length) || 1;

  return (
    <div className="space-y-8">
      {/* Progress ring */}
      <div className="flex justify-center">
        <div className="relative">
          <svg className="w-32 h-32 -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="8"
              className="dark:stroke-white/10"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="#392599"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={352}
              initial={{ strokeDashoffset: 352 }}
              animate={{ strokeDashoffset: 352 - (352 * progress) / 100 }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-semibold text-black dark:text-white">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              step.id === currentStep
                ? 'bg-[#392599]/10 border border-[#392599]/30'
                : step.id < currentStep
                ? 'bg-black/5 dark:bg-white/5'
                : 'opacity-40'
            }`}
          >
            <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
              step.id < currentStep
                ? 'bg-[#392599]'
                : step.id === currentStep
                ? 'bg-[#392599]/30'
                : 'bg-black/10 dark:bg-white/10'
            }`}>
              {step.id === currentStep ? (
                <Loader2 className="h-3 w-3 text-[#392599] animate-spin" />
              ) : step.id < currentStep ? (
                <span className="text-xs text-black dark:text-white font-medium">✓</span>
              ) : (
                <span className="text-xs text-black/40 dark:text-white/40">{step.id}</span>
              )}
            </div>
            <span className={step.id <= currentStep ? 'text-black dark:text-white' : 'text-black/40 dark:text-white/40'}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}