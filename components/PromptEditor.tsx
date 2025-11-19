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
  tags: string[]
  is_template: boolean
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
  const [tags, setTags] = useState<string[]>(prompt.tags || [])
  const [newTag, setNewTag] = useState('')
  const [isTemplate, setIsTemplate] = useState(prompt.is_template || false)
  const [saving, setSaving] = useState(false)

  function handleAddTag() {
    const trimmedTag = newTag.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setNewTag('')
    }
  }

  function handleRemoveTag(tagToRemove: string) {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

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
          tags: tags,
          is_template: isTemplate,
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
    setTags(prompt.tags || [])
    setIsTemplate(prompt.is_template || false)
    setNewTag('')
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

        {/* Tags */}
        {isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags (for organization and filtering)
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  placeholder="Add tag (e.g., sunset, crowd, wide-angle)..."
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Add Tag
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600/20 border border-blue-600 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Save as Template */}
        {isEditing && (
          <div>
            <label className="flex items-start gap-3 bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-750 transition-colors">
              <input
                type="checkbox"
                checked={isTemplate}
                onChange={(e) => setIsTemplate(e.target.checked)}
                className="mt-1"
              />
              <div>
                <div className="font-semibold text-white">Save as Reusable Template</div>
                <p className="text-sm text-gray-400 mt-1">
                  This prompt will be available in the shared template library for use across all sections
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Current Tags and Template Status (when not editing) */}
        {!isEditing && (tags.length > 0 || isTemplate) && (
          <div className="space-y-2">
            {tags.length > 0 && (
              <div>
                <div className="text-sm text-gray-400 mb-1">Tags:</div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-blue-600/20 border border-blue-600 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {isTemplate && (
              <div className="flex items-center gap-2 text-purple-400">
                <span className="text-sm">📋 Saved as Template</span>
              </div>
            )}
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
