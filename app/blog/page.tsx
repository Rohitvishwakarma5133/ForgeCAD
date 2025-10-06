import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | CADly AI',
  description: 'Insights, updates, and technical articles about CAD analysis and AI technology.',
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              CADly AI Blog
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Insights, updates, and technical articles about CAD analysis and AI
            </p>
          </div>

          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8">
            {/* Featured Article */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="h-64 bg-gradient-to-br from-blue-500 to-purple-600"></div>
              <div className="p-8">
                <div className="flex items-center mb-4">
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">Featured</span>
                  <span className="text-gray-500 text-sm ml-4">Dec 6, 2024</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  The Future of CAD Analysis: How AI is Revolutionizing Engineering Design
                </h2>
                <p className="text-gray-600 mb-6">
                  Explore how artificial intelligence is transforming the way engineers analyze and interpret CAD drawings, 
                  from automated symbol recognition to intelligent process optimization.
                </p>
                <a href="#" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
                  Read More →
                </a>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Recent Posts */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Posts</h3>
                <div className="space-y-4">
                  <article className="border-b border-gray-200 pb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      <a href="#" className="hover:text-blue-600">Advanced OCR Techniques for Technical Drawings</a>
                    </h4>
                    <p className="text-sm text-gray-600">Dec 1, 2024</p>
                  </article>
                  <article className="border-b border-gray-200 pb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      <a href="#" className="hover:text-blue-600">Building Scalable AI Pipelines with Next.js</a>
                    </h4>
                    <p className="text-sm text-gray-600">Nov 28, 2024</p>
                  </article>
                  <article>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      <a href="#" className="hover:text-blue-600">Industry Standards in P&ID Analysis</a>
                    </h4>
                    <p className="text-sm text-gray-600">Nov 25, 2024</p>
                  </article>
                </div>
              </div>

              {/* Categories */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Categories</h3>
                <div className="space-y-2">
                  <a href="#" className="block text-gray-600 hover:text-blue-600">AI & Machine Learning</a>
                  <a href="#" className="block text-gray-600 hover:text-blue-600">CAD Technology</a>
                  <a href="#" className="block text-gray-600 hover:text-blue-600">Engineering Insights</a>
                  <a href="#" className="block text-gray-600 hover:text-blue-600">Product Updates</a>
                  <a href="#" className="block text-gray-600 hover:text-blue-600">Industry News</a>
                </div>
              </div>
            </div>
          </div>

          {/* More Articles */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            <article className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-green-500 to-blue-500"></div>
              <div className="p-6">
                <div className="flex items-center mb-3">
                  <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">Technical</span>
                  <span className="text-gray-500 text-sm ml-4">Nov 20, 2024</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Multi-AI Validation: Ensuring Accuracy in Automated Analysis
                </h3>
                <p className="text-gray-600 mb-4">
                  Learn how we use multiple AI models to cross-validate analysis results and ensure maximum accuracy.
                </p>
                <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">Read More →</a>
              </div>
            </article>

            <article className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-purple-500 to-pink-500"></div>
              <div className="p-6">
                <div className="flex items-center mb-3">
                  <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">Case Study</span>
                  <span className="text-gray-500 text-sm ml-4">Nov 15, 2024</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Processing 10,000+ Engineering Drawings: A Performance Deep Dive
                </h3>
                <p className="text-gray-600 mb-4">
                  Real-world performance metrics from our largest deployment to date.
                </p>
                <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">Read More →</a>
              </div>
            </article>

            <article className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-orange-500 to-red-500"></div>
              <div className="p-6">
                <div className="flex items-center mb-3">
                  <span className="bg-orange-100 text-orange-800 text-sm font-medium px-3 py-1 rounded-full">Tutorial</span>
                  <span className="text-gray-500 text-sm ml-4">Nov 10, 2024</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Getting Started with CADly AI: A Complete Guide
                </h3>
                <p className="text-gray-600 mb-4">
                  Step-by-step tutorial for new users to maximize their CAD analysis workflows.
                </p>
                <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">Read More →</a>
              </div>
            </article>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600">
              Want to stay updated with our latest insights?
            </p>
            <a 
              href="#" 
              className="inline-flex items-center px-6 py-3 mt-4 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Subscribe to Newsletter
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}