'use client'

import { useEffect, useState } from 'react'
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
  activePrompt: Prompt
  onPromptRestore: (prompt: Prompt) => void
}

export default function PromptHistory({ section, activePrompt, onPromptRestore }: Props) {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Get all unique tags from prompts
  const allTags = Array.from(
    new Set(prompts.flatMap((p) => p.tags || []))
  ).sort()

  // Filter prompts by selected tag
  const filteredPrompts = selectedTag
    ? prompts.filter((p) => p.tags?.includes(selectedTag))
    : prompts

  useEffect(() => {
    loadPromptHistory()
  }, [section.id])

  async function loadPromptHistory() {
    setLoading(true)
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('section_id', section.id)
      .order('version', { ascending: false })

    if (error) {
      console.error('Error loading prompt history:', error)
    } else {
      setPrompts(data || [])
    }
    setLoading(false)
  }

  async function handleRestorePrompt(prompt: Prompt) {
    if (!confirm(`Restore version ${prompt.version} as a new version?`)) {
      return
    }

    try {
      // Deactivate current prompt
      await (supabase as any)
        .from('prompts')
        .update({ is_active: false })
        .eq('section_id', section.id)

      // Create new prompt version based on old one
      const { data, error } = await (supabase as any)
        .from('prompts')
        .insert({
          section_id: section.id,
          prompt_text: prompt.prompt_text,
          version: activePrompt.version + 1,
          is_active: true,
          notes: `Restored from version ${prompt.version}`,
        })
        .select()
        .single()

      if (error) throw error

      onPromptRestore(data)
      await loadPromptHistory()
    } catch (error) {
      console.error('Error restoring prompt:', error)
      alert('Failed to restore prompt')
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <h2 className="text-xl font-semibold mb-4">Prompt History</h2>
        <p className="text-gray-400">Loading history...</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      <h2 className="text-xl font-semibold mb-4">Prompt History</h2>
      <div className="mb-4">
        <p className="text-sm text-gray-400 mb-2">
          {prompts.length} version{prompts.length !== 1 ? 's' : ''} total
          {selectedTag && ` • Filtered by: ${selectedTag}`}
        </p>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedTag === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedTag === tag
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {filteredPrompts.map((prompt) => {
          const isExpanded = expandedId === prompt.id
          const isActive = prompt.id === activePrompt.id

          return (
            <div
              key={prompt.id}
              className={`border rounded-lg transition-colors ${
                isActive
                  ? 'border-green-600 bg-green-900/20'
                  : 'border-gray-700 bg-gray-800'
              }`}
            >
              {/* Header */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">
                      Version {prompt.version}
                    </h3>
                    {isActive && (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">
                      {formatDate(prompt.created_at)}
                    </span>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : prompt.id)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                    >
                      {isExpanded ? 'Hide' : 'View'}
                    </button>
                  </div>
                </div>

                {/* Notes preview */}
                {prompt.notes && (
                  <p className="text-sm text-gray-400 italic">{prompt.notes}</p>
                )}

                {/* Tags and Template Status */}
                {(prompt.tags?.length > 0 || prompt.is_template) && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {prompt.is_template && (
                      <span className="px-2 py-1 bg-purple-600/20 border border-purple-600 rounded-full text-xs text-purple-300">
                        📋 Template
                      </span>
                    )}
                    {prompt.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-600/20 border border-blue-600 rounded-full text-xs text-blue-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Prompt preview (first 150 chars) */}
                {!isExpanded && (
                  <p className="text-sm text-gray-300 mt-2 font-mono truncate">
                    {prompt.prompt_text.substring(0, 150)}
                    {prompt.prompt_text.length > 150 && '...'}
                  </p>
                )}
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-700 p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Prompt
                    </label>
                    <div className="bg-gray-950 rounded-lg p-3 text-gray-300 font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {prompt.prompt_text}
                    </div>
                  </div>

                  {!isActive && (
                    <button
                      onClick={() => handleRestorePrompt(prompt)}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                    >
                      Use This Prompt (Create New Version)
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
