'use client'

import { useState } from 'react'
import Image from 'next/image'

type Section = {
  id: string
  name: string
  current_image_url: string | null
}

type GeneratedImage = {
  id: string
  image_url: string
  model_name: string
  model_provider: string
  generation_settings: any
  created_at: string
  is_global_reference: boolean
}

type Props = {
  section: Section
  generatedImage: GeneratedImage
  onStatusChange: () => void
  onUseAsReference?: (imageUrl: string) => void
}

export default function ImageComparison({
  section,
  generatedImage,
  onStatusChange,
  onUseAsReference,
}: Props) {
  const [notes, setNotes] = useState('')
  const [updating, setUpdating] = useState(false)
  const [isGlobalRef, setIsGlobalRef] = useState(generatedImage.is_global_reference)

  async function handleStatusUpdate(status: 'approved' | 'rejected') {
    setUpdating(true)
    try {
      const response = await fetch(
        `/api/images/${generatedImage.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status,
            notes,
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update status')
      }

      onStatusChange()
    } catch (error: any) {
      console.error('Status update error:', error)
      alert(error.message || 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  async function handleToggleGlobalReference() {
    const newValue = !isGlobalRef
    setUpdating(true)
    try {
      const response = await fetch(
        `/api/images/${generatedImage.id}/global-reference`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_global_reference: newValue,
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update global reference')
      }

      setIsGlobalRef(newValue)
    } catch (error: any) {
      console.error('Global reference update error:', error)
      alert(error.message || 'Failed to update global reference')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{section.name}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="px-2 py-1 bg-gray-800 rounded">
              {generatedImage.model_name}
            </span>
            <span className="px-2 py-1 bg-gray-800 rounded">
              {generatedImage.model_provider}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Generated {new Date(generatedImage.created_at).toLocaleString()}
        </p>
      </div>

      {/* Image Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Current Image */}
        <div>
          <div className="text-sm font-medium text-gray-300 mb-2">
            Current Image
          </div>
          <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            {section.current_image_url ? (
              <Image
                src={section.current_image_url}
                alt={`Current ${section.name}`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                No current image
              </div>
            )}
          </div>
        </div>

        {/* New Generated Image */}
        <div>
          <div className="text-sm font-medium text-green-400 mb-2">
            New Generated Image
          </div>
          <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden border-2 border-green-600">
            <Image
              src={generatedImage.image_url}
              alt={`Generated ${section.name}`}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Comparison Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm min-h-[80px]"
          placeholder="Add notes about why you approved or rejected this image..."
          disabled={updating}
        />
      </div>

      {/* Generation Settings */}
      {generatedImage.generation_settings && (
        <details className="mb-4">
          <summary className="text-sm font-medium text-gray-400 cursor-pointer hover:text-gray-300">
            View Generation Settings
          </summary>
          <div className="mt-2 bg-gray-800 rounded-lg p-3">
            <pre className="text-xs text-gray-400 whitespace-pre-wrap">
              {JSON.stringify(generatedImage.generation_settings, null, 2)}
            </pre>
          </div>
        </details>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="flex gap-3">
          {onUseAsReference && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onUseAsReference(generatedImage.image_url)
              }}
              disabled={updating}
              type="button"
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              🎨 Use as Reference
            </button>
          )}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleToggleGlobalReference()
            }}
            disabled={updating}
            type="button"
            className={`flex-1 px-6 py-3 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors ${
              isGlobalRef
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isGlobalRef ? '📌 Pinned Globally' : '📌 Pin Globally'}
          </button>
        </div>
        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleStatusUpdate('approved')
            }}
            disabled={updating}
            type="button"
            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {updating ? 'Updating...' : '✓ Approve & Set as Current'}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleStatusUpdate('rejected')
            }}
            disabled={updating}
            type="button"
            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {updating ? 'Updating...' : '✗ Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}
