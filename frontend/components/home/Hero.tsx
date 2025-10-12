'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, X } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { STATS } from '@/lib/constants';

export default function Hero() {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-black/20" />
      <div className="container mx-auto px-4 py-20 lg:py-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              Transform Legacy Drawings into Digital Intelligence
            </h1>
            <p className="text-xl lg:text-2xl mb-8 text-blue-100 leading-relaxed">
              AI-powered platform that converts engineering drawings and datasheets 
              into structured CAD files in minutes, not hours
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/converter">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold">
                  Try Free Demo <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 hover:text-white font-semibold bg-transparent"
                onClick={() => setShowVideo(true)}
              >
                <Play className="mr-2 h-5 w-5" /> Watch Video
              </Button>
            </div>
            
            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {STATS.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="text-center"
                >
                  <div className="text-2xl lg:text-3xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-blue-200 mt-1">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Column - Animation/Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-square bg-white/10 rounded-3xl backdrop-blur-sm p-8 border border-white/20">
              {/* Placeholder for hero animation/illustration */}
              <div className="w-full h-full bg-gradient-to-br from-white/20 to-transparent rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/40 rounded-lg"></div>
                  </div>
                  <p className="text-white/80 text-lg font-medium">
                    Upload → AI Process → Download CAD
                  </p>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <motion.div 
              className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400 rounded-full opacity-20"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div 
              className="absolute -bottom-6 -left-6 w-12 h-12 bg-green-400 rounded-full opacity-20"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </motion.div>
        </div>
      </div>
      </section>

      {/* Video Modal */}
      {showVideo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowVideo(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => setShowVideo(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                CADly Demo Video
              </h3>
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                <div className="text-center">
                  <Play className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Demo video coming soon!
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    For now, try our interactive demo
                  </p>
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <Link href="/converter">
                  <Button onClick={() => setShowVideo(false)}>
                    Try Interactive Demo
                  </Button>
                </Link>
                <Button variant="outline" onClick={() => setShowVideo(false)}>
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
