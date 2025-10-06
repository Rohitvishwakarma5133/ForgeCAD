import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | CADly AI',
  description: 'Terms of service and usage policies for CADly AI platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Terms of Service
              </h1>
              <p className="text-lg text-gray-600">
                Last updated: December 6, 2024
              </p>
            </div>

            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-600 mb-4">
                  By accessing and using CADly AI ("Service"), you accept and agree to be bound by the terms 
                  and provision of this agreement. If you do not agree to abide by the above, please do not 
                  use this service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Use License</h2>
                <p className="text-gray-600 mb-4">
                  Permission is granted to temporarily download one copy of CADly AI per device for personal, 
                  non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4">
                  <li>modify or copy the materials</li>
                  <li>use the materials for any commercial purpose or for any public display (commercial or non-commercial)</li>
                  <li>attempt to decompile or reverse engineer any software contained on the website</li>
                  <li>remove any copyright or other proprietary notations from the materials</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Data Processing</h2>
                <p className="text-gray-600 mb-4">
                  When you upload CAD files to our service:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4">
                  <li>Files are processed using AI and machine learning algorithms</li>
                  <li>Analysis results are stored temporarily for performance optimization</li>
                  <li>We do not claim ownership of your uploaded content</li>
                  <li>Files may be automatically deleted after processing completion</li>
                  <li>We implement industry-standard security measures to protect your data</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use</h2>
                <p className="text-gray-600 mb-4">
                  You agree not to use the service:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4">
                  <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                  <li>To violate any international, federal, provincial or state regulations, rules, laws, or local ordinances</li>
                  <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                  <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                  <li>To submit false or misleading information</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Service Availability</h2>
                <p className="text-gray-600 mb-4">
                  We strive to maintain high service availability but cannot guarantee uninterrupted access. 
                  The service may be temporarily unavailable due to maintenance, updates, or technical issues.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Limitation of Liability</h2>
                <p className="text-gray-600 mb-4">
                  In no event shall CADly AI or its suppliers be liable for any damages (including, without 
                  limitation, damages for loss of data or profit, or due to business interruption) arising 
                  out of the use or inability to use the materials on CADly AI's website.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Accuracy of Materials</h2>
                <p className="text-gray-600 mb-4">
                  The materials appearing on CADly AI's website could include technical, typographical, or 
                  photographic errors. CADly AI does not warrant that any of the materials on its website 
                  are accurate, complete, or current. CADly AI may make changes to the materials contained 
                  on its website at any time without notice.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Modifications</h2>
                <p className="text-gray-600 mb-4">
                  CADly AI may revise these terms of service for its website at any time without notice. 
                  By using this website, you are agreeing to be bound by the then current version of these terms of service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Governing Law</h2>
                <p className="text-gray-600 mb-4">
                  These terms and conditions are governed by and construed in accordance with the laws of 
                  the jurisdiction in which CADly AI operates and you irrevocably submit to the exclusive 
                  jurisdiction of the courts in that state or location.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Information</h2>
                <p className="text-gray-600 mb-4">
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-gray-800 font-medium">Email: legal@cadly.ai</p>
                  <p className="text-gray-800 font-medium">Website: https://cadly.ai/contact</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}