import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | CADly AI',
  description: 'Privacy policy and data protection information for CADly AI platform.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Privacy Policy
              </h1>
              <p className="text-lg text-gray-600">
                Last updated: December 6, 2024
              </p>
            </div>

            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
                <p className="text-gray-600 mb-4">
                  We collect information you provide directly to us, such as when you create an account, 
                  upload CAD files, or contact us for support.
                </p>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Personal Information</h3>
                <ul className="list-disc pl-6 text-gray-600 mb-4">
                  <li>Name and email address</li>
                  <li>Company or organization information</li>
                  <li>Contact preferences</li>
                  <li>Account credentials</li>
                </ul>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Technical Data</h3>
                <ul className="list-disc pl-6 text-gray-600 mb-4">
                  <li>CAD files and related technical drawings</li>
                  <li>Analysis results and processing data</li>
                  <li>Usage statistics and performance metrics</li>
                  <li>Device information and browser type</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
                <p className="text-gray-600 mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4">
                  <li>Provide and improve our CAD analysis services</li>
                  <li>Process and analyze your uploaded files</li>
                  <li>Communicate with you about your account and our services</li>
                  <li>Ensure the security and integrity of our platform</li>
                  <li>Comply with legal obligations and resolve disputes</li>
                  <li>Develop new features and improve existing functionality</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. AI Processing and Data Security</h2>
                <p className="text-gray-600 mb-4">
                  Your CAD files are processed using advanced AI and machine learning algorithms:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4">
                  <li>Files are processed securely using industry-standard encryption</li>
                  <li>AI analysis is performed on secure, isolated computing environments</li>
                  <li>Processing results are temporarily stored for performance optimization</li>
                  <li>Files and analysis data are automatically purged after processing completion</li>
                  <li>We do not use your files to train our AI models without explicit consent</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing</h2>
                <p className="text-gray-600 mb-4">
                  We do not sell, trade, or rent your personal information to third parties. We may share 
                  your information only in the following circumstances:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4">
                  <li><strong>Service Providers:</strong> With trusted third-party service providers who assist in operating our platform</li>
                  <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
                  <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                  <li><strong>Consent:</strong> When you explicitly consent to sharing your information</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Third-Party AI Services</h2>
                <p className="text-gray-600 mb-4">
                  Our platform integrates with third-party AI services for enhanced analysis capabilities:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4">
                  <li><strong>OpenAI:</strong> For advanced text analysis and technical interpretation</li>
                  <li><strong>Anthropic (Claude):</strong> For validation and quality assurance</li>
                  <li><strong>Google Cloud Vision:</strong> For optical character recognition and symbol detection</li>
                </ul>
                <p className="text-gray-600 mb-4">
                  These services are subject to their respective privacy policies and terms of service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
                <p className="text-gray-600 mb-4">
                  We retain your information for as long as necessary to provide our services:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4">
                  <li>Account information is retained until account deletion</li>
                  <li>Uploaded files are typically deleted within 24-48 hours after processing</li>
                  <li>Analysis results may be retained for up to 30 days for support purposes</li>
                  <li>Aggregated, anonymized usage statistics may be retained indefinitely</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights and Choices</h2>
                <p className="text-gray-600 mb-4">
                  You have the following rights regarding your personal information:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4">
                  <li><strong>Access:</strong> Request access to your personal information</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                  <li><strong>Opt-out:</strong> Opt out of marketing communications</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Security Measures</h2>
                <p className="text-gray-600 mb-4">
                  We implement appropriate technical and organizational measures to protect your information:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4">
                  <li>Encryption in transit and at rest</li>
                  <li>Regular security audits and assessments</li>
                  <li>Access controls and authentication requirements</li>
                  <li>Secure cloud infrastructure with industry-standard compliance</li>
                  <li>Employee training on data protection best practices</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Data Transfers</h2>
                <p className="text-gray-600 mb-4">
                  Your information may be transferred to and processed in countries other than your own. 
                  We ensure appropriate safeguards are in place to protect your information during such transfers.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
                <p className="text-gray-600 mb-4">
                  We may update this privacy policy from time to time. We will notify you of any material 
                  changes by posting the new policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
                <p className="text-gray-600 mb-4">
                  If you have any questions about this privacy policy or our data practices, please contact us:
                </p>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-gray-800 font-medium">Email: privacy@cadly.ai</p>
                  <p className="text-gray-800 font-medium">Website: https://cadly.ai/contact</p>
                  <p className="text-gray-800 font-medium">Data Protection Officer: dpo@cadly.ai</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}