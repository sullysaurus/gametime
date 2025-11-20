'use client'

import { useState } from 'react'
import Collapsible from './Collapsible'

type FluxModel = 'flux-pro-1.1-ultra' | 'flux-pro-1.1' | 'flux-pro' | 'flux-dev' | 'flux-kontext-max' | 'flux-kontext-pro' | 'flux-kontext-dev'

export type GenerationSettings = {
  model: FluxModel
  width: number
  height: number
  aspectRatio: string
  outputFormat: 'jpeg' | 'png'
  seed: string
  safetyTolerance: number
  promptUpsampling: boolean
  raw: boolean
  imagePromptStrength: number
  steps: number
  guidance: number
}

type Props = {
  settings: GenerationSettings
  onSettingsChange: (settings: GenerationSettings) => void
}

const FLUX_MODELS: { id: FluxModel; name: string; description: string }[] = [
  {
    id: 'flux-pro-1.1-ultra',
    name: 'FLUX Pro 1.1 Ultra',
    description: 'Best Quality - 4MP, supports img2img',
  },
  {
    id: 'flux-pro-1.1',
    name: 'FLUX Pro 1.1',
    description: 'Fast - Great quality and speed',
  },
  {
    id: 'flux-pro',
    name: 'FLUX Pro',
    description: 'Original pro model',
  },
  {
    id: 'flux-kontext-max',
    name: 'FLUX Kontext Max',
    description: 'Maximum quality img2img',
  },
  {
    id: 'flux-kontext-pro',
    name: 'FLUX Kontext Pro',
    description: 'Professional img2img',
  },
  {
    id: 'flux-kontext-dev',
    name: 'FLUX Kontext Dev',
    description: 'Development img2img',
  },
  {
    id: 'flux-dev',
    name: 'FLUX Dev',
    description: 'Customizable - Steps & guidance',
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

export default function SettingsPanel({ settings, onSettingsChange }: Props) {
  const isUltra = settings.model === 'flux-pro-1.1-ultra'
  const isKontext = settings.model.includes('kontext')
  const isDev = settings.model === 'flux-dev'
  const usesAspectRatio = isUltra || isKontext
  const supportsReferenceImage = isUltra || isKontext

  const updateSetting = <K extends keyof GenerationSettings>(key: K, value: GenerationSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value })
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
        <h2 className="text-lg font-semibold mb-4">⚙️ Generation Settings</h2>

        {/* AI Model Selection */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-medium text-gray-300">AI Model</h3>
          <select
            value={settings.model}
            onChange={(e) => updateSetting('model', e.target.value as FluxModel)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {FLUX_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400">
            {FLUX_MODELS.find((m) => m.id === settings.model)?.description}
          </p>
        </div>

        {/* Image Dimensions */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-medium text-gray-300">
            {usesAspectRatio ? 'Aspect Ratio' : 'Dimensions'}
          </h3>
          {usesAspectRatio ? (
            <>
              <select
                value={settings.aspectRatio}
                onChange={(e) => updateSetting('aspectRatio', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
              >
                {ASPECT_RATIOS.map((ratio) => (
                  <option key={ratio} value={ratio}>
                    {ratio}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400">
                {isKontext ? 'Kontext models' : 'Ultra model'} use aspect ratios
              </p>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400">Width</label>
                <input
                  type="number"
                  value={settings.width}
                  onChange={(e) => updateSetting('width', parseInt(e.target.value) || 1024)}
                  step={64}
                  min={256}
                  max={2048}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Height</label>
                <input
                  type="number"
                  value={settings.height}
                  onChange={(e) => updateSetting('height', parseInt(e.target.value) || 1024)}
                  step={64}
                  min={256}
                  max={2048}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Output Format */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-medium text-gray-300">Output Format</h3>
          <select
            value={settings.outputFormat}
            onChange={(e) => updateSetting('outputFormat', e.target.value as 'jpeg' | 'png')}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
          >
            <option value="jpeg">JPEG (smaller file)</option>
            <option value="png">PNG (lossless)</option>
          </select>
        </div>

        {/* Seed */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-medium text-gray-300">Seed (Optional)</h3>
          <input
            type="text"
            value={settings.seed}
            onChange={(e) => updateSetting('seed', e.target.value)}
            placeholder="Random (leave empty)"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm placeholder:text-gray-500"
          />
          <p className="text-xs text-gray-400">
            Use same seed for reproducible results
          </p>
        </div>

        {/* Reference Image Strength (only if model supports it) */}
        {supportsReferenceImage && (
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-medium text-gray-300">
              Reference Influence: {settings.imagePromptStrength.toFixed(2)}
            </h3>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.imagePromptStrength}
              onChange={(e) => updateSetting('imagePromptStrength', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-400">
              Lower = more creative, Higher = closer to reference
            </p>
          </div>
        )}

        {/* Advanced Settings */}
        <Collapsible
          title="Advanced"
          description="Fine-tune generation parameters"
          defaultOpen={false}
        >
          <div className="space-y-4 pt-2">
            {/* Safety Tolerance */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Safety Tolerance: {settings.safetyTolerance}
              </label>
              <input
                type="range"
                min="0"
                max="6"
                value={settings.safetyTolerance}
                onChange={(e) => updateSetting('safetyTolerance', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Restrictive (0)</span>
                <span>Permissive (6)</span>
              </div>
            </div>

            {/* Prompt Upsampling */}
            <div>
              <label className="text-xs text-gray-400 flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={settings.promptUpsampling}
                  onChange={(e) => updateSetting('promptUpsampling', e.target.checked)}
                />
                Prompt Upsampling
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                AI enhances your prompt with more details
              </p>
            </div>

            {/* Raw Mode (Ultra only) */}
            {isUltra && (
              <div>
                <label className="text-xs text-gray-400 flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={settings.raw}
                    onChange={(e) => updateSetting('raw', e.target.checked)}
                  />
                  Raw Mode (Ultra only)
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Authentic candid photography feel
                </p>
              </div>
            )}

            {/* Dev Model Settings */}
            {isDev && (
              <>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Steps: {settings.steps}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={settings.steps}
                    onChange={(e) => updateSetting('steps', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    More steps = higher quality but slower
                  </p>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Guidance: {settings.guidance.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={settings.guidance}
                    onChange={(e) => updateSetting('guidance', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Higher = follows prompt more closely
                  </p>
                </div>
              </>
            )}
          </div>
        </Collapsible>
      </div>
    </div>
  )
}
