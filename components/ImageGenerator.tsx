'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

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
  onImageGenerated: () => void
  referenceImageUrl?: string | null
  selectedReferenceImageUrl?: string | null
  globalReferences?: GlobalReference[]
  onClearReference?: () => void
  onSelectGlobalReference?: (imageUrl: string) => void
}

type FluxModel = 'flux-pro-1.1-ultra' | 'flux-pro-1.1' | 'flux-pro' | 'flux-dev' | 'flux-kontext-max' | 'flux-kontext-pro' | 'flux-kontext-dev'

const FLUX_MODELS: { id: FluxModel; name: string; description: string }[] = [
  {
    id: 'flux-kontext-max',
    name: 'FLUX.1 Kontext [max]',
    description: 'Maximum quality with advanced text-to-image and editing capabilities',
  },
  {
    id: 'flux-kontext-pro',
    name: 'FLUX.1 Kontext [pro]',
    description: 'Professional quality with advanced text-to-image generation',
  },
  {
    id: 'flux-kontext-dev',
    name: 'FLUX.1 Kontext [dev]',
    description: 'Development model with advanced features and configurability',
  },
  {
    id: 'flux-pro-1.1-ultra',
    name: 'FLUX 1.1 Pro Ultra',
    description: 'Up to 4MP resolution, raw mode for authentic photography feel',
  },
  {
    id: 'flux-pro-1.1',
    name: 'FLUX 1.1 Pro',
    description: 'High-quality text-to-image generation with excellent prompt adherence',
  },
  {
    id: 'flux-pro',
    name: 'FLUX Pro',
    description: 'Original pro model with great quality and speed',
  },
  {
    id: 'flux-dev',
    name: 'FLUX Dev',
    description: 'Development model with configurable steps and guidance',
  },
]

const ASPECT_RATIOS = [
  '1:1',
  '16:9',
  '21:9',
  '4:3',
  '3:2',
  '9:16',
  '9:21',
  '3:4',
  '2:3',
]

