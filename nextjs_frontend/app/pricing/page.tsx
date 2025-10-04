'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Check, X, ArrowRight, Calculator, 
  Zap, Shield, Headphones, Clock,
  Users, Building, Star
} from 'lucide-react';
import Link from 'next/link';
import { PRICING_TIERS } from '@/lib/constants';

const additionalFeatures = [
  { name: 'Multi-format Input Support', starter: true, pro: true, enterprise: true },
  { name: 'AI Symbol Detection', starter: true, pro: true, enterprise: true },
  { name: 'Basic OCR Text Extraction', starter: true, pro: true, enterprise: true },
  { name: '48-hour Processing SLA', starter: true, pro: false, enterprise: false },
  { name: '4-hour Priority SLA', starter: false, pro: true, enterprise: false },
  { name: '1-hour Enterprise SLA', starter: false, pro: false, enterprise: true },
  { name: 'API Access', starter: false, pro: true, enterprise: true },
  { name: 'Batch Upload', starter: false, pro: true, enterprise: true },
  { name: 'Custom Validation Rules', starter: false, pro: true, enterprise: true },
  { name: 'Advanced Analytics', starter: false, pro: true, enterprise: true },
  { name: 'White-label Solution', starter: false, pro: false, enterprise: true },
  { name: 'On-premise Deployment', starter: false, pro: false, enterprise: true },
  { name: 'Custom AI Training', starter: false, pro: false, enterprise: true },
  { name: 'Dedicated Account Manager', starter: false, pro: false, enterprise: true },
  { name: '24/7 Phone Support', starter: false, pro: false, enterprise: true },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [roiDrawings, setRoiDrawings] = useState(1000);
  const [roiCurrentCost, setRoiCurrentCost] = useState(300);

  const calculateSavings = () => {
    const currentAnnualCost = roiDrawings * roiCurrentCost;
    const cadlyAnnualCost = roiDrawings * 15; // Average CADly cost per drawing
    const savings = currentAnnualCost - cadlyAnnualCost;
    const savingsPercent = Math.round((savings / currentAnnualCost) * 100);
    return { savings, savingsPercent, currentAnnualCost, cadlyAnnualCost };
  };

  const roi = calculateSavings();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-green-100 text-green-700 hover:bg-green-100">
            Simple, Transparent Pricing
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            From pay-per-drawing flexibility to enterprise-scale solutions. 
            Start free and scale as you grow with transparent, predictable pricing.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${billingCycle === 'monthly' ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                billingCycle === 'yearly' ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  billingCycle === 'yearly' ? 'transform translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className={`text-sm ${billingCycle === 'yearly' ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <Badge className="bg-green-100 text-green-700 text-xs">
                Save 20%
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {PRICING_TIERS.map((tier, index) => {
            const isPopular = tier.popular;
            const price = tier.price === 0 ? 'Custom' : 
              tier.period === 'per-drawing' ? `$${tier.price}+` :
              billingCycle === 'yearly' ? `$${Math.round(tier.price * 0.8)}` : `$${tier.price}`;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative ${isPopular ? 'lg:scale-105' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <Card className={`h-full ${isPopular ? 'border-blue-500 shadow-2xl' : 'hover:shadow-xl'} transition-all duration-300`}>
                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">{price}</span>
                      {tier.price > 0 && (
                        <span className="text-gray-600 ml-1">
                          /{tier.period === 'per-drawing' ? 'drawing' : billingCycle === 'yearly' ? 'year' : 'month'}
                        </span>
                      )}
                    </div>
                    <CardDescription className="text-base">
                      {tier.id === 'pay-per-drawing' && 'Perfect for occasional conversions'}
                      {tier.id === 'professional' && 'Ideal for growing engineering teams'}
                      {tier.id === 'enterprise' && 'Built for large-scale operations'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Key Stats */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      {tier.id === 'pay-per-drawing' && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600 mb-1">$10-25</div>
                          <div className="text-sm text-gray-600">per drawing</div>
                        </div>
                      )}
                      {tier.id === 'professional' && (
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-xl font-bold text-blue-600">100</div>
                            <div className="text-xs text-gray-600">drawings/month</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-green-600">$5</div>
                            <div className="text-xs text-gray-600">additional</div>
                          </div>
                        </div>
                      )}
                      {tier.id === 'enterprise' && (
                        <div className="text-center">
                          <div className="text-xl font-bold text-purple-600 mb-1">Unlimited</div>
                          <div className="text-sm text-gray-600">drawings & features</div>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <div className="pt-6">
                      {tier.id === 'enterprise' ? (
                        <Link href="/contact">
                          <Button className="w-full" size="lg">
                            Contact Sales
                          </Button>
                        </Link>
                      ) : (
                        <Link href="/demo">
                          <Button 
                            className={`w-full ${isPopular ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''}`}
                            variant={isPopular ? 'default' : 'outline'}
                            size="lg"
                          >
                            {tier.id === 'pay-per-drawing' ? 'Get Started' : 'Start Free Trial'}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>

                    {/* Additional Info */}
                    <div className="text-xs text-gray-500 text-center pt-2">
                      {tier.id === 'professional' && '14-day free trial • No credit card required'}
                      {tier.id === 'pay-per-drawing' && 'No subscription • Pay as you go'}
                      {tier.id === 'enterprise' && 'Custom deployment • Dedicated support'}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Compare All Features
            </h2>
            <p className="text-gray-600">
              See exactly what&apos;s included in each plan
            </p>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-6 font-semibold">Feature</th>
                      <th className="text-center p-6 font-semibold">Pay-per-Drawing</th>
                      <th className="text-center p-6 font-semibold bg-blue-50">Professional</th>
                      <th className="text-center p-6 font-semibold">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {additionalFeatures.map((feature, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{feature.name}</td>
                        <td className="p-4 text-center">
                          {feature.starter ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="p-4 text-center bg-blue-50">
                          {feature.pro ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {feature.enterprise ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* ROI Calculator */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-3xl p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                  <Calculator className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-4">ROI Calculator</h2>
                <p className="text-lg opacity-90 mb-8">
                  See how much you could save by switching to CADly for your drawing conversions.
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Drawings per year
                    </label>
                    <Input
                      type="number"
                      value={roiDrawings}
                      onChange={(e) => setRoiDrawings(Number(e.target.value))}
                      className="bg-white/20 border-white/30 text-white placeholder-white/70"
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Current cost per drawing
                    </label>
                    <Input
                      type="number"
                      value={roiCurrentCost}
                      onChange={(e) => setRoiCurrentCost(Number(e.target.value))}
                      className="bg-white/20 border-white/30 text-white placeholder-white/70"
                      placeholder="300"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-6">Annual Savings</h3>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-300 mb-2">
                      ${roi.currentAnnualCost.toLocaleString()}
                    </div>
                    <div className="text-sm opacity-80">Current Cost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-300 mb-2">
                      ${roi.cadlyAnnualCost.toLocaleString()}
                    </div>
                    <div className="text-sm opacity-80">With CADly</div>
                  </div>
                </div>
                
                <div className="text-center pt-6 border-t border-white/20">
                  <div className="text-4xl font-bold text-yellow-300 mb-2">
                    ${roi.savings.toLocaleString()}
                  </div>
                  <div className="text-lg mb-2">Annual Savings</div>
                  <div className="text-2xl font-semibold text-green-300">
                    {roi.savingsPercent}% Reduction
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* FAQ Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600">
              Everything you need to know about our pricing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                question: "What's included in the free trial?",
                answer: "The 14-day free trial includes 10 drawing conversions, full access to all Professional features, and priority support."
              },
              {
                question: "Can I change plans anytime?",
                answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the next billing cycle."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards, PayPal, and can arrange wire transfers for enterprise customers."
              },
              {
                question: "Is there a setup fee?",
                answer: "No setup fees for Pay-per-Drawing and Professional plans. Enterprise deployments may include one-time implementation costs."
              },
              {
                question: "What if I exceed my monthly limit?",
                answer: "Additional drawings are charged at $5 each for Professional plans. Enterprise plans have unlimited usage."
              },
              {
                question: "Do you offer refunds?",
                answer: "We offer a 30-day money-back guarantee if you're not satisfied with our service."
              }
            ].map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join thousands of engineers who have already transformed their workflow with CADly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/demo">
                  <Button size="lg" className="px-8">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" size="lg" className="px-8">
                    Contact Sales
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                No credit card required • 14-day free trial • Cancel anytime
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}