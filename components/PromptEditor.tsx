'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Section = {
  id: string
  name: string
}

type Prompt = {
  id: string
  section_id: string
  prompt_text: string
  negative_prompt: string | null
  version: number
  is_active: boolean
  notes: string | null
  created_at: string
}

type Props = {
  section: Section
  prompt: Prompt
  onPromptUpdate: (prompt: Prompt) => void
}

export default function PromptEditor({ section, prompt, onPromptUpdate }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [promptText, setPromptText] = useState(prompt.prompt_text)
  const [notes, setNotes] = useState(prompt.notes || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      // Deactivate current prompt
      await (supabase as any)
        .from('prompts')
        .update({ is_active: false })
        .eq('section_id', section.id)

      // Create new prompt version
      const { data, error } = await (supabase as any)
        .from('prompts')
        .insert({
          section_id: section.id,
          prompt_text: promptText,
          version: prompt.version + 1,
          is_active: true,
          notes: notes || null,
        })
        .select()
        .single()

      if (error) throw error

      onPromptUpdate(data)
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving prompt:', error)
      alert('Failed to save prompt')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setPromptText(prompt.prompt_text)
    setNotes(prompt.notes || '')
    setIsEditing(false)
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">{section.name} - Prompt</h2>
          <p className="text-sm text-gray-400">Version {prompt.version}</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Edit Prompt
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Prompt Text */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Prompt
          </label>
          {isEditing ? (
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white font-mono text-sm min-h-[150px]"
              placeholder="Enter prompt..."
            />
          ) : (
            <div className="bg-gray-800 rounded-lg p-3 text-gray-300 font-mono text-sm whitespace-pre-wrap">
              {prompt.prompt_text}
            </div>
          )}
        </div>

        {/* Notes */}
        {isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm min-h-[60px]"
              placeholder="Add notes about this version..."
            />
          </div>
        )}

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              {saving ? 'Saving...' : 'Save New Version'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
