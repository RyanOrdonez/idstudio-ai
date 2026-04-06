'use client'

interface WorkCanvasProps {
  content: any
}

export default function WorkCanvas({ content }: WorkCanvasProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-900">Work Canvas</h3>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 overflow-auto">
        {content ? (
          <div className="space-y-4">
            {content.type === 'document' && (
              <div className="bg-white border border-neutral-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-neutral-900 mb-4">{content.title}</h4>
                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: content.html }} />
                </div>
                <div className="mt-6 flex space-x-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Export PDF
                  </button>
                  <button className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors">
                    Copy to Clipboard
                  </button>
                </div>
              </div>
            )}

            {content.type === 'email' && (
              <div className="bg-white border border-neutral-200 rounded-lg p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">To:</label>
                    <input 
                      type="email" 
                      value={content.to || ''} 
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="recipient@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Subject:</label>
                    <input 
                      type="text" 
                      value={content.subject || ''} 
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Email subject"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Message:</label>
                    <textarea 
                      value={content.body || ''} 
                      rows={8}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Email content"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Copy to Clipboard
                    </button>
                    <button className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors">
                      Save Draft
                    </button>
                  </div>
                </div>
              </div>
            )}

            {content.type === 'mood_board' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-900">{content.title}</h3>
                <p className="text-neutral-600 text-sm">{content.description}</p>
                {content.imageUrl ? (
                  <div className="space-y-3">
                    <img 
                      src={content.imageUrl} 
                      alt="AI Generated Mood Board"
                      className="w-full rounded-lg shadow-sm"
                    />
                    {content.revisedPrompt && (
                      <div className="bg-neutral-50 rounded-lg p-3">
                        <p className="text-xs text-neutral-500 font-medium">DALL-E 3 Prompt:</p>
                        <p className="text-xs text-neutral-600 mt-1">{content.revisedPrompt}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-neutral-100 rounded-lg p-8 text-center">
                    <div className="text-4xl mb-2">🎨</div>
                    <p className="text-neutral-500">Mood board visualization coming soon...</p>
                  </div>
                )}
              </div>
            )}

            {content.type === 'rendering' && (
              <div className="bg-white border border-neutral-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-neutral-900 mb-4">AI Rendering</h4>
                <div className="aspect-video bg-neutral-100 rounded-lg flex items-center justify-center mb-4">
                  {content.imageUrl ? (
                    <img src={content.imageUrl} alt="AI Rendering" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <p className="text-neutral-500">Rendering will appear here</p>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Download
                  </button>
                  <button className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors">
                    Save to Project
                  </button>
                  <button className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors">
                    Generate Variations
                  </button>
                </div>
              </div>
            )}

            {content.type === 'file_viewer' && (
              <div className="bg-white border border-neutral-200 rounded-lg p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-neutral-900">{content.fileName}</h4>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => window.open(content.fileUrl, '_blank')}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
                    >
                      Open in New Tab
                    </button>
                    <button 
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = content.fileUrl
                        link.download = content.fileName
                        link.click()
                      }}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors"
                    >
                      Download
                    </button>
                  </div>
                </div>
                
                <div className="h-[calc(100%-4rem)] border border-neutral-200 rounded-lg overflow-hidden">
                  {content.fileType === 'pdf' ? (
                    <iframe
                      src={`${content.fileUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=100`}
                      className="w-full h-full"
                      title={content.fileName}
                    />
                  ) : content.fileType === 'docx' || content.fileType === 'doc' ? (
                    <iframe
                      src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(content.fileUrl)}`}
                      className="w-full h-full"
                      title={content.fileName}
                    />
                  ) : content.fileType?.startsWith('image/') ? (
                    <img 
                      src={content.fileUrl} 
                      alt={content.fileName}
                      className="w-full h-full object-contain bg-neutral-50"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-neutral-50">
                      <div className="text-center">
                        <div className="text-4xl mb-4">📄</div>
                        <p className="text-neutral-600 mb-4">Preview not available for this file type</p>
                        <button 
                          onClick={() => window.open(content.fileUrl, '_blank')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Open File
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-neutral-900 mb-2">Ready for AI Output</h4>
              <p className="text-neutral-600 max-w-sm">
                Ask the AI assistant to generate documents, emails, mood boards, or renderings. 
                They&apos;ll appear here for editing and export.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
