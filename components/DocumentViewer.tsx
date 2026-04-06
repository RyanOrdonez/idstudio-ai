'use client'

import { useState } from 'react'

interface DocumentViewerProps {
  document: {
    documentType: string
    content: string
    generatedAt: string
  } | null
}

export default function DocumentViewer({ document }: DocumentViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!document) {
    return (
      <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-8 text-center">
        <div className="w-16 h-16 bg-neutral-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-neutral-900 mb-2">No Document Generated</h3>
        <p className="text-neutral-600">Use the document generator to create proposals, contracts, or invoices.</p>
      </div>
    )
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(document.content)
    alert('Document content copied to clipboard!')
  }

  const handleDownload = () => {
    const blob = new Blob([document.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = `${document.documentType}-${new Date().toISOString().split('T')[0]}.txt`
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getDocumentIcon = () => {
    switch (document.documentType) {
      case 'proposal':
        return (
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'contract':
        return (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'invoice':
        return (
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        )
      default:
        return (
          <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
    }
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getDocumentIcon()}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 capitalize">
                {document.documentType}
              </h3>
              <p className="text-sm text-neutral-600">
                Generated on {new Date(document.generatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyToClipboard}
              className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Copy to clipboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Download document"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              <svg className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`transition-all duration-300 ${isExpanded ? 'max-h-none' : 'max-h-96 overflow-hidden'}`}>
        <div className="p-6">
          <div className="prose prose-neutral max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-neutral-700 font-sans leading-relaxed">
              {document.content}
            </pre>
          </div>
        </div>
      </div>

      {/* Expand/Collapse Footer */}
      {!isExpanded && (
        <div className="bg-gradient-to-t from-white to-transparent absolute bottom-0 left-0 right-0 h-16 flex items-end justify-center pb-4">
          <button
            onClick={() => setIsExpanded(true)}
            className="bg-white border border-neutral-200 text-neutral-600 px-4 py-2 rounded-lg text-sm hover:bg-neutral-50 transition-colors shadow-sm"
          >
            Show Full Document
          </button>
        </div>
      )}
    </div>
  )
}
