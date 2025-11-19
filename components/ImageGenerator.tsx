'use client'

import { useEffect, useMemo, useState } from 'react'
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

type Props = {
  section: Section
  prompt: Prompt
  onImageGenerated: () => void
  referenceImageUrl?: string | null
}

type ModelPreset = {
  id: string
  name: string
  provider: string
  description: string
  supportsReference: boolean
  defaults: {
    size: string
    quality: 'standard' | 'hd'
    style: 'vivid' | 'natural'
    background?: string | null
  }
}

const MODEL_PRESETS: ModelPreset[] = [
  {
    id: 'dall-e-3',
    name: 'DALL·E 3 (Ultra HD)',
    provider: 'openai',
    description: 'High-res, photorealistic renders perfect for scenic venue shots.',
    supportsReference: false,
    defaults: { size: '1920x1080', quality: 'hd', style: 'vivid' },
  },
  {
    id: 'gpt-image-1',
    name: 'GPT-Image 1 (Balanced)',
    provider: 'openai',
    description: 'Fast & flexible with support for transparent or flat backgrounds.',
    supportsReference: true,
    defaults: { size: '1920x1080', quality: 'standard', style: 'natural', background: 'white' },
  },
  {
    id: 'stabilityai/stable-diffusion-3',
    name: 'Stable Diffusion 3 (Detail)',
    provider: 'stability',
    description: 'Gateway model tuned for intricate textures and lighting nuance.',
    supportsReference: false,
    defaults: { size: '1024x1024', quality: 'standard', style: 'vivid' },
  },
  {
    id: 'black-forest-labs/flux-pro',
    name: 'FLUX.1 Pro (Creative)',
    provider: 'black-forest-labs',
    description: 'State-of-the-art FLUX pipeline for stylized poster-like art.',
    supportsReference: false,
    defaults: { size: '1024x1792', quality: 'hd', style: 'natural' },
  },
]

const SUGGESTED_SIZES = ['1920x1080', '1792x1024', '1024x1792', '1536x1024', '1024x1536', '1024x1024', '768x768']
const QUALITY_OPTIONS: Array<'standard' | 'hd'> = ['standard', 'hd']
const STYLE_OPTIONS: Array<'vivid' | 'natural'> = ['vivid', 'natural']

const defaultPreset = MODEL_PRESETS[0]

export default function ImageGenerator({ section, prompt, onImageGenerated, referenceImageUrl }: Props) {
  const [selectedModel, setSelectedModel] = useState(defaultPreset.id)
  const [size, setSize] = useState(defaultPreset.defaults.size)
  const [quality, setQuality] = useState<'standard' | 'hd'>(defaultPreset.defaults.quality)
  const [style, setStyle] = useState<'vivid' | 'natural'>(defaultPreset.defaults.style)
  const [background, setBackground] = useState<string>(defaultPreset.defaults.background || '')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useReferenceImage, setUseReferenceImage] = useState<boolean>(Boolean(referenceImageUrl))

  const activePreset = useMemo(
    () => MODEL_PRESETS.find((model) => model.id === selectedModel) || defaultPreset,
    [selectedModel]
  )

  useEffect(() => {
    if (!activePreset) return
    setSize(activePreset.defaults.size)
    setQuality(activePreset.defaults.quality)
    setStyle(activePreset.defaults.style)
    setBackground(activePreset.defaults.background || '')
    if (!referenceImageUrl) {
      setUseReferenceImage(false)
    }
  }, [activePreset])

  useEffect(() => {
    setUseReferenceImage(Boolean(referenceImageUrl))
  }, [referenceImageUrl])

  const canUseReference = Boolean(referenceImageUrl) && activePreset.supportsReference

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
          model: activePreset.id,
          provider: activePreset.provider,
          size: size.trim(),
          quality,
          style,
          background: background.trim() === '' ? null : background.trim(),
          referenceImageUrl: canUseReference && useReferenceImage ? referenceImageUrl : null,
          useReferenceImage: canUseReference && useReferenceImage,
        }),
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
      <h2 className="text-xl font-semibold mb-4">Generate New Image</h2>

      <div className="space-y-6">
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
            {MODEL_PRESETS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.provider})
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-gray-400">{activePreset.description}</p>
          <p className="mt-1 text-xs text-gray-500">
            Defaults: {activePreset.defaults.size} · {activePreset.defaults.quality.toUpperCase()} ·{' '}
            {activePreset.defaults.style}{' '}
            {activePreset.defaults.background ? `· ${activePreset.defaults.background}` : ''}
          </p>
        </div>

        {referenceImageUrl && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm font-semibold text-gray-300 mb-2">
                Section Reference Photo
              </div>
              <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                <ImagePreview src={referenceImageUrl} alt={`${section.name} reference`} />
              </div>
            </div>
            <div>
              <label className="flex items-start gap-3 bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={useReferenceImage && canUseReference}
                  onChange={() => setUseReferenceImage((prev) => !prev)}
                  disabled={!canUseReference || generating}
                />
                <div>
                  <div className="font-semibold text-white">Use reference as input</div>
                  <p className="text-sm text-gray-400 mt-1">
                    {canUseReference
                      ? 'GPT-Image 1 can take the current seat photo and enhance it with your prompt.'
                      : 'Switch to GPT-Image 1 to enable direct reference-based enhancements.'}
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Size
            </label>
            <input
              type="text"
              list="image-size-options"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white"
              disabled={generating}
              placeholder="1792x1024"
            />
            <datalist id="image-size-options">
              {SUGGESTED_SIZES.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
            <p className="mt-1 text-xs text-gray-500">Use WIDTHxHEIGHT. Models usually accept 1024 or 1792 wide/tall.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quality
            </label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as 'standard' | 'hd')}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white"
              disabled={generating}
            >
              {QUALITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.toUpperCase()}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">HD spends more credits but captures more texture.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Style
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as 'vivid' | 'natural')}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white"
              disabled={generating}
            >
              {STYLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Vivid boosts contrast. Natural keeps filmic realism.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Background
            </label>
            <input
              type="text"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              placeholder="transparent, white, #101820, etc."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder:text-gray-500"
              disabled={generating}
            />
            <p className="mt-1 text-xs text-gray-500">Leave empty to let the model decide; GPT-Image supports transparency.</p>
          </div>
        </div>

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

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">
            <p className="font-medium">Error:</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-400">
          <p>
            Every generation stores the model + settings with the database record so you can
            quickly replicate winning looks later.
          </p>
        </div>
      </div>
    </div>
  )
}

function ImagePreview({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="absolute inset-0">
      <Image src={src} alt={alt} fill className="object-cover" />
    </div>
  )
}
