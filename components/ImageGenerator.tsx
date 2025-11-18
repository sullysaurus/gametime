'use client'

import { useState } from 'react'

type Section = {
  id: string
  name: string
}

type Prompt = {
  id: string
  prompt_text: string
  negative_prompt: string | null
}

type Props = {
  section: Section
  prompt: Prompt
  onImageGenerated: () => void
}

const MODELS = [
  { id: 'dall-e-3', name: 'DALL-E 3', provider: 'openai' },
  // Add more models here as you integrate them
  // { id: 'stable-diffusion-xl', name: 'Stable Diffusion XL', provider: 'replicate' },
]

export default function ImageGenerator({ section, prompt, onImageGenerated }: Props) {
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionId: section.id,
          promptId: prompt.id,
          prompt: prompt.prompt_text,
          negativePrompt: prompt.negative_prompt,
          model: selectedModel,
          size: '1792x1024', // DALL-E 3 size closest to 1920x1080
          quality: 'hd',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image')
      }

      onImageGenerated()
    } catch (err: any) {
      console.error('Generation error:', err)
      setError(err.message || 'Failed to generate image')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      <h2 className="text-xl font-semibold mb-4">Generate New Image</h2>

      <div className="space-y-4">
        {/* Model Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white"
            disabled={generating}
          >
            {MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.provider})
              </option>
            ))}
          </select>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium text-lg transition-colors"
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
            'Generate Image'
          )}
        </button>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">
            <p className="font-medium">Error:</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-400">
          <p>
            This will generate a new image using the current active prompt and the
            selected model. The image will appear below for review.
          </p>
        </div>
      </div>
    </div>
  )
}
