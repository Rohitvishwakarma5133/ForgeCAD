import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Careers | CADly AI',
  description: 'Join our team and help revolutionize CAD analysis with AI technology.',
};

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Join CADly AI
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Help us revolutionize engineering design with cutting-edge AI technology
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Why Work With Us?
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Innovation First</h3>
                    <p className="text-gray-600">Work on cutting-edge AI technology that's transforming engineering workflows.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex-shrink-0 mt-1"></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Global Impact</h3>
                    <p className="text-gray-600">Your work will be used by engineers and designers worldwide.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex-shrink-0 mt-1"></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Remote Friendly</h3>
                    <p className="text-gray-600">Work from anywhere with flexible hours and async collaboration.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex-shrink-0 mt-1"></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Growth Focused</h3>
                    <p className="text-gray-600">Continuous learning opportunities and career development support.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Open Positions
            </h2>
            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">Senior Full-Stack Developer</h3>
                <p className="text-gray-600 mb-2">Next.js, TypeScript, AI/ML Integration</p>
                <p className="text-sm text-gray-500">Remote • Full-time</p>
              </div>
              <div className="border-l-4 border-green-500 pl-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">AI/ML Engineer</h3>
                <p className="text-gray-600 mb-2">Computer Vision, OpenAI, Claude, Python</p>
                <p className="text-sm text-gray-500">Remote • Full-time</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">CAD/Engineering Expert</h3>
                <p className="text-gray-600 mb-2">AutoCAD, P&ID, Industrial Process Knowledge</p>
                <p className="text-sm text-gray-500">Remote • Contract</p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4">
                Interested in joining our team? Send us your resume and portfolio.
              </p>
              <a 
                href="mailto:careers@cadly.ai" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Apply Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}