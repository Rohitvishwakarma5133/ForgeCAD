'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, Eye, FileText, Zap, Network, Shield, 
  Database, Download, ArrowRight, CheckCircle,
  Settings, BarChart3, Globe, Lock
} from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    title: 'Computer Vision Module',
    description: 'Advanced YOLOv8 custom model trained specifically for engineering symbols',
    icon: Eye,
    color: 'blue',
    stats: ['200+ symbol types', '94% accuracy', 'Real-time processing'],
    details: [
      'Custom-trained YOLOv8 model for engineering drawings',
      'Recognizes pumps, valves, vessels, instruments, and more',
      'Handles both standard and custom symbols',
      'Works with hand-drawn and CAD-generated drawings'
    ]
  },
  {
    title: 'Dual OCR Engine',
    description: 'Hybrid text recognition system for printed and handwritten content',
    icon: FileText,
    color: 'green',
    stats: ['98.7% printed accuracy', '87.2% handwritten', 'Multi-language support'],
    details: [
      'Tesseract OCR for high-quality printed text',
      'TrOCR transformer for handwritten annotations',
      'Automatic text orientation correction',
      'Equipment tags, dimensions, and specifications extraction'
    ]
  },
  {
    title: 'Line Tracing & Connectivity',
    description: 'Intelligent pipe and electrical connection mapping',
    icon: Network,
    color: 'purple',
    stats: ['Auto-detection', 'Flow direction', '3D mapping'],
    details: [
      'Automatic pipe and conduit tracing',
      'Flow direction detection and validation',
      'Connection point identification',
      '3D piping model generation'
    ]
  },
  {
    title: 'GenAI Intelligence',
    description: 'GPT-4V powered context understanding and validation',
    icon: Brain,
    color: 'orange',
    stats: ['Context aware', 'Multi-modal', 'Self-correcting'],
    details: [
      'GPT-4V for visual reasoning and context',
      'Engineering knowledge base integration',
      'Semantic validation of extracted data',
      'Automatic error detection and correction'
    ]
  },
  {
    title: 'Knowledge Graph',
    description: 'Neo4j-powered relationship mapping for complex systems',
    icon: Database,
    color: 'teal',
    stats: ['Neo4j powered', 'Complex queries', 'Relationship mapping'],
    details: [
      'Equipment relationship modeling',
      'Process flow understanding',
      'System hierarchy representation',
      'Advanced query capabilities'
    ]
  },
  {
    title: 'Quality Assurance',
    description: 'Multi-layer validation with confidence scoring',
    icon: Shield,
    color: 'red',
    stats: ['Confidence scoring', 'Rule validation', 'Human review'],
    details: [
      'Item-level confidence scoring (0-100%)',
      'Engineering rule validation engine',
      'Human-in-the-loop review workflow',
      'Quality metrics and reporting'
    ]
  },
  {
    title: 'Output Formats',
    description: 'Native CAD files and multiple export options',
    icon: Download,
    color: 'indigo',
    stats: ['Native CAD', '3D models', 'Database export'],
    details: [
      'AutoCAD DWG/DXF native format',
      '3D models (IFC, Navisworks)',
      'Equipment databases (SQL, Excel)',
      'REST APIs for system integration'
    ]
  },
  {
    title: 'Enterprise Integration',
    description: 'Seamless integration with enterprise systems',
    icon: Globe,
    color: 'pink',
    stats: ['ERP integration', 'CMMS support', 'API access'],
    details: [
      'SAP, Oracle ERP integration',
      'Maximo, Infor CMMS support',
      'RESTful APIs for custom integration',
      'Batch processing capabilities'
    ]
  }
];

const technicalSpecs = [
  {
    category: 'Processing Performance',
    specs: [
      { label: 'Typical Processing Time', value: '3-5 minutes' },
      { label: 'Maximum File Size', value: '50MB' },
      { label: 'Concurrent Jobs', value: '100+' },
      { label: 'Uptime SLA', value: '99.9%' }
    ]
  },
  {
    category: 'Accuracy Metrics',
    specs: [
      { label: 'Symbol Detection', value: '94.2%' },
      { label: 'Text Recognition (Printed)', value: '98.7%' },
      { label: 'Text Recognition (Handwritten)', value: '87.2%' },
      { label: 'Overall Accuracy', value: '91.5%' }
    ]
  },
  {
    category: 'Security & Compliance',
    specs: [
      { label: 'Data Encryption', value: 'AES-256' },
      { label: 'Compliance', value: 'SOC 2, ISO 27001' },
      { label: 'Data Retention', value: 'Configurable' },
      { label: 'Access Control', value: 'RBAC' }
    ]
  }
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
            Advanced AI Technology
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
            Powerful Features Built for Engineers
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
            Our AI-powered platform combines cutting-edge computer vision, machine learning, 
            and engineering expertise to deliver unmatched accuracy and speed in drawing conversion.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo">
              <Button size="lg" className="px-8">
                Try Live Demo <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="px-8">
                Schedule Demo
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-xl transition-shadow duration-300 group">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg bg-${feature.color}-100 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <IconComponent className={`h-6 w-6 text-${feature.color}-600`} />
                      </div>
                      <div className="flex gap-2">
                        {feature.stats.map((stat, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {stat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Technical Specifications */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Technical Specifications
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Detailed performance metrics and capabilities of our AI conversion platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {technicalSpecs.map((category, index) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{category.category}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {category.specs.map((spec, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{spec.label}</span>
                        <span className="font-semibold">{spec.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Security & Compliance */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="bg-gray-900 text-white rounded-3xl p-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <Lock className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-4">
                  Enterprise Security & Compliance
                </h2>
                <p className="text-gray-300 mb-6">
                  Built with enterprise-grade security and compliance standards from day one.
                </p>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    SOC 2 Type II Certified
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    ISO 27001 Compliant
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    GDPR Ready
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    End-to-end Encryption
                  </li>
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/10 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">99.9%</div>
                  <div className="text-sm text-gray-300">Uptime SLA</div>
                </div>
                <div className="bg-white/10 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">256-bit</div>
                  <div className="text-sm text-gray-300">AES Encryption</div>
                </div>
                <div className="bg-white/10 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">24/7</div>
                  <div className="text-sm text-gray-300">Monitoring</div>
                </div>
                <div className="bg-white/10 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">Zero</div>
                  <div className="text-sm text-gray-300">Data Breaches</div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-3xl p-12">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Engineering Workflow?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Experience the power of AI-driven drawing conversion. Start your free trial today 
              and see why leading engineering teams trust CADly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/converter">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 hover:text-white px-8 bg-transparent">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}