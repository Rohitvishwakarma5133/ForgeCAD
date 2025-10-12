'use client';

import { motion } from 'framer-motion';
import { INDUSTRIES } from '@/lib/constants';

export default function Industries() {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
            Trusted Across Industries
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From oil & gas to manufacturing, CADly is transforming how organizations 
            handle their legacy engineering documentation across multiple sectors.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {INDUSTRIES.map((industry, index) => (
            <motion.div
              key={industry.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {industry.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {industry.name}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {industry.description}
              </p>
            </motion.div>
          ))}
          
          {/* Additional industry card to make grid complete */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
            className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
              🏥
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Healthcare & Pharma
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Medical facility design and pharmaceutical plant documentation
            </p>
          </motion.div>
        </div>

        {/* Case Study Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">
                  Success Story: Major Oil Refinery
                </h3>
                <p className="text-lg opacity-90 mb-6">
                  &quot;CADly helped us digitize 15,000 legacy P&ID drawings in just 3 months, 
                  saving our team over 2 years of manual work and $1.2 million in costs.&quot;
                </p>
                <div className="text-sm opacity-80">
                  — Senior Engineering Manager, Fortune 500 Energy Company
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-2xl font-bold">15,000</div>
                  <div className="text-sm opacity-80">Drawings Processed</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-2xl font-bold">3 months</div>
                  <div className="text-sm opacity-80">Project Duration</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-2xl font-bold">$1.2M</div>
                  <div className="text-sm opacity-80">Cost Savings</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-2xl font-bold">94%</div>
                  <div className="text-sm opacity-80">Accuracy Rate</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}