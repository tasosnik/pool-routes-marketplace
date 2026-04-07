import { Link } from 'react-router-dom'

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link to="/" className="text-primary-600 hover:text-primary-700 text-sm">
          ← Back to Home
        </Link>
      </div>

      <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

      <div className="prose prose-lg max-w-none text-gray-600">
        <p className="text-sm text-gray-500 mb-6">Last updated: March 16, 2026</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
          <p>We collect information you provide directly to us, including:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Account information (name, email, phone, company)</li>
            <li>Route and customer data you enter</li>
            <li>Transaction and payment information</li>
            <li>Communications with us</li>
            <li>Usage data and analytics</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Analyze usage patterns and trends</li>
            <li>Detect and prevent fraudulent activity</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Information Sharing</h2>
          <p>
            We do not sell, trade, or rent your personal information. We may share information:
          </p>
          <ul className="list-disc ml-6 mt-2">
            <li>With your consent or at your direction</li>
            <li>With service providers who assist our operations</li>
            <li>To comply with legal obligations</li>
            <li>To protect rights, property, and safety</li>
            <li>In connection with a business transaction</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal
            information against unauthorized access, alteration, disclosure, or destruction. These include:
          </p>
          <ul className="list-disc ml-6 mt-2">
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security assessments</li>
            <li>Access controls and authentication</li>
            <li>Employee training on data protection</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Your Rights and Choices</h2>
          <p>You have the right to:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Access and update your information</li>
            <li>Request deletion of your account</li>
            <li>Opt out of marketing communications</li>
            <li>Request a copy of your data</li>
            <li>Object to certain processing</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookies and Tracking</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our Service and hold
            certain information. You can instruct your browser to refuse all cookies or indicate when
            a cookie is being sent.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Children's Privacy</h2>
          <p>
            Our Service is not intended for individuals under the age of 18. We do not knowingly collect
            personal information from children under 18. If you become aware that a child has provided us
            with personal information, please contact us.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your own. We ensure
            appropriate safeguards are in place for such transfers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by
            posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, contact us at:</p>
          <div className="mt-2">
            <p>PoolRoute OS Privacy Team</p>
            <p>Email: privacy@poolroute.com</p>
            <p>Phone: 1-800-POOL-ROUTE</p>
            <p>Address: 123 Pool Street, Los Angeles, CA 90001</p>
          </div>
        </section>
      </div>
    </div>
  )
}