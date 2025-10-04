'use client';

import { motion } from 'framer-motion';
import { Upload, Brain, ShieldCheck, Download, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Upload',
    description: 'Upload any format - PDF, images, old CAD files, or handwritten drawings',
    icon: Upload,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600'
  },
  {
    number: 2,
    title: 'AI Processing',
    description: 'Computer vision detects symbols, OCR extracts text, GenAI validates context',
    icon: Brain,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600'
  },
  {
    number: 3,
    title: 'Validation',
    description: 'Confidence scoring flags items for review, engineering rules validate accuracy',
    icon: ShieldCheck,
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600'
  },
  {
    number: 4,
    title: 'Download',
    description: 'Get native CAD files, databases, 3D models, and API integrations',
    icon: Download,
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600'
  }
];

export default function HowItWorks() {
  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our AI-powered conversion process transforms legacy drawings into modern CAD files 
            in just four simple steps, delivering results in minutes instead of hours.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-4">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 h-full">
                  {/* Step Number */}
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${step.color} text-white font-bold text-lg flex items-center justify-center mb-4`}>
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-full ${step.bgColor} flex items-center justify-center mb-6`}>
                    <IconComponent className={`h-8 w-8 ${step.textColor}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow between steps (desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-8 transform -translate-y-1/2 z-10">
                    <ArrowRight className="h-8 w-8 text-gray-300" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Process Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Typical Processing Time
            </h3>
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500 mb-2">4-8 hours</div>
                <div className="text-sm text-gray-600">Manual Process</div>
              </div>
              <div className="text-4xl text-gray-300">→</div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500 mb-2">3-5 minutes</div>
                <div className="text-sm text-gray-600">With CADly</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}