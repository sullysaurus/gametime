'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

type Section = {
  id: string
  name: string
  section_code: string
  current_image_url: string | null
}

type Props = {
  section: Section
  onPrimaryImageChange: (newUrl: string | null) => void
  onGlobalReferenceAdded?: () => void
  localFallbackUrl?: string | null
}

export default function SectionImageManager({
  section,
  onPrimaryImageChange,
  onGlobalReferenceAdded,
  localFallbackUrl,
}: Props) {
  const [uploading, setUploading] = useState(false)

  async function handleSetPrimaryImage(imageUrl: string) {
    try {
      const { error } = await (supabase as any)
        .from('sections')
        .update({ current_image_url: imageUrl })
        .eq('id', section.id)

      if (error) throw error
      onPrimaryImageChange(imageUrl)
    } catch (error) {
      console.error('Error setting primary image:', error)
      alert('Failed to set primary image')
    }
  }

  async function handleRemovePrimaryImage() {
    if (!confirm('Remove the current primary image?')) return

    try {
      const { error } = await (supabase as any)
        .from('sections')
        .update({ current_image_url: null })
        .eq('id', section.id)

      if (error) throw error
      onPrimaryImageChange(null)
    } catch (error) {
      console.error('Error removing primary image:', error)
      alert('Failed to remove primary image')
    }
  }

  async function handlePinAsGlobalReference() {
    if (!section.current_image_url) {
      alert('No primary image to pin')
      return
    }

    if (!confirm('Pin this image as a global reference? It will be available across all sections.')) {
      return
    }

    try {
      // Import this image into generated_images table with global reference flag
      const { error } = await (supabase as any)
        .from('generated_images')
        .insert({
          section_id: section.id,
          prompt_id: null,
          image_url: section.current_image_url,
          model_name: 'uploaded',
          model_provider: 'manual',
          status: 'approved',
          is_global_reference: true,
          generation_settings: {
            note: 'Imported from primary image',
            section: section.name,
            section_code: section.section_code,
          },
        })

      if (error) throw error

      alert('Image pinned as global reference! You can now use it across all sections.')

      // Refresh global references in parent component
      if (onGlobalReferenceAdded) {
        onGlobalReferenceAdded()
      }
    } catch (error) {
      console.error('Error pinning as global reference:', error)
      alert('Failed to pin as global reference')
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB')
      return
    }

    setUploading(true)
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Set as primary image
      await handleSetPrimaryImage(base64)
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
      e.target.value = '' // Reset file input
    }
  }

  // Determine which image to display
  const displayImageUrl = section.current_image_url || localFallbackUrl
  const isCustomImage = !!section.current_image_url
  const hasLocalFallback = !section.current_image_url && !!localFallbackUrl

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      <h3 className="text-lg font-semibold mb-4">📸 Current Section Image</h3>

      {/* Current Primary Image */}
      <div className="mb-6">
        <div className="text-sm font-medium text-gray-300 mb-2">
          Current Primary Image
          {hasLocalFallback && (
            <span className="ml-2 text-xs text-yellow-400">(Local Fallback - Upload to customize)</span>
          )}
        </div>
        <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
          {displayImageUrl ? (
            <>
              <Image
                src={displayImageUrl}
                alt={`Primary ${section.name}`}
                fill
                className="object-cover"
              />
              {isCustomImage && (
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={handlePinAsGlobalReference}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium transition-colors"
                  >
                    📌 Pin Globally
                  </button>
                  <button
                    onClick={handleRemovePrimaryImage}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              No primary image set
            </div>
          )}
        </div>
      </div>

      {/* Upload New Image */}
      <div>
        <div className="text-sm font-medium text-gray-300 mb-2">
          Upload New Image
        </div>
        <label className="block">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="block w-full text-sm text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-medium
              file:bg-blue-600 file:text-white
              hover:file:bg-blue-700
              file:cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </label>
        {uploading && (
          <p className="text-sm text-gray-400 mt-2">Uploading...</p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Upload a custom image to use as the primary image for this section
        </p>
      </div>
    </div>
  )
}
