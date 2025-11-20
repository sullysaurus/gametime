'use client'

import { useState } from 'react'
import Collapsible from './Collapsible'

type FluxModel = 'flux-pro-1.1-ultra' | 'flux-pro-1.1' | 'flux-pro' | 'flux-dev' | 'flux-kontext-max' | 'flux-kontext-pro' | 'flux-kontext-dev'

export type LoRAWeight = {
  path: string
  scale: number
}

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
  loras: LoRAWeight[]
  focusArea: string
  viewingPerspective: string
}

type Preset = {
  id: string
  name: string
  description: string
  settings: Partial<GenerationSettings>
  promptTemplate: string
}

const CONCERT_PRESETS: Preset[] = [
  {
    id: 'epic-stage',
    name: '🎸 Epic Stage Performance',
    description: 'Dramatic wide-angle concert shot with stage lighting',
    settings: {
      model: 'flux-kontext-max',
      aspectRatio: '16:9',
      imagePromptStrength: 0.45,
      promptUpsampling: true,
    },
    promptTemplate: 'Professional concert photography, {PERSPECTIVE}, epic wide-angle stage shot focused on {FOCUS}, dramatic stage lighting with vibrant colors, silhouette of performer against bright backdrop, volumetric light beams cutting through atmospheric smoke, crowd energy visible, photorealistic, shot on Sony A7III 24mm f/1.4, high contrast, cinematic composition, enhanced colors and magical atmosphere, 8k quality',
  },
  {
    id: 'intimate-spotlight',
    name: '🎤 Intimate Spotlight',
    description: 'Close-up portrait with dramatic single spotlight',
    settings: {
      model: 'flux-kontext-max',
      aspectRatio: '3:4',
      imagePromptStrength: 0.45,
      promptUpsampling: true,
    },
    promptTemplate: 'Professional concert photography, {PERSPECTIVE}, intimate close-up portrait of performer on {FOCUS}, dramatic single spotlight creating strong rim lighting, dark background with subtle atmospheric haze, emotional expression captured mid-performance, shallow depth of field, photorealistic, shot on Canon EOS R5 85mm f/1.2, hyper-detailed face and clothing texture, enhanced dramatic lighting, professional color grading, 8k quality',
  },
  {
    id: 'crowd-energy',
    name: '🙌 Crowd Energy',
    description: 'Perspective from stage showing crowd and atmosphere',
    settings: {
      model: 'flux-kontext-max',
      aspectRatio: '16:9',
      imagePromptStrength: 0.4,
      promptUpsampling: true,
    },
    promptTemplate: 'Professional concert photography, {PERSPECTIVE}, massive crowd with hands raised looking at {FOCUS}, dynamic stage lighting illuminating thousands of fans, atmospheric smoke and light beams, sense of scale and energy, wide-angle view, photorealistic, shot on Nikon Z9 14-24mm f/2.8, vibrant enhanced colors, epic magical atmosphere, 8k quality',
  },
  {
    id: 'silhouette-dramatic',
    name: '🌟 Dramatic Silhouette',
    description: 'Powerful backlit silhouette with colorful stage lights',
    settings: {
      model: 'flux-kontext-max',
      aspectRatio: '16:9',
      imagePromptStrength: 0.5,
      promptUpsampling: true,
    },
    promptTemplate: 'Professional concert photography, {PERSPECTIVE}, powerful silhouette of performer on {FOCUS} backlit by intense stage lights, dramatic color gradient background with purples and oranges, smoke creating atmospheric depth, strong contrast and rim lighting, dynamic pose mid-performance, enhanced magical lighting, photorealistic, shot on Sony A1 50mm f/1.2, cinematic composition, professional color grading, 8k quality',
  },
]

