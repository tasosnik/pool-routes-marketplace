import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EnvelopeIcon, PhoneIcon, ChatBubbleBottomCenterTextIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast('Thank you for your message. Support ticket submission is coming soon. For urgent issues, email support@poolroute.com')
    setFormData({ name: '', email: '', subject: '', message: '' })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link to="/" className="text-primary-600 hover:text-primary-700 text-sm">
          ← Back to Home
        </Link>
      </div>

      <h1 className="text-4xl font-bold text-gray-900 mb-8">Support Center</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Options */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Us</h2>

          <div className="space-y-4">
            <div className="card">
              <div className="card-body">
                <EnvelopeIcon className="h-8 w-8 text-primary-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Email Support</h3>
                <p className="text-sm text-gray-600 mb-2">Get help via email</p>
                <a href="mailto:support@poolroute.com" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  support@poolroute.com
                </a>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <PhoneIcon className="h-8 w-8 text-primary-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Phone Support</h3>
                <p className="text-sm text-gray-600 mb-2">Mon-Fri, 9am-5pm PST</p>
                <a href="tel:1-800-765-7688" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  1-800-POOL-ROU
                </a>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <ChatBubbleBottomCenterTextIcon className="h-8 w-8 text-primary-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Live Chat</h3>
                <p className="text-sm text-gray-600 mb-2">Chat with our team</p>
                <button
                  onClick={() => toast('Live chat will be available soon')}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Start Chat
                </button>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Links</h2>
            <div className="space-y-2">
              <button
                onClick={() => toast('Documentation coming soon')}
                className="flex items-center text-primary-600 hover:text-primary-700 text-sm"
              >
                <QuestionMarkCircleIcon className="h-4 w-4 mr-2" />
                Documentation
              </button>
              <button
                onClick={() => toast('Video tutorials coming soon')}
                className="flex items-center text-primary-600 hover:text-primary-700 text-sm"
              >
                <QuestionMarkCircleIcon className="h-4 w-4 mr-2" />
                Video Tutorials
              </button>
              <button
                onClick={() => toast('FAQ section coming soon')}
                className="flex items-center text-primary-600 hover:text-primary-700 text-sm"
              >
                <QuestionMarkCircleIcon className="h-4 w-4 mr-2" />
                Frequently Asked Questions
              </button>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Submit a Support Ticket</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select a topic</option>
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing Question</option>
                    <option value="account">Account Help</option>
                    <option value="marketplace">Marketplace Support</option>
                    <option value="feature">Feature Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Please describe your issue or question in detail..."
                  />
                </div>

                <div className="flex justify-end">
                  <button type="submit" className="btn btn-primary">
                    Submit Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Response Time Notice */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Response Times:</strong> We typically respond to support tickets within 24 hours during
              business days. For urgent issues, please call our support line.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}