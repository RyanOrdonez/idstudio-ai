'use client'

import { useState } from 'react'

interface DocumentGeneratorProps {
  onDocumentGenerated: (document: any) => void
}

interface ProjectData {
  projectName: string
  address: string
  budget: number | null
  description: string
  timeline: string
}

interface ClientData {
  name: string
  email: string
  phone: string
  address: string
}

export default function DocumentGenerator({ onDocumentGenerated }: DocumentGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [documentType, setDocumentType] = useState<'proposal' | 'contract' | 'invoice'>('proposal')
  const [projectData, setProjectData] = useState<ProjectData>({
    projectName: '',
    address: '',
    budget: null,
    description: '',
    timeline: ''
  })
  const [clientData, setClientData] = useState<ClientData>({
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [additionalInfo, setAdditionalInfo] = useState('')

  const handleGenerateDocument = async () => {
    if (!projectData.projectName || !clientData.name) {
      alert('Please fill in at least the project name and client name')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentType,
          projectData,
          clientData,
          additionalInfo
        })
      })

      const result = await response.json()

      if (result.success) {
        onDocumentGenerated(result)
      } else {
        alert('Failed to generate document: ' + result.error)
      }
    } catch (error) {
      console.error('Document generation error:', error)
      alert('Failed to generate document. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Generate Document</h3>
      
      {/* Document Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Document Type
        </label>
        <div className="flex space-x-4">
          {[
            { value: 'proposal', label: 'Design Proposal' },
            { value: 'contract', label: 'Service Contract' },
            { value: 'invoice', label: 'Invoice' }
          ].map((type) => (
            <label key={type.value} className="flex items-center">
              <input
                type="radio"
                name="documentType"
                value={type.value}
                checked={documentType === type.value}
                onChange={(e) => setDocumentType(e.target.value as any)}
                className="mr-2"
              />
              <span className="text-sm text-neutral-700">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Project Information */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-neutral-900 mb-3">Project Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              value={projectData.projectName}
              onChange={(e) => setProjectData({...projectData, projectName: e.target.value})}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Modern Living Room Redesign"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Project Address
            </label>
            <input
              type="text"
              value={projectData.address}
              onChange={(e) => setProjectData({...projectData, address: e.target.value})}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="123 Main St, City, State"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Budget
            </label>
            <input
              type="number"
              value={projectData.budget || ''}
              onChange={(e) => setProjectData({...projectData, budget: e.target.value ? Number(e.target.value) : null})}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="50000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Timeline
            </label>
            <input
              type="text"
              value={projectData.timeline}
              onChange={(e) => setProjectData({...projectData, timeline: e.target.value})}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="8-12 weeks"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Project Description
            </label>
            <textarea
              value={projectData.description}
              onChange={(e) => setProjectData({...projectData, description: e.target.value})}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Complete living room renovation with modern aesthetic..."
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-neutral-900 mb-3">Client Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Client Name *
            </label>
            <input
              type="text"
              value={clientData.name}
              onChange={(e) => setClientData({...clientData, name: e.target.value})}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="John Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={clientData.email}
              onChange={(e) => setClientData({...clientData, email: e.target.value})}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={clientData.phone}
              onChange={(e) => setClientData({...clientData, phone: e.target.value})}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Client Address
            </label>
            <input
              type="text"
              value={clientData.address}
              onChange={(e) => setClientData({...clientData, address: e.target.value})}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="456 Oak Ave, City, State"
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Additional Information
        </label>
        <textarea
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Any special requirements, terms, or notes..."
          rows={3}
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateDocument}
        disabled={isGenerating || !projectData.projectName || !clientData.name}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isGenerating ? 'Generating Document...' : `Generate ${documentType.charAt(0).toUpperCase() + documentType.slice(1)}`}
      </button>
    </div>
  )
}