type Props = {
  settings: GenerationSettings
  onSettingsChange: (settings: GenerationSettings) => void
  onPresetApplied?: (promptTemplate: string) => void
  sectionName?: string
  sectionCode?: string
  rowInfo?: string
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

const FOCUS_AREAS = [
  { value: 'center-stage', label: 'Center Stage', description: 'Main performer front and center' },
  { value: 'front-left', label: 'Front Left', description: 'Stage left side focus' },
  { value: 'front-right', label: 'Front Right', description: 'Stage right side focus' },
  { value: 'full-stage', label: 'Full Stage', description: 'Wide view of entire stage' },
  { value: 'crowd-forward', label: 'Crowd Forward', description: 'Front rows and crowd energy' },
  { value: 'stage-from-crowd', label: 'Stage from Crowd', description: 'Looking toward stage from audience' },
]

const VIEWING_PERSPECTIVES = [
  { value: 'keep-original', label: 'Keep Original', description: 'Maintain current camera angle' },
  { value: 'far-left', label: 'Far Left Side', description: 'Camera positioned far stage left' },
  { value: 'left', label: 'Left Side', description: 'Camera angled from left' },
  { value: 'center', label: 'Center View', description: 'Straight-on center perspective' },
  { value: 'right', label: 'Right Side', description: 'Camera angled from right' },
  { value: 'far-right', label: 'Far Right Side', description: 'Camera positioned far stage right' },
]

export default function SettingsPanel({
  settings,
  onSettingsChange,
  onPresetApplied,
  sectionName,
  sectionCode,
  rowInfo
}: Props) {
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const isUltra = settings.model === 'flux-pro-1.1-ultra'
  const isKontext = settings.model.includes('kontext')
  const isDev = settings.model === 'flux-dev'
  const usesAspectRatio = isUltra || isKontext
  const supportsReferenceImage = isUltra || isKontext

  const updateSetting = <K extends keyof GenerationSettings>(key: K, value: GenerationSettings[K]) => {
    setSelectedPresetId(null) // Clear preset selection when manually adjusting settings
    onSettingsChange({ ...settings, [key]: value })
  }

  const applyPreset = (preset: Preset) => {
    setSelectedPresetId(preset.id)
    onSettingsChange({ ...settings, ...preset.settings })
    if (onPresetApplied) {
      // Build section description
      let sectionDescription = ''
      if (sectionName && sectionCode) {
        sectionDescription = `${sectionName} (${sectionCode}${rowInfo ? `, ${rowInfo}` : ''})`
      } else if (sectionCode) {
        sectionDescription = sectionCode
      } else {
        sectionDescription = 'this seating section'
      }

      // Get focus area description
      const focusAreaObj = FOCUS_AREAS.find(f => f.value === settings.focusArea)
      const focusDescription = focusAreaObj?.label.toLowerCase() || 'center stage'

      // Get perspective description
      const perspectiveObj = VIEWING_PERSPECTIVES.find(p => p.value === settings.viewingPerspective)
      let perspectiveDescription = ''
      if (settings.viewingPerspective === 'keep-original') {
        perspectiveDescription = `from ${sectionDescription} seating view`
      } else {
        perspectiveDescription = `camera angle from ${perspectiveObj?.label.toLowerCase() || 'center view'} of venue`
      }

      // Replace placeholders with actual info
      let finalPrompt = preset.promptTemplate.replace(/{SECTION}/g, sectionDescription)
      finalPrompt = finalPrompt.replace(/{FOCUS}/g, focusDescription)
      finalPrompt = finalPrompt.replace(/{PERSPECTIVE}/g, perspectiveDescription)
      onPresetApplied(finalPrompt)
    }
  }

  return (
    <div className="space-y-4">
      {/* Concert Photography Presets */}
      <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-lg border border-purple-700/50 p-4">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
          🎵 Concert Photography Presets
        </h2>
        <p className="text-xs text-gray-300 mb-4">
          Transform your reference photo with dramatic concert lighting! Upload a section image, then click a preset.
          Uses Kontext Max for img2img with section details automatically included.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CONCERT_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className={`text-left p-3 rounded-lg transition-all group relative ${
                  isSelected
                    ? 'bg-purple-600/40 border-2 border-purple-400 shadow-lg shadow-purple-500/50'
                    : 'bg-black/40 hover:bg-black/60 border border-purple-600/30 hover:border-purple-500'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-purple-400 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    ✓
                  </div>
                )}
                <div className={`font-medium text-sm mb-1 ${
                  isSelected ? 'text-purple-200' : 'group-hover:text-purple-300'
                }`}>
                  {preset.name}
                </div>
                <div className={`text-xs ${
                  isSelected ? 'text-purple-300' : 'text-gray-400'
                }`}>
                  {preset.description}
                </div>
              </button>
            )
          })}
        </div>

        {/* Focus Area Selector */}
        <div className="mt-4 pt-4 border-t border-purple-700/30">
          <label className="text-xs font-medium text-purple-300 mb-2 block">
            🎯 Stage Focus Area
          </label>
          <select
            value={settings.focusArea}
            onChange={(e) => updateSetting('focusArea', e.target.value)}
            className="w-full px-3 py-2 bg-black/40 border border-purple-600/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {FOCUS_AREAS.map((area) => (
              <option key={area.value} value={area.value}>
                {area.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            {FOCUS_AREAS.find(a => a.value === settings.focusArea)?.description}
          </p>
        </div>

        {/* Viewing Perspective Selector */}
        <div className="mt-4">
          <label className="text-xs font-medium text-purple-300 mb-2 block">
            📷 Camera Perspective
          </label>
          <select
            value={settings.viewingPerspective}
            onChange={(e) => updateSetting('viewingPerspective', e.target.value)}
            className="w-full px-3 py-2 bg-black/40 border border-purple-600/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {VIEWING_PERSPECTIVES.map((perspective) => (
              <option key={perspective.value} value={perspective.value}>
                {perspective.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            {VIEWING_PERSPECTIVES.find(p => p.value === settings.viewingPerspective)?.description}
          </p>
          <p className="text-xs text-yellow-400 mt-2">
            💡 Change this to shift the camera angle (e.g., right side photo → left side view)
          </p>
        </div>
      </div>

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

                {/* LoRA Configuration */}
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-300 font-medium">
                      LoRA Models (Hyper-Realistic)
                    </label>
                    <button
                      onClick={() => {
                        const newLoras = [...settings.loras, { path: '', scale: 1.0 }]
                        updateSetting('loras', newLoras)
                      }}
                      className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded"
                    >
                      + Add LoRA
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Add LoRA models for style fine-tuning (e.g., hyper-realism, photography)
                  </p>

                  {settings.loras.length === 0 ? (
                    <div className="text-xs text-gray-500 italic py-2">
                      No LoRAs added. Click &quot;+ Add LoRA&quot; to start.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {settings.loras.map((lora, index) => (
                        <div key={index} className="bg-gray-800 border border-gray-700 rounded p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <input
                              type="text"
                              value={lora.path}
                              onChange={(e) => {
                                const newLoras = [...settings.loras]
                                newLoras[index].path = e.target.value
                                updateSetting('loras', newLoras)
                              }}
                              placeholder="LoRA path (e.g., model-id or URL)"
                              className="flex-1 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs placeholder:text-gray-600"
                            />
                            <button
                              onClick={() => {
                                const newLoras = settings.loras.filter((_, i) => i !== index)
                                updateSetting('loras', newLoras)
                              }}
                              className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded"
                            >
                              Remove
                            </button>
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">
                              Weight: {lora.scale.toFixed(2)}
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="2"
                              step="0.1"
                              value={lora.scale}
                              onChange={(e) => {
                                const newLoras = [...settings.loras]
                                newLoras[index].scale = parseFloat(e.target.value)
                                updateSetting('loras', newLoras)
                              }}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Subtle (0)</span>
                              <span>Strong (2)</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 text-xs text-gray-500 bg-gray-800 border border-gray-700 rounded p-2">
                    <div className="font-medium text-gray-400 mb-1">Recommended for Venues:</div>
                    <div className="space-y-1 text-gray-500">
                      <div>• Hyper-realism LoRAs (weight: 0.8-1.2)</div>
                      <div>• Photography enhancement LoRAs</div>
                      <div>• Architectural detail LoRAs</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </Collapsible>
      </div>
    </div>
  )
}
