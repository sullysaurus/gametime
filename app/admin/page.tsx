'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import ImageGenerator from '@/components/ImageGenerator'
import ImageComparison from '@/components/ImageComparison'
import PromptEditor from '@/components/PromptEditor'
import PromptHistory from '@/components/PromptHistory'
import SectionImageManager from '@/components/SectionImageManager'

type Section = {
  id: string
  name: string
  section_code: string
  category: string
  current_image_url: string | null
  row_info: string | null
  price: number
  deal_badge: string | null
  value_badge: string | null
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

type GeneratedImage = {
  id: string
  section_id: string
  prompt_id: string | null
  image_url: string
  model_name: string
  model_provider: string
  status: string
  generation_settings: any
  comparison_notes: string | null
  created_at: string
  is_global_reference: boolean
}

// Map section codes to local photos
function getLocalPhotoUrl(sectionCode: string): string | null {
  const mapping: Record<string, string> = {
    'BL': '/sections/back-left.jpeg',
    'BLC': '/sections/back-left-center.jpeg',
    'BRC': '/sections/back-right-center.jpeg',
    'BR': '/sections/back-right.jpeg',
    'Pit GA': '/sections/general-admission.jpeg',
    'Seating GA': '/sections/general-admission.jpeg',
    'SRO': '/sections/general-admission.jpeg',
  }
  return mapping[sectionCode] || null
}

// Sort sections from front to back
function sortSectionsFrontToBack(sections: Section[]): Section[] {
  // Define sort priority: lower numbers = closer to front
  // Order: Pit GA → FC → FR → FL → MR → MRC → MLC → ML → BR → BRC → BLC → BL → Seating GA → SRO
  const sectionPriority: Record<string, number> = {
    'Pit GA': 1,
    'FC': 2,
    'FR': 3,
    'FL': 4,
    'MR': 5,
    'MRC': 6,
    'MLC': 7,
    'ML': 8,
    'BR': 9,
    'BRC': 10,
    'BLC': 11,
    'BL': 12,
    'Seating GA': 13,
    'SRO': 14,
  }

  return sections.sort((a, b) => {
    // If we have explicit priorities, use those
    const aPriority = sectionPriority[a.section_code] ?? 500
    const bPriority = sectionPriority[b.section_code] ?? 500

    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }

    // If same priority, sort by section_code or name
    return a.section_code.localeCompare(b.section_code)
  })
}

