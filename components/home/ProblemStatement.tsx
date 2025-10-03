'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, DollarSign, Clock, TrendingDown } from 'lucide-react';

const problems = [
  {
    icon: AlertTriangle,
    stat: '70%',
    description: 'of engineering docs locked in paper/PDFs',
    color: 'text-red-500',
    bgColor: 'bg-red-50'
  },
  {
    icon: DollarSign,
    stat: '$300-500',
    description: 'per drawing for manual conversion',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50'
  },
  {
    icon: Clock,
    stat: '4-8 hours',
    description: 'per drawing wasted on manual work',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50'
  },
  {
    icon: TrendingDown,
    stat: '15-25%',
    description: 'error rate in manual data entry',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50'
  }
];

export default function ProblemStatement() {
  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
            The $50 Billion Problem
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Legacy engineering documentation is costing the industry billions in 
            inefficiencies, delays, and lost productivity.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {problems.map((problem, index) => {
            const IconComponent = problem.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              >
                <div className={`w-16 h-16 rounded-full ${problem.bgColor} flex items-center justify-center mb-6`}>
                  <IconComponent className={`h-8 w-8 ${problem.color}`} />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {problem.stat}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {problem.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-8 rounded-2xl max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">
              The Result: Massive Inefficiency Across Industries
            </h3>
            <p className="text-lg opacity-90">
              Organizations are spending millions on manual conversion processes, 
              experiencing project delays, and struggling with data accuracy issues 
              that could be solved with modern AI technology.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}