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
}

type ApprovedImage = {
  id: string
  image_url: string
  model_name: string
  created_at: string
}

export default function SectionImageManager({
  section,
  onPrimaryImageChange,
  onGlobalReferenceAdded,
}: Props) {
  const [approvedImages, setApprovedImages] = useState<ApprovedImage[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadApprovedImages()
  }, [section.id])

  async function loadApprovedImages() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('generated_images')
        .select('id, image_url, model_name, created_at')
        .eq('section_id', section.id)
        .eq('status', 'approved')
        .order('approved_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setApprovedImages(data || [])
    } catch (error) {
      console.error('Error loading approved images:', error)
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      <h3 className="text-lg font-semibold mb-4">Primary Image Manager</h3>

      {/* Current Primary Image */}
      <div className="mb-6">
        <div className="text-sm font-medium text-gray-300 mb-2">
          Current Primary Image
        </div>
        <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
          {section.current_image_url ? (
            <>
              <Image
                src={section.current_image_url}
                alt={`Primary ${section.name}`}
                fill
                className="object-cover"
              />
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
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              No primary image set
            </div>
          )}
        </div>
      </div>

      {/* Upload New Image */}
      <div className="mb-6">
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
              file:bg-green-600 file:text-white
              hover:file:bg-green-700
              file:cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </label>
        {uploading && (
          <p className="text-sm text-gray-400 mt-2">Uploading...</p>
        )}
      </div>

      {/* Previously Approved Images */}
      <div>
        <div className="text-sm font-medium text-gray-300 mb-2">
          Previously Approved Images
        </div>
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : approvedImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {approvedImages.map((image) => (
              <button
                key={image.id}
                onClick={() => handleSetPrimaryImage(image.image_url)}
                disabled={section.current_image_url === image.image_url}
                className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                  section.current_image_url === image.image_url
                    ? 'border-green-500 opacity-50 cursor-default'
                    : 'border-gray-700 hover:border-green-500 cursor-pointer'
                }`}
              >
                <Image
                  src={image.image_url}
                  alt={`Approved ${section.name}`}
                  fill
                  className="object-cover"
                />
                {section.current_image_url === image.image_url && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <span className="text-green-400 font-medium">Current</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            No approved images yet. Generate and approve images to see them here.
          </p>
        )}
      </div>
    </div>
  )
}