export default function AdminPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'generate' | 'prompts' | 'images'>('generate')

  // Section state
  const [sections, setSections] = useState<Section[]>([])
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)

  // Prompt state
  const [activePrompt, setActivePrompt] = useState<Prompt | null>(null)
  const [allPrompts, setAllPrompts] = useState<Prompt[]>([])

  // Image state
  const [pendingImages, setPendingImages] = useState<GeneratedImage[]>([])
  const [allImages, setAllImages] = useState<GeneratedImage[]>([])
  const [globalReferences, setGlobalReferences] = useState<GeneratedImage[]>([])

  // UI state
  const [showAllImages, setShowAllImages] = useState(true)
  const [showAllPrompts, setShowAllPrompts] = useState(false)
  const [loading, setLoading] = useState(true)
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null)
  const [selectedReferenceImageUrl, setSelectedReferenceImageUrl] = useState<string | null>(null)
  const [imageFilter, setImageFilter] = useState<{section?: string; status?: string}>({})
  const [promptFilter, setPromptFilter] = useState<{tag?: string; template?: boolean}>({})

  useEffect(() => {
    loadSections()
    loadGlobalReferences()
    loadAllImages() // Load unified image library on mount
    loadAllPrompts() // Load unified prompt library on mount

    // Check for section query parameter
    const urlParams = new URLSearchParams(window.location.search)
    const sectionId = urlParams.get('section')
    if (sectionId) {
      // Store it to select after sections load
      sessionStorage.setItem('pendingSectionId', sectionId)
    }
  }, [])

  useEffect(() => {
    if (selectedSection) {
      loadActivePrompt()
      loadPendingImages()
      // Don't reload all images here - they're already loaded globally
      // Load reference image URL
      const localPhoto = getLocalPhotoUrl(selectedSection.section_code)
      setReferenceImageUrl(localPhoto || selectedSection.current_image_url)
      // Clear selected reference when changing sections
      setSelectedReferenceImageUrl(null)
    }
  }, [selectedSection])

  async function loadSections() {
    const { data, error } = await supabase
      .from('sections')
      .select('*')

    if (error) {
      console.error('Error loading sections:', error)
      setLoading(false)
      return
    }

    if (data) {
      // Sort sections from front to back
      const sortedSections = sortSectionsFrontToBack(data)
      setSections(sortedSections)
      if (sortedSections.length > 0) {
        // Check if there's a pending section ID from URL
        const pendingSectionId = sessionStorage.getItem('pendingSectionId')
        if (pendingSectionId) {
          const targetSection = sortedSections.find((s: Section) => s.id === pendingSectionId)
          if (targetSection) {
            setSelectedSection(targetSection)
            sessionStorage.removeItem('pendingSectionId')
          } else {
            setSelectedSection(sortedSections[0])
          }
        } else if (!selectedSection) {
          setSelectedSection(sortedSections[0])
        } else {
          const refreshed = sortedSections.find((section: Section) => section.id === selectedSection.id)
          if (refreshed) {
            setSelectedSection(refreshed)
          }
        }
      }
    }
    setLoading(false)
  }

  async function loadActivePrompt() {
    if (!selectedSection) return

    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('section_id', selectedSection.id)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('Error loading prompt:', error)
    } else {
      setActivePrompt(data)
    }
  }

  async function loadPendingImages() {
    if (!selectedSection) return

    const { data, error } = await supabase
      .from('generated_images')
      .select('id, section_id, prompt_id, image_url, model_name, model_provider, status, generation_settings, comparison_notes, created_at, is_global_reference')
      .eq('section_id', selectedSection.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading pending images:', error)
    } else {
      setPendingImages(data || [])
    }
  }

  async function loadAllImages() {
    // Load ALL images from ALL sections (unified library)
    const { data, error} = await supabase
      .from('generated_images')
      .select('id, section_id, image_url, model_name, status, created_at, sections(name, section_code)')
      .order('created_at', { ascending: false })
      .limit(100) // Limit to recent 100 for performance

    if (error) {
      console.error('Error loading all images:', error)
    } else {
      setAllImages(data || [])
    }
  }

  async function loadAllPrompts() {
    // Load ALL prompts from ALL sections (unified library)
    const { data, error } = await supabase
      .from('prompts')
      .select('id, section_id, prompt_text, negative_prompt, version, is_active, notes, created_at, tags, is_template, sections(name, section_code)')
      .order('created_at', { ascending: false })
      .limit(50) // Limit to recent 50 for performance

    if (error) {
      console.error('Error loading all prompts:', error)
    } else {
      setAllPrompts(data || [])
    }
  }

  async function loadGlobalReferences() {
    const { data, error } = await supabase
      .from('generated_images')
      .select('id, section_id, image_url, model_name, created_at, sections(name, section_code)')
      .eq('is_global_reference', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading global references:', error)
    } else {
      setGlobalReferences(data || [])
    }
  }

  async function handlePromptUpdate(updatedPrompt: Prompt) {
    setActivePrompt(updatedPrompt)
    await loadAllPrompts() // Refresh unified prompt library
  }

  async function handleImageGenerated() {
    await loadPendingImages()
    await loadAllImages()
    await loadGlobalReferences()
  }

  async function handleImageStatusChange() {
    await loadPendingImages()
    await loadAllImages()
    await loadGlobalReferences()
    await loadSections()
  }

  function handleSectionImageChange(newUrl: string | null) {
    if (!selectedSection) return
    setSelectedSection({ ...selectedSection, current_image_url: newUrl })
    loadSections()
  }

  function handleUseAsReference(imageUrl: string) {
    setSelectedReferenceImageUrl(imageUrl)
    // Scroll to top to see the ImageGenerator
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleClearReference() {
    setSelectedReferenceImageUrl(null)
  }

  async function handleRemoveGlobalReference(imageId: string) {
    try {
      // Update the image to remove is_global_reference flag
      const { error } = await (supabase as any)
        .from('generated_images')
        .update({ is_global_reference: false })
        .eq('id', imageId)

      if (error) {
        console.error('Error removing global reference:', error)
        alert('Failed to remove reference image')
        return
      }

      // Reload global references
      await loadGlobalReferences()
    } catch (err) {
      console.error('Error removing global reference:', err)
      alert('Failed to remove reference image')
    }
  }

  async function handleDeletePrompt(promptId: string) {
    try {
      // Delete the prompt from the database
      const { error } = await (supabase as any)
        .from('prompts')
        .delete()
        .eq('id', promptId)

      if (error) {
        console.error('Error deleting prompt:', error)
        alert('Failed to delete prompt')
        return
      }

      // Reload all prompts to refresh the library
      await loadAllPrompts()
    } catch (err) {
      console.error('Error deleting prompt:', err)
      alert('Failed to delete prompt')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Red Rocks AI Image Generator</h1>
              <p className="text-gray-400 text-sm mt-1">
                Generate, compare, and manage concert venue images
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <span>←</span>
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Section Selector Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
              <h2 className="text-lg font-semibold mb-4">Sections</h2>
              <div className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedSection?.id === section.id
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    <div className="font-medium">{section.name}</div>
                    <div className="text-xs opacity-75">{section.section_code}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {selectedSection && activePrompt && (
              <>
                {/* Primary Image Manager - Top Priority */}
                <SectionImageManager
                  section={selectedSection}
                  onPrimaryImageChange={handleSectionImageChange}
                  onGlobalReferenceAdded={loadGlobalReferences}
                />

                {/* Image Generator */}
                <ImageGenerator
                  section={selectedSection}
                  prompt={activePrompt}
                  onImageGenerated={handleImageGenerated}
                  referenceImageUrl={referenceImageUrl}
                  selectedReferenceImageUrl={selectedReferenceImageUrl}
                  globalReferences={globalReferences}
                  onClearReference={handleClearReference}
                  onSelectGlobalReference={handleUseAsReference}
                  onRemoveGlobalReference={handleRemoveGlobalReference}
                />

                {/* Prompt Editor */}
                <PromptEditor
                  section={selectedSection}
                  prompt={activePrompt}
                  onPromptUpdate={handlePromptUpdate}
                />

                {/* Prompt History */}
                <PromptHistory
                  section={selectedSection}
                  activePrompt={activePrompt}
                  onPromptRestore={handlePromptUpdate}
                />

                {/* Pending Images */}
                {pendingImages.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Pending Reviews</h2>
                    {pendingImages.map((image) => (
                      <ImageComparison
                        key={image.id}
                        section={selectedSection}
                        generatedImage={image}
                        onStatusChange={handleImageStatusChange}
                        onUseAsReference={handleUseAsReference}
                      />
                    ))}
                  </div>
                )}

                {pendingImages.length === 0 && (
                  <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
                    <p className="text-gray-400">
                      No pending images. Generate a new image above to get started.
                    </p>
                  </div>
                )}

                {/* Unified Prompt Library */}
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">📝 Unified Prompt Library</h2>
                      <p className="text-sm text-gray-400 mt-1">
                        All prompts from all sections - Find successful prompts to reuse
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const showPrompts = !showAllPrompts
                        setShowAllPrompts(showPrompts)
                      }}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                    >
                      {showAllPrompts ? 'Hide' : `Show (${allPrompts.length})`}
                    </button>
                  </div>

                  {showAllPrompts && (
                    <div className="space-y-4 mt-4">
                      {allPrompts.length === 0 ? (
                        <div className="text-center py-8 bg-gray-800 rounded-lg border border-gray-700">
                          <p className="text-gray-400 mb-2">No prompts found.</p>
                          <p className="text-sm text-gray-500">Edit a prompt above to get started!</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {allPrompts.map((prompt: any) => (
                            <div key={prompt.id} className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  {/* Section Badge & Template Indicator */}
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                                      {prompt.sections?.section_code || 'Unknown'}
                                    </span>
                                    {prompt.is_template && (
                                      <span className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded">
                                        📋 Template
                                      </span>
                                    )}
                                    {prompt.is_active && (
                                      <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded">
                                        Active
                                      </span>
                                    )}
                                  </div>

                                  {/* Prompt Text */}
                                  <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                                    {prompt.prompt_text}
                                  </p>

                                  {/* Tags */}
                                  {prompt.tags && prompt.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                      {prompt.tags.map((tag: string, idx: number) => (
                                        <span key={idx} className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {/* Metadata */}
                                  <div className="flex items-center gap-3 text-xs text-gray-400">
                                    <span>v{prompt.version}</span>
                                    <span>•</span>
                                    <span>{new Date(prompt.created_at).toLocaleDateString()}</span>
                                    {prompt.notes && (
                                      <>
                                        <span>•</span>
                                        <span className="truncate max-w-xs" title={prompt.notes}>
                                          {prompt.notes}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-2">
                                  <button
                                    onClick={async () => {
                                      if (!selectedSection) return

                                      // Create a new prompt version for the current section using this prompt text
                                      const { data: newPrompt, error } = await (supabase as any)
                                        .from('prompts')
                                        .insert({
                                          section_id: selectedSection.id,
                                          prompt_text: prompt.prompt_text,
                                          negative_prompt: prompt.negative_prompt,
                                          version: (activePrompt?.version || 0) + 1,
                                          is_active: true,
                                          notes: `Copied from ${prompt.sections?.section_code || 'another section'}`,
                                          tags: prompt.tags,
                                          is_template: false
                                        })
                                        .select()
                                        .single()

                                      if (error) {
                                        console.error('Error copying prompt:', error)
                                        alert('Failed to copy prompt')
                                        return
                                      }

                                      // Deactivate old prompt
                                      if (activePrompt) {
                                        await (supabase as any)
                                          .from('prompts')
                                          .update({ is_active: false })
                                          .eq('id', activePrompt.id)
                                      }

                                      // Update UI
                                      await loadActivePrompt()
                                      await loadAllPrompts()
                                      alert('Prompt copied to current section!')
                                      window.scrollTo({ top: 0, behavior: 'smooth' })
                                    }}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium transition-colors whitespace-nowrap"
                                  >
                                    Use for {selectedSection?.section_code}
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (confirm('Delete this prompt? This cannot be undone.')) {
                                        await handleDeletePrompt(prompt.id)
                                      }
                                    }}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition-colors whitespace-nowrap"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* All Generated Images - Unified Library */}
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">🎨 Unified Image Library</h2>
                      <p className="text-sm text-gray-400 mt-1">
                        All images from all sections - Click "Use as Reference" on any image
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAllImages(!showAllImages)}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                    >
                      {showAllImages ? 'Hide' : `Show (${allImages.length})`}
                    </button>
                  </div>

                  {showAllImages && (
                    <div className="space-y-4 mt-4">
                      {allImages.length === 0 ? (
                        <div className="text-center py-8 bg-gray-800 rounded-lg border border-gray-700">
                          <p className="text-gray-400 mb-2">No images generated yet.</p>
                          <p className="text-sm text-gray-500">Generate your first image above to get started!</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {allImages.map((image: any) => (
                            <div key={image.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors">
                              <div className="relative aspect-video bg-gray-900">
                                <Image
                                  src={image.image_url}
                                  alt={`Generated image`}
                                  fill
                                  className="object-cover"
                                  unoptimized={image.image_url.startsWith('data:')}
                                />
                                {/* Section Badge */}
                                <div className="absolute top-2 left-2">
                                  <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                                    {image.sections?.section_code || 'Unknown'}
                                  </span>
                                </div>
                              </div>
                              <div className="p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    image.status === 'approved' ? 'bg-green-600' :
                                    image.status === 'rejected' ? 'bg-red-600' :
                                    'bg-yellow-600'
                                  }`}>
                                    {image.status}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {new Date(image.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-400 truncate" title={image.model_name}>
                                  {image.model_name}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleUseAsReference(image.image_url)
                                  }}
                                  type="button"
                                  className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors"
                                >
                                  Use as Reference
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