export default function ImageGenerator({ section, prompt, onImageGenerated, referenceImageUrl, selectedReferenceImageUrl, globalReferences = [], onClearReference, onSelectGlobalReference }: Props) {
  const [selectedModel, setSelectedModel] = useState<FluxModel>('flux-pro-1.1-ultra')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showGlobalRefs, setShowGlobalRefs] = useState(false)

  // Dimensions (for non-Ultra models)
  const [width, setWidth] = useState(1024)
  const [height, setHeight] = useState(1024)

  // Aspect ratio (for Ultra model)
  const [aspectRatio, setAspectRatio] = useState('16:9')

  // Common parameters
  const [promptUpsampling, setPromptUpsampling] = useState(false)
  const [seed, setSeed] = useState<string>('')
  const [safetyTolerance, setSafetyTolerance] = useState(2)
  const [outputFormat, setOutputFormat] = useState<'jpeg' | 'png'>('jpeg')

  // Ultra-specific parameters
  const [raw, setRaw] = useState(false)
  const [imagePromptStrength, setImagePromptStrength] = useState(0.1)

  // Dev-specific parameters
  const [steps, setSteps] = useState(28)
  const [guidance, setGuidance] = useState(3.5)

  const isUltra = selectedModel === 'flux-pro-1.1-ultra'
  const isKontext = selectedModel === 'flux-kontext-max' || selectedModel === 'flux-kontext-pro' || selectedModel === 'flux-kontext-dev'
  const isDev = selectedModel === 'flux-dev'
  const usesAspectRatio = isUltra || isKontext

  // Determine which reference image to use (prioritize selected over default)
  const activeReferenceImageUrl = selectedReferenceImageUrl || referenceImageUrl
  const supportsReferenceImage = isUltra || isKontext

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
        model: selectedModel,
        provider: 'black-forest-labs',
        prompt_upsampling: promptUpsampling,
        safety_tolerance: safetyTolerance,
        output_format: outputFormat,
      }

      // Add seed if provided
      if (seed.trim()) {
        const seedNum = parseInt(seed.trim())
        if (!isNaN(seedNum)) {
          requestBody.seed = seedNum
        }
      }

      // Ultra and Kontext model parameters
      if (usesAspectRatio) {
        requestBody.aspect_ratio = aspectRatio

        // Ultra-specific features
        if (isUltra) {
          requestBody.raw = raw

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
            requestBody.image_prompt_strength = imagePromptStrength
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
          requestBody.image_prompt_strength = imagePromptStrength
        }
      } else {
        // Non-Ultra models use width/height
        requestBody.width = width
        requestBody.height = height
      }

      // Dev model parameters
      if (isDev) {
        requestBody.steps = steps
        requestBody.guidance = guidance
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

      onImageGenerated()
    } catch (err) {
      console.error('Generation error:', err)
      const message = err instanceof Error ? err.message : 'Failed to generate image'
      setError(message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      <h2 className="text-xl font-semibold mb-4">Generate New Image with FLUX</h2>

      <div className="space-y-6">
        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            FLUX Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as FluxModel)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white"
            disabled={generating}
          >
            {FLUX_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-gray-400">
            {FLUX_MODELS.find((m) => m.id === selectedModel)?.description}
          </p>
        </div>

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
                  <button
                    key={ref.id}
                    onClick={() => handleSelectGlobalReference(ref.image_url)}
                    type="button"
                    className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden border-2 border-purple-600 hover:border-purple-400 transition-colors group"
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
              {selectedReferenceImageUrl && onClearReference && (
                <button
                  onClick={onClearReference}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                  disabled={generating}
                >
                  Clear Reference
                </button>
              )}
            </div>
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <Image src={activeReferenceImageUrl} alt={`${section.name} reference`} fill className="object-cover" />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Image {isKontext ? 'Influence' : 'Prompt'} Strength: {imagePromptStrength.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={imagePromptStrength}
                onChange={(e) => setImagePromptStrength(parseFloat(e.target.value))}
                className="w-full"
                disabled={generating}
              />
              <p className="mt-1 text-xs text-gray-500">
                Lower = more creative, Higher = closer to reference
              </p>
            </div>
            {selectedReferenceImageUrl && (
              <p className="mt-2 text-xs text-blue-400">
                💡 This image will be used as the starting point. Adjust your prompt to describe modifications (e.g., "zoom in and go to the left").
              </p>
            )}
          </div>
        )}

        {/* Dimensions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {usesAspectRatio ? (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white"
                disabled={generating}
              >
                {ASPECT_RATIOS.map((ratio) => (
                  <option key={ratio} value={ratio}>
                    {ratio}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {isKontext ? 'Kontext models' : 'Ultra model'} use aspect ratios instead of exact dimensions
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Width (px)
                </label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(parseInt(e.target.value) || 1024)}
                  min={256}
                  max={2048}
                  step={64}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white"
                  disabled={generating}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Height (px)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(parseInt(e.target.value) || 1024)}
                  min={256}
                  max={2048}
                  step={64}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white"
                  disabled={generating}
                />
              </div>
            </>
          )}
        </div>

        {/* Common Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Output Format
            </label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as 'jpeg' | 'png')}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white"
              disabled={generating}
            >
              <option value="jpeg">JPEG (smaller file)</option>
              <option value="png">PNG (lossless)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Seed (optional)
            </label>
            <input
              type="text"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Random (leave empty)"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder:text-gray-500"
              disabled={generating}
            />
            <p className="mt-1 text-xs text-gray-500">Use same seed for reproducible results</p>
          </div>
        </div>

        {/* Safety Tolerance */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Safety Tolerance: {safetyTolerance}
          </label>
          <input
            type="range"
            min="0"
            max="6"
            step="1"
            value={safetyTolerance}
            onChange={(e) => setSafetyTolerance(parseInt(e.target.value))}
            className="w-full"
            disabled={generating}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Most Restrictive (0)</span>
            <span>Balanced (2)</span>
            <span>Most Permissive (6)</span>
          </div>
        </div>

        {/* Prompt Upsampling */}
        <div>
          <label className="flex items-start gap-3 bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1"
              checked={promptUpsampling}
              onChange={() => setPromptUpsampling(!promptUpsampling)}
              disabled={generating}
            />
            <div>
              <div className="font-semibold text-white">Prompt Upsampling</div>
              <p className="text-sm text-gray-400 mt-1">
                Automatically enhance your prompt with more details for better results
              </p>
            </div>
          </label>
        </div>

        {/* Ultra-specific: Raw Mode */}
        {isUltra && (
          <div>
            <label className="flex items-start gap-3 bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={raw}
                onChange={() => setRaw(!raw)}
                disabled={generating}
              />
              <div>
                <div className="font-semibold text-white">Raw Mode</div>
                <p className="text-sm text-gray-400 mt-1">
                  Authentic candid photography feel with natural aesthetics and increased diversity
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Dev-specific: Steps and Guidance */}
        {isDev && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Steps: {steps}
              </label>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={steps}
                onChange={(e) => setSteps(parseInt(e.target.value))}
                className="w-full"
                disabled={generating}
              />
              <p className="mt-1 text-xs text-gray-500">More steps = higher quality but slower</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Guidance Scale: {guidance.toFixed(1)}
              </label>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={guidance}
                onChange={(e) => setGuidance(parseFloat(e.target.value))}
                className="w-full"
                disabled={generating}
              />
              <p className="mt-1 text-xs text-gray-500">Higher = follows prompt more closely</p>
            </div>
          </div>
        )}

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
              Generating... (this may take 30-60 seconds)
            </span>
          ) : (
            'Generate Image'
          )}
        </button>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">
            <p className="font-medium">Error:</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-400">
          <p className="font-medium text-gray-300 mb-1">🚀 FLUX Pro Tips:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Use <strong>Ultra</strong> for high-resolution photos (up to 4MP)</li>
            <li>Enable <strong>Raw Mode</strong> for authentic photography aesthetics</li>
            <li>Use <strong>Prompt Upsampling</strong> if you want AI to enhance your prompt</li>
            <li><strong>Dev model</strong> lets you tweak steps and guidance for fine control</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
