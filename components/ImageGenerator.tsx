'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { GenerationSettings } from './SettingsPanel'

type Section = {
  id: string
  name: string
}

type Prompt = {
  id: string
  prompt_text: string
  negative_prompt: string | null
}

type GlobalReference = {
  id: string
  image_url: string
  model_name: string
  sections?: { name: string; section_code: string }
}

type Props = {
  section: Section
  prompt: Prompt
  settings: GenerationSettings
  onImageGenerated: () => void
  referenceImageUrl?: string | null
  selectedReferenceImageUrl?: string | null
  globalReferences?: GlobalReference[]
  onClearReference?: () => void
  onSelectGlobalReference?: (imageUrl: string) => void
  onRemoveGlobalReference?: (id: string) => void
}

export default function ImageGenerator({
  section,
  prompt,
  settings,
  onImageGenerated,
  referenceImageUrl,
  selectedReferenceImageUrl,
  globalReferences = [],
  onClearReference,
  onSelectGlobalReference,
  onRemoveGlobalReference
}: Props) {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showGlobalRefs, setShowGlobalRefs] = useState(false)

  const isUltra = settings.model === 'flux-pro-1.1-ultra'
  const isKontext = settings.model.includes('kontext')
  const supportsReferenceImage = isUltra || isKontext
  const usesAspectRatio = isUltra || isKontext

  // Determine which reference image to use (prioritize selected over default)
  const activeReferenceImageUrl = selectedReferenceImageUrl || referenceImageUrl

  function handleSelectGlobalReference(imageUrl: string) {
    if (onSelectGlobalReference) {
      onSelectGlobalReference(imageUrl)
    }
    setShowGlobalRefs(false)
  }

  async function handleGenerate() {
    setGenerating(true)
    setError(null)

    try {
      const requestBody: any = {
        sectionId: section.id,
        promptId: prompt.id,
        prompt: prompt.prompt_text,
        model: settings.model,
        provider: 'black-forest-labs',
        prompt_upsampling: settings.promptUpsampling,
        safety_tolerance: settings.safetyTolerance,
        output_format: settings.outputFormat,
      }

      // Add seed if provided
      if (settings.seed.trim()) {
        const seedNum = parseInt(settings.seed.trim())
        if (!isNaN(seedNum)) {
          requestBody.seed = seedNum
        }
      }

      // Ultra and Kontext model parameters
      if (usesAspectRatio) {
        requestBody.aspect_ratio = settings.aspectRatio

        // Ultra-specific features
        if (isUltra) {
          requestBody.raw = settings.raw

          // Add image prompt if reference image exists (Ultra model)
          if (activeReferenceImageUrl) {
            // Fetch and convert reference image to base64
            const imageResponse = await fetch(activeReferenceImageUrl)
            const blob = await imageResponse.blob()
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve(reader.result as string)
              reader.readAsDataURL(blob)
            })
            requestBody.image_prompt = base64.split(',')[1] // Remove data:image/...;base64, prefix
            requestBody.image_prompt_strength = settings.imagePromptStrength
          }
        }

        // Kontext models support input_image
        if (isKontext && activeReferenceImageUrl) {
          // Fetch and convert reference image to base64
          const imageResponse = await fetch(activeReferenceImageUrl)
          const blob = await imageResponse.blob()
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(blob)
          })
          requestBody.input_image = base64.split(',')[1] // Remove data:image/...;base64, prefix
          requestBody.image_prompt_strength = settings.imagePromptStrength
        }
      } else {
        // Non-Ultra models use width/height
        requestBody.width = settings.width
        requestBody.height = settings.height
      }

      // Dev model parameters
      if (settings.model === 'flux-dev') {
        requestBody.steps = settings.steps
        requestBody.guidance = settings.guidance

        // Add LoRA models if configured
        if (settings.loras && settings.loras.length > 0) {
          // Only include LoRAs with non-empty paths
          const validLoras = settings.loras.filter(lora => lora.path.trim() !== '')
          if (validLoras.length > 0) {
            requestBody.loras = validLoras
          }
        }

        // Add image-to-image parameters if reference image provided
        if (settings.referenceImage) {
          requestBody.reference_image_url = settings.referenceImage
          requestBody.img2img_strength = settings.img2imgStrength
        }
      }

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image')
      }

      // Small delay to ensure database has fully committed the insert
      await new Promise(resolve => setTimeout(resolve, 500))

      await onImageGenerated()
    } catch (err) {
      console.error('Generation error:', err)
      const message = err instanceof Error ? err.message : 'Failed to generate image'
      setError(message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Global References Selector */}
      {globalReferences.length > 0 && supportsReferenceImage && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <button
            onClick={() => setShowGlobalRefs(!showGlobalRefs)}
            type="button"
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-300 hover:text-white transition-colors"
          >
            <span>📌 Pinned Global References ({globalReferences.length})</span>
            <span>{showGlobalRefs ? '▼' : '▶'}</span>
          </button>
          {showGlobalRefs && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              {globalReferences.map((ref) => (
                <div
                  key={ref.id}
                  className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden border-2 border-purple-600 hover:border-purple-400 transition-colors group"
                >
                  <button
                    onClick={() => handleSelectGlobalReference(ref.image_url)}
                    type="button"
                    className="absolute inset-0 w-full h-full"
                  >
                    <Image
                      src={ref.image_url}
                      alt={`Global reference from ${ref.sections?.name || 'unknown'}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-xs font-medium">{ref.sections?.name || 'Unknown Section'}</div>
                        <div className="text-xs mt-1">{ref.model_name}</div>
                      </div>
                    </div>
                  </button>
                  {onRemoveGlobalReference && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Remove this global reference image?')) {
                          onRemoveGlobalReference(ref.id)
                        }
                      }}
                      type="button"
                      className="absolute top-2 right-2 z-10 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reference Image Preview (for Ultra and Kontext) */}
      {supportsReferenceImage && activeReferenceImageUrl && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-gray-300">
              {selectedReferenceImageUrl ? '🎨 Selected Reference Image' : 'Reference Image'} ({isUltra ? 'img2img' : 'input image'})
            </div>
            {onClearReference && (
              <button
                onClick={onClearReference}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                disabled={generating}
              >
                {selectedReferenceImageUrl ? 'Clear Reference' : 'Remove Reference'}
              </button>
            )}
          </div>
          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <Image src={activeReferenceImageUrl} alt={`${section.name} reference`} fill className="object-cover" />
          </div>
          {selectedReferenceImageUrl && (
            <p className="mt-2 text-xs text-blue-400">
              💡 This image will be used as the starting point. Adjust your prompt to describe modifications.
            </p>
          )}
          <p className="mt-2 text-xs text-gray-400">
            Adjust reference influence in Generation Settings →
          </p>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors"
      >
        {generating ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating...
          </span>
        ) : (
          '✨ Generate New Image with AI'
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">
          <p className="font-medium">Error:</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Tips */}
      <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400">
        <p className="font-medium text-gray-300 mb-1">💡 Tips:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Adjust all settings in the right panel →</li>
          <li>Upload custom images in "Current Section Image" above</li>
          <li>Current section image automatically used as reference</li>
        </ul>
      </div>
    </div>
  )
}
