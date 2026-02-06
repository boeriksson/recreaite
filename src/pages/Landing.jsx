import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { 
  Sparkles, 
  Zap, 
  Clock, 
  TrendingUp,
  Check,
  ArrowRight,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import ModelCarousel from '../components/landing/ModelCarousel';
import BeforeAfterSlider from '../components/landing/BeforeAfterSlider';
import ImageCarousel from '../components/landing/ImageCarousel';

export default function Landing() {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const pricingRef = useRef(null);
  
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -400]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const { data: models = [] } = useQuery({
    queryKey: ['models'],
    queryFn: () => base44.entities.Model.list('-created_date', 12)
  });

  const { data: latestImages = [] } = useQuery({
    queryKey: ['latest-generated-images'],
    queryFn: () => base44.entities.GeneratedImage.filter({ status: 'completed' }, '-created_date', 8),
    initialData: [],
  });

  const beforeAfterPair = {
    before: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694a63448589b28fcfe35847/d38c720aa_61654778_60604156-oyster-_11.jpg',
    after: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694a63448589b28fcfe35847/cfd27f8bc_Troja.png',
    garmentName: 'Tröja'
  };
  
  const exampleImages = latestImages.length >= 4 
    ? [latestImages[1]?.image_url, latestImages[3]?.image_url, latestImages[5]?.image_url, latestImages[7]?.image_url].filter(Boolean)
    : [
        'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694a63448589b28fcfe35847/a1f1c523c_generated_image.png',
        'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694a63448589b28fcfe35847/cf9a0b24f_generated_image.png',
        'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694a63448589b28fcfe35847/6a6fe55b1_generated_image.png',
        'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694a63448589b28fcfe35847/90922880f_generated_image.png'
      ];

  const features = [
    {
      icon: Clock,
      title: 'Spara 95% tid',
      description: 'Från timmar av fotostudio till sekunder med AI. Generera professionella produktbilder på några klick.'
    },
    {
      icon: TrendingUp,
      title: 'Öka konvertering',
      description: 'Professionella modellbilder ökar försäljningen med upp till 300%. Visa dina produkter i rätt kontext.'
    },
    {
      icon: Zap,
      title: 'Skalbar lösning',
      description: 'Perfekt för både små butiker och stora e-handelskedjor. Generera hundratals bilder samtidigt.'
    },
    {
      icon: Sparkles,
      title: 'Konsekvent kvalitet',
      description: 'AI-driven kvalitetskontroll säkerställer professionella resultat varje gång. Inga misslyckade photoshoots.'
    }
  ];



  return (
    <div className="bg-white dark:bg-black min-h-screen">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-black dark:via-gray-900 dark:to-black">
        <div className="max-w-7xl mx-auto px-5 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="z-10"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-black dark:text-white mb-6 leading-[1.05]">
              AI-genererade modeller
              <span className="block text-[#392599] mt-2">
                för professionell e-handel
              </span>
            </h1>
            
            <p className="text-xl text-black/70 dark:text-white/70 mb-8 leading-relaxed">
              HeyLook hjälper moderna e-handelsföretag skapa autentiska, professionella produktbilder i skala. Ge ditt team kreativ frihet, konsistens och full kontroll.
            </p>
            
            <div className="flex gap-3 justify-start">
              <Link to={createPageUrl('Dashboard')}>
                <Button className="bg-[#392599] hover:bg-[#4a2fb3] text-white text-sm px-6 py-3 rounded-full">
                  Kom igång
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="text-sm px-6 py-3 rounded-full border-2 border-[#392599] text-[#392599] hover:bg-[#392599]/10"
                onClick={() => pricingRef.current?.scrollIntoView({ behavior: 'smooth' })}
              >
                Boka demo
              </Button>
            </div>
          </motion.div>

          {/* Right Hero Carousel */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[600px]"
          >
            <ImageCarousel images={latestImages.length >= 8 
              ? latestImages.map(img => img.image_url).filter(Boolean)
              : [
                  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694a63448589b28fcfe35847/a1f1c523c_generated_image.png',
                  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694a63448589b28fcfe35847/cf9a0b24f_generated_image.png',
                  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694a63448589b28fcfe35847/6a6fe55b1_generated_image.png',
                  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694a63448589b28fcfe35847/90922880f_generated_image.png',
                  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694a63448589b28fcfe35847/476df764b_generated_image.png',
                  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694a63448589b28fcfe35847/0190b6895_generated_image.png',
                  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694a63448589b28fcfe35847/9f81e20d2_generated_image.png',
                  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694a63448589b28fcfe35847/e5cb3463f_generated_image.png'
                ]
            } />
          </motion.div>
        </div>
      </section>

      {/* Social Proof - Trusted By */}
      <section className="py-16 bg-[#392599] dark:bg-white">
        <div className="max-w-7xl mx-auto px-5">
          <p className="text-center text-white dark:text-black/60 text-sm mb-8 uppercase tracking-wider">
            Betrodd av ledande e-handelsföretag
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12">
            <svg className="h-8 text-white dark:text-black" viewBox="0 0 140 40" fill="currentColor">
              <text x="0" y="30" fontSize="28" fontWeight="bold" fontFamily="Arial, sans-serif">ZALANDO</text>
            </svg>
            <svg className="h-10 text-white dark:text-black" viewBox="0 0 80 40" fill="currentColor">
              <text x="0" y="30" fontSize="32" fontWeight="bold" fontFamily="Arial, sans-serif">H&M</text>
            </svg>
            <svg className="h-8 text-white dark:text-black" viewBox="0 0 100 40" fill="currentColor">
              <text x="0" y="30" fontSize="32" fontWeight="bold" fontFamily="Arial, sans-serif">ASOS</text>
            </svg>
            <svg className="h-8 text-white dark:text-black" viewBox="0 0 120 40" fill="currentColor">
              <text x="0" y="30" fontSize="32" fontWeight="bold" fontFamily="Arial, sans-serif">BOOZT</text>
            </svg>
            <svg className="h-8 text-white dark:text-black" viewBox="0 0 100 40" fill="currentColor">
              <text x="0" y="30" fontSize="32" fontWeight="bold" fontFamily="Arial, sans-serif">NELLY</text>
            </svg>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="relative py-32 px-5 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold text-black dark:text-white mb-6">
              Riktiga varumärken, riktiga resultat
            </h2>
            <p className="text-xl text-black/60 dark:text-white/60 max-w-2xl mx-auto">
              Se hur AI-genererade modeller gör skillnad för e-handelsföretag
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {exampleImages.map((img, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="relative group cursor-pointer"
              >
                <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
                  <img 
                    src={img} 
                    alt={`Example ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Slider */}
      <section className="py-32 px-5">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-5xl font-bold text-black dark:text-white mb-6">
                Se transformationen
              </h2>
              <p className="text-xl text-black/60 dark:text-white/60 max-w-2xl mx-auto">
                Från plagg till professionell produktbild på sekunder
              </p>
            </motion.div>
            <BeforeAfterSlider 
              beforeImage={beforeAfterPair.before}
              afterImage={beforeAfterPair.after}
              garmentName={beforeAfterPair.garmentName}
            />
          </div>
        </section>

      {/* Custom Models Section */}
      {models.length > 0 && (
        <section className="py-32 px-5 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-black dark:to-gray-900">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-5xl font-bold text-black dark:text-white mb-6">
                Skapa dina egna unika modeller
              </h2>
              <p className="text-xl text-black/60 dark:text-white/60 max-w-2xl mx-auto">
                Generera AI-modeller som matchar ditt varumärke perfekt. Anpassa ålder, etnicitet, kroppsstil och mer.
              </p>
            </motion.div>
            <ModelCarousel models={models} />
            <div className="text-center mt-8">
              <Link to={createPageUrl('Dashboard')}>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-6 rounded-full shadow-2xl">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Skapa dina modeller
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features with Case Studies */}
      <section ref={featuresRef} className="py-32 px-5 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold text-black dark:text-white mb-6">
              Transformera fotoshoots med AI-modeller
            </h2>
            <p className="text-xl text-black/60 dark:text-white/60 max-w-3xl mx-auto">
              Skapa högkvalitativa modebilder med AI-modeller. Polerade resultat, sömlöst arbetsflöde och ett team redo att guida varje steg.
            </p>
          </motion.div>

          <div className="space-y-32">
            {/* Feature 1 - Cut Costs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src={exampleImages[0]}
                  alt="Cut production costs"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-4xl font-bold text-black dark:text-white mb-4">
                  Spendera mindre, producera mer
                </h3>
                <p className="text-xl text-black/60 dark:text-white/60 mb-6">
                  Skapa studiokvalitativa modebilder utan att öka budgeten. AI-modeller ger dig samma professionella look, utan produktionskostnader.
                </p>
                <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-black/5 dark:border-white/5">
                  <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">-90%</div>
                  <p className="text-black/70 dark:text-white/70">
                    Sänk produktionskostnader och spara tusentals kronor med HeyLooks AI
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Feature 2 - Speed */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              <div className="order-2 lg:order-1">
                <h3 className="text-4xl font-bold text-black dark:text-white mb-4">
                  Snabbare lansering på marknaden
                </h3>
                <p className="text-xl text-black/60 dark:text-white/60 mb-6">
                  Påskynda produktionscykler och leverera nya kollektioner på dagar. Modeteam kan nu uppdatera looks, förnya bilder och röra sig snabbare än någonsin.
                </p>
                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-black/5 dark:border-white/5">
                  <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">40x</div>
                  <p className="text-black/70 dark:text-white/70">
                    Kortare produktionstid från 6 veckor till 24 timmar
                  </p>
                </div>
              </div>
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl order-1 lg:order-2">
                <img 
                  src={exampleImages[1]}
                  alt="Get to market faster"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            {/* Feature 3 - Diversity */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src={exampleImages[2]}
                  alt="Increase diversity"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-4xl font-bold text-black dark:text-white mb-4">
                  Inkluderande från start
                </h3>
                <p className="text-xl text-black/60 dark:text-white/60 mb-6">
                  Visa mångfald med AI-modeller - olika hudtoner, kroppstyper och stilar - så att dina bilder speglar riktiga kunder, överallt.
                </p>
                <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-black/5 dark:border-white/5">
                  <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">+150%</div>
                  <p className="text-black/70 dark:text-white/70">
                    Ökad CTR genom att använda mångfaldiga modeller för att nå fler kunder
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-32 px-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="mb-8">
              <div className="text-6xl mb-6">💬</div>
              <blockquote className="text-2xl sm:text-3xl font-medium text-black dark:text-white mb-8 leading-relaxed">
                "Sedan vi började använda HeyLook kan vi äntligen fokusera på kreativitet istället för koordination och arbeta med den sömlösa flexibilitet som modern e-handel kräver."
              </blockquote>
              <div className="flex items-center justify-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                <div className="text-left">
                  <p className="font-semibold text-black dark:text-white">Emma Andersson</p>
                  <p className="text-black/60 dark:text-white/60">Creative Director, Nordic Fashion</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-32 px-5">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex flex-col sm:flex-row justify-center gap-8 sm:gap-16">
              <div>
                <div className="text-6xl sm:text-7xl lg:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-3">
                  95%
                </div>
                <p className="text-lg sm:text-xl text-black/60 dark:text-white/60">Tidsbesparning</p>
              </div>
              <div>
                <div className="text-6xl sm:text-7xl lg:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-3">
                  3x
                </div>
                <p className="text-lg sm:text-xl text-black/60 dark:text-white/60">Högre konvertering</p>
              </div>
              <div>
                <div className="text-6xl sm:text-7xl lg:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-3">
                  24/7
                </div>
                <p className="text-lg sm:text-xl text-black/60 dark:text-white/60">Alltid tillgänglig</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-32 px-5 bg-black dark:bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl font-bold text-white dark:text-black mb-6 tracking-tight">
              Transformera fotoshoots och få felfria resultat på nolltid
            </h2>
            <p className="text-xl text-white/70 dark:text-black/70 mb-12">
              Börja skapa professionella AI-genererade produktbilder idag
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl('Dashboard')}>
                <Button className="bg-[#392599] hover:bg-[#4a2fb3] text-white text-lg px-10 py-6 rounded-full">
                  Kom igång
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="text-lg px-10 py-6 rounded-full border-2 border-[#392599] dark:border-white text-[#392599] dark:text-white hover:bg-[#392599]/10 dark:hover:bg-white/10 bg-white dark:bg-transparent"
                onClick={() => pricingRef.current?.scrollIntoView({ behavior: 'smooth' })}
              >
                Boka demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>


    </div>
  );
}