'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Award, Users } from 'lucide-react';
import Link from 'next/link';

const trustBadges = [
  { icon: Shield, text: 'SOC 2 Certified' },
  { icon: Award, text: 'ISO 27001' },
  { icon: Users, text: 'GDPR Compliant' }
];

export default function CTA() {
  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-blue-600 to-purple-600 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto"
        >
          <h2 className="text-3xl lg:text-5xl font-bold mb-6">
            Ready to Digitize Your Legacy Drawings?
          </h2>
          <p className="text-xl lg:text-2xl text-blue-100 mb-8 leading-relaxed">
            Join thousands of engineers who have transformed their workflow with CADly. 
            Start converting your drawings today and experience the future of engineering documentation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/demo">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8"
              >
                Schedule Demo
              </Button>
            </Link>
          </div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8"
          >
            <span className="text-sm text-blue-200 font-medium">
              Trusted by industry leaders
            </span>
            <div className="flex items-center gap-6">
              {trustBadges.map((badge, index) => {
                const IconComponent = badge.icon;
                return (
                  <div key={index} className="flex items-center gap-2 text-blue-100">
                    <IconComponent className="h-5 w-5" />
                    <span className="text-sm font-medium">{badge.text}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Additional Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-white/20"
          >
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold mb-1">50K+</div>
              <div className="text-sm text-blue-200">Drawings Converted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold mb-1">500+</div>
              <div className="text-sm text-blue-200">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold mb-1">99.9%</div>
              <div className="text-sm text-blue-200">Uptime SLA</div>
            </div>
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold mb-1">24/7</div>
              <div className="text-sm text-blue-200">Enterprise Support</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}