'use client'

import { useState } from 'react'
import Collapsible from './Collapsible'

type Props = {
  defaultModel?: string
  onModelChange?: (model: string) => void
}

export default function SettingsPanel({ defaultModel = 'flux-pro-1.1', onModelChange }: Props) {
  const [selectedModel, setSelectedModel] = useState(defaultModel)
  const [storageTest, setStorageTest] = useState<any>(null)

  const handleModelChange = (model: string) => {
    setSelectedModel(model)
    onModelChange?.(model)
  }

  async function testStorage() {
    try {
      const response = await fetch('/api/storage-test')
      const data = await response.json()
      setStorageTest(data)
    } catch (error) {
      console.error('Storage test failed:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
        <h2 className="text-lg font-semibold mb-4">⚙️ Settings</h2>

        {/* AI Model Selection */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-medium text-gray-300">AI Model</h3>
          <select
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <optgroup label="FLUX Pro">
              <option value="flux-pro-1.1-ultra">FLUX Pro 1.1 Ultra (Best Quality)</option>
              <option value="flux-pro-1.1">FLUX Pro 1.1 (Fast)</option>
              <option value="flux-pro">FLUX Pro</option>
            </optgroup>
            <optgroup label="FLUX Kontext (img2img)">
              <option value="flux-kontext-max">FLUX Kontext Max</option>
              <option value="flux-kontext-pro">FLUX Kontext Pro</option>
              <option value="flux-kontext-dev">FLUX Kontext Dev</option>
            </optgroup>
            <optgroup label="FLUX Dev">
              <option value="flux-dev">FLUX Dev (Customizable)</option>
            </optgroup>
          </select>
          <p className="text-xs text-gray-400">
            {selectedModel.includes('ultra') && 'Highest quality, supports img2img'}
            {selectedModel.includes('kontext') && 'Image-to-image transformation'}
            {selectedModel === 'flux-pro-1.1' && 'Fast generation, great quality'}
            {selectedModel === 'flux-dev' && 'Customizable steps & guidance'}
          </p>
        </div>

        {/* Image Dimensions */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-medium text-gray-300">Dimensions</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400">Width</label>
              <input
                type="number"
                defaultValue={1024}
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
                defaultValue={1024}
                step={64}
                min={256}
                max={2048}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Ultra/Kontext use aspect ratio. Others use exact dimensions.
          </p>
        </div>

        {/* Advanced Settings */}
        <Collapsible
          title="Advanced"
          description="Fine-tune generation parameters"
          defaultOpen={false}
        >
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Safety Tolerance (0-6)</label>
              <input
                type="range"
                min="0"
                max="6"
                defaultValue="2"
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                Prompt Upsampling
              </label>
            </div>
            <div>
              <label className="text-xs text-gray-400 flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                Raw Mode (Ultra only)
              </label>
            </div>
          </div>
        </Collapsible>
      </div>

      {/* Storage Status */}
      <Collapsible
        title="🗄️ Storage Status"
        description="Check Supabase Storage connection"
        defaultOpen={false}
      >
        <div className="space-y-3">
          <div className="bg-gray-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Connection Test</span>
              <button
                onClick={testStorage}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors"
              >
                Test
              </button>
            </div>

            {storageTest && (
              <div className="text-xs">
                <div className={storageTest.success ? 'text-green-400' : 'text-red-400'}>
                  {storageTest.success ? '✅ Storage is working' : '❌ Storage connection failed'}
                </div>
                {storageTest.recommendation && (
                  <div className="text-gray-400 mt-2">{storageTest.recommendation}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </Collapsible>

      {/* Quick Actions */}
      <Collapsible
        title="⚡ Quick Actions"
        description="Admin utilities"
        defaultOpen={false}
      >
        <div className="space-y-2">
          <button
            onClick={() => window.open('/api/storage-test', '_blank')}
            className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-left transition-colors"
          >
            📊 Storage Diagnostics
          </button>

          <button
            onClick={() => {
              if (confirm('Reload the admin page?')) {
                window.location.reload()
              }
            }}
            className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-left transition-colors"
          >
            🔄 Reload Page
          </button>
        </div>
      </Collapsible>

      {/* Info */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-3">
        <div className="text-xs text-gray-400 space-y-1">
          <div className="font-medium text-gray-300 mb-2">Storage Info</div>
          <div>Format: WebP (80% quality)</div>
          <div>Max: 2048px</div>
          <div>Bucket: generated-images</div>
          <div>Cache: 1 year</div>
        </div>
      </div>
    </div>
  )
}
