import { useState, useRef } from 'react'
import { CloudArrowUpIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import ManualEntryModal from '../../components/Import/ManualEntryModal'
import { useCSVUpload, useDownloadTemplate } from '../../hooks/useImport'
import { DuplicateStrategy } from '../../services/importService'

export default function ImportPage() {
  const [showManualEntry, setShowManualEntry] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // React Query hooks
  const { uploadCSV, isUploading } = useCSVUpload()
  const downloadTemplate = useDownloadTemplate()

  const handleCSVUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    try {
      // Use React Query hook for upload workflow
      await uploadCSV.mutateAsync({
        file,
        options: {
          duplicateStrategy: DuplicateStrategy.SKIP
        }
      })

      // Clear the input for future uploads
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('Import error:', error)
      // Error handling is done in the hook
    }
  }

  const handleManualEntry = () => {
    setShowManualEntry(true)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Import Routes</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CSV Upload Card */}
        <div className="card">
          <div className="card-body">
            <div className="text-center py-8">
              <CloudArrowUpIcon className="h-12 w-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Upload CSV File
              </h3>
              <p className="text-gray-600 mb-6">
                Import multiple routes at once from a CSV file
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                aria-label="CSV file input"
              />

              <button
                onClick={handleCSVUpload}
                disabled={isUploading}
                className="btn btn-primary"
                aria-label={isUploading ? "Processing CSV file" : "Select CSV file to upload"}
              >
                {isUploading ? 'Processing...' : 'Select CSV File'}
              </button>

              <div className="mt-4 text-sm text-gray-500">
                <p>Supported format: CSV</p>
                <p>Max file size: 10MB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Entry Card */}
        <div className="card">
          <div className="card-body">
            <div className="text-center py-8">
              <PencilSquareIcon className="h-12 w-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Manual Entry
              </h3>
              <p className="text-gray-600 mb-6">
                Enter route information manually one at a time
              </p>

              <button
                onClick={handleManualEntry}
                className="btn btn-primary"
                aria-label="Open manual entry form"
              >
                Enter Manually
              </button>

              <div className="mt-4 text-sm text-gray-500">
                <p>Add routes individually</p>
                <p>Perfect for small datasets</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSV Format Guide */}
      <div className="card mt-6">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">CSV Format Guide</h2>
        </div>
        <div className="card-body">
          <p className="text-gray-600 mb-4">
            Your CSV file should include the following columns:
          </p>
          <div className="bg-gray-50 p-4 rounded-md">
            <code className="text-sm">
              Route Name, Customer Name, Address, City, State, ZIP, Service Rate, Service Frequency
            </code>
          </div>
          <div className="mt-4">
            <a
              href="#"
              onClick={async (e) => {
                e.preventDefault()
                await downloadTemplate.mutateAsync('basic-route.csv')
              }}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Download Sample Template
            </a>
          </div>
        </div>
      </div>

      {showManualEntry && (
        <ManualEntryModal
          isOpen={showManualEntry}
          onClose={() => setShowManualEntry(false)}
        />
      )}
    </div>
  )
}