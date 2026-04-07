import { Link } from 'react-router-dom'

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link to="/" className="text-primary-600 hover:text-primary-700 text-sm">
          ← Back to Home
        </Link>
      </div>

      <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>

      <div className="prose prose-lg max-w-none text-gray-600">
        <p className="text-sm text-gray-500 mb-6">Last updated: March 16, 2026</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing or using PoolRoute OS ("Service"), you agree to be bound by these Terms of Service
            ("Terms"). If you disagree with any part of these terms, you may not access the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
          <p>
            PoolRoute OS provides a platform for pool service professionals to manage routes, track customers,
            and facilitate the buying and selling of pool service routes. The Service includes web-based tools,
            mobile applications, and related support services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
          <p>
            To use certain features of the Service, you must register for an account. You agree to:
          </p>
          <ul className="list-disc ml-6 mt-2">
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain the security of your password and account</li>
            <li>Promptly update your account information</li>
            <li>Accept responsibility for all activities under your account</li>
            <li>Notify us immediately of any unauthorized use</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Marketplace Terms</h2>
          <p>
            When using our marketplace to buy or sell pool routes:
          </p>
          <ul className="list-disc ml-6 mt-2">
            <li>All listings must be accurate and not misleading</li>
            <li>Transactions are between buyers and sellers directly</li>
            <li>We do not guarantee any transaction outcomes</li>
            <li>Users are responsible for due diligence</li>
            <li>A commission may apply to successful transactions</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Privacy and Data Protection</h2>
          <p>
            Your use of our Service is also governed by our Privacy Policy. By using the Service, you consent
            to the collection and use of information as detailed in the Privacy Policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Prohibited Uses</h2>
          <p>You may not use the Service to:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Violate any laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Transmit malware or harmful code</li>
            <li>Engage in fraudulent activities</li>
            <li>Harass or harm other users</li>
            <li>Attempt to gain unauthorized access</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, POOLROUTE OS SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify users of any material
            changes via email or through the Service. Your continued use constitutes acceptance of the
            modified Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contact Information</h2>
          <p>
            For questions about these Terms, please contact us at:
          </p>
          <div className="mt-2">
            <p>PoolRoute OS</p>
            <p>Email: legal@poolroute.com</p>
            <p>Phone: 1-800-POOL-ROUTE</p>
          </div>
        </section>
      </div>
    </div>
  )
}