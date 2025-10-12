import { Metadata } from 'next';
import { Shield, Lock, Eye, Server, FileCheck, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Security | CADly AI',
  description: 'Learn about our security measures and data protection practices.',
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Security & Data Protection
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Your data security is our top priority. Learn about the comprehensive measures 
              we've implemented to protect your CAD files and sensitive information.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">End-to-End Encryption</h3>
              <p className="text-gray-600">
                All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption standards.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">SOC 2 Compliant</h3>
              <p className="text-gray-600">
                Our infrastructure meets SOC 2 Type II compliance standards for security and availability.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Eye className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Zero Trust Architecture</h3>
              <p className="text-gray-600">
                Every access request is verified and authenticated before granting system access.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Server className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Secure Infrastructure</h3>
              <p className="text-gray-600">
                Hosted on enterprise-grade cloud infrastructure with 99.9% uptime SLA and automated backups.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileCheck className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Minimization</h3>
              <p className="text-gray-600">
                We only collect and retain data necessary for service delivery and automatically purge files after processing.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Access Controls</h3>
              <p className="text-gray-600">
                Multi-factor authentication, role-based permissions, and regular access reviews for all team members.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Data Processing Security</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">File Upload Security</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Virus scanning and malware detection</li>
                  <li>• File type validation and size limits</li>
                  <li>• Secure temporary storage with auto-expiration</li>
                  <li>• Encrypted transfer protocols</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Processing Security</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Isolated processing environments</li>
                  <li>• No data retention by AI providers</li>
                  <li>• Secure API communications</li>
                  <li>• Processing audit logs</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Compliance & Certifications</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900">GDPR Compliant</h4>
                <p className="text-sm text-gray-600 mt-2">Full compliance with European data protection regulations</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileCheck className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900">ISO 27001</h4>
                <p className="text-sm text-gray-600 mt-2">Information security management system certification</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900">CCPA Compliant</h4>
                <p className="text-sm text-gray-600 mt-2">California Consumer Privacy Act compliance</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Incident Response</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-red-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">24/7 Monitoring</h4>
                  <p className="text-gray-600">Continuous security monitoring with automated threat detection and alerting</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-orange-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Rapid Response</h4>
                  <p className="text-gray-600">Dedicated incident response team with 1-hour initial response time</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-green-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Transparent Communication</h4>
                  <p className="text-gray-600">Clear communication with affected users and regulatory compliance reporting</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Questions About Our Security?
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Our security team is here to address any concerns or questions you may have 
                about our data protection practices.
              </p>
              <div className="space-y-3">
                <p className="text-gray-800">
                  <strong>Security Team:</strong> security@cadly.ai
                </p>
                <p className="text-gray-800">
                  <strong>Bug Bounty Program:</strong> security@cadly.ai
                </p>
                <p className="text-gray-800">
                  <strong>Compliance Officer:</strong> compliance@cadly.ai
                </p>
              </div>
              <div className="mt-6">
                <a 
                  href="/contact" 
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Contact Security Team
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}