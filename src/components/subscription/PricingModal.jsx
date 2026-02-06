import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { X, Check, Sparkles } from 'lucide-react';
import { cn } from "@/lib/utils";

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '0 kr',
    period: '',
    images: 10,
    features: ['10 bilder totalt', 'Grundläggande modeller', 'Standard kvalitet']
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '299 kr',
    period: '/månad',
    images: 100,
    features: ['100 bilder/månad', 'Alla modeller', 'HD kvalitet', 'Email support']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '899 kr',
    period: '/månad',
    images: 500,
    features: ['500 bilder/månad', 'Alla modeller', '4K kvalitet', 'Prioriterad support', 'Custom modeller'],
    popular: true
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: '1999 kr',
    period: '/månad',
    images: -1,
    features: ['Obegränsat bilder', 'Alla modeller', '4K kvalitet', 'Dedicerad support', 'Custom modeller', 'API access']
  }
];

export default function PricingModal({ onClose, onSelectPlan, currentPlan, darkMode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${darkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-black/10'} rounded-3xl max-w-6xl w-full border p-8 my-8`}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-semibold mb-2">Välj din plan</h2>
            <p className={darkMode ? 'text-white/60' : 'text-black/60'}>
              Uppgradera för att generera fler bilder
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'} transition-colors`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "relative rounded-2xl p-6 border-2 transition-all",
                plan.popular 
                  ? "border-[#0071e3] bg-[#0071e3]/5" 
                  : darkMode 
                    ? "border-white/10 hover:border-white/20" 
                    : "border-black/10 hover:border-black/20",
                currentPlan === plan.id && "ring-2 ring-[#0071e3]"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#0071e3] text-white text-xs font-medium rounded-full">
                  Populär
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className={`text-sm ml-1 ${darkMode ? 'text-white/60' : 'text-black/60'}`}>{plan.period}</span>
                </div>
                <p className={`text-sm mt-2 ${darkMode ? 'text-white/60' : 'text-black/60'}`}>
                  {plan.images === -1 ? 'Obegränsat' : `${plan.images} bilder`}
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-[#0071e3] mt-0.5 flex-shrink-0" />
                    <span className={darkMode ? 'text-white/80' : 'text-black/80'}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => onSelectPlan(plan.id)}
                className={cn(
                  "w-full rounded-full",
                  plan.popular || currentPlan === plan.id
                    ? "bg-[#0071e3] hover:bg-[#0077ED] text-white"
                    : darkMode
                      ? "bg-white/10 hover:bg-white/20 text-white"
                      : "bg-black/5 hover:bg-black/10 text-black"
                )}
                disabled={currentPlan === plan.id}
              >
                {currentPlan === plan.id ? 'Nuvarande plan' : plan.id === 'free' ? 'Börja gratis' : 'Uppgradera'}
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}