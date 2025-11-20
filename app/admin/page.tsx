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
import SectionCarousel from '@/components/SectionCarousel'
import Collapsible from '@/components/Collapsible'
import SettingsPanel, { type GenerationSettings } from '@/components/SettingsPanel'

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

  // Image state
  const [pendingImages, setPendingImages] = useState<GeneratedImage[]>([])
  const [globalReferences, setGlobalReferences] = useState<GeneratedImage[]>([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [selectedReferenceImageUrl, setSelectedReferenceImageUrl] = useState<string | null>(null)

  // Generation settings state
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>({
    model: 'flux-pro-1.1-ultra',
    width: 1024,
    height: 1024,
    aspectRatio: '16:9',
    outputFormat: 'jpeg',
    seed: '',
    safetyTolerance: 2,
    promptUpsampling: false,
    raw: false,
    imagePromptStrength: 0.1,
    steps: 28,
    guidance: 3.5,
    loras: [],
    referenceImage: null,
    img2imgStrength: 0.85,
  })

  useEffect(() => {
    loadSections()
    loadGlobalReferences()

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

    if (error) {
      console.error('Error loading prompt:', error)
      setActivePrompt(null)
    } else if (data && data.length > 0) {
      setActivePrompt(data[0])
    } else {
      // No active prompt found for this section
      setActivePrompt(null)
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
  }

  function handlePresetApplied(promptTemplate: string) {
    if (activePrompt) {
      // Update the active prompt with the preset template (in memory only)
      // The PromptEditor component will handle saving to database when user edits
      const updatedPrompt = { ...activePrompt, prompt_text: promptTemplate }
      setActivePrompt(updatedPrompt)
    }
  }

  async function handleImageGenerated() {
    await loadPendingImages()
    await loadGlobalReferences()
  }

  async function handleImageStatusChange() {
    await loadPendingImages()
    await loadGlobalReferences()
    await loadSections()
  }

  function handleSectionImageChange(newUrl: string | null) {
    if (!selectedSection) return
    setSelectedSection({ ...selectedSection, current_image_url: newUrl })
    loadSections()
  }

  function handleUseAsReference(imageUrl: string) {
    // Set as reference image for img2img generation
    setGenerationSettings(prev => ({
      ...prev,
      referenceImage: imageUrl
    }))
    // Also set the old state for backwards compatibility
    setSelectedReferenceImageUrl(imageUrl)
    // Scroll to settings panel to see the reference image
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleClearReference() {
    // Clear selected reference (primary image will still show as reference)
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
    } catch (err) {
      console.error('Error deleting prompt:', err)
      alert('Failed to delete prompt')
    }
  }

  async function handleDeleteSectionImage(sectionId: string) {
    try {
      console.log('Deleting image for section:', sectionId)

      // Clear the current_image_url from the section
      const { error } = await (supabase as any)
        .from('sections')
        .update({ current_image_url: null })
        .eq('id', sectionId)

      if (error) {
        console.error('Error deleting section image:', error)
        alert('Failed to delete image: ' + error.message)
        return
      }

      console.log('Image deleted successfully')

      // Reload sections to refresh the carousel
      await loadSections()

      alert('Image deleted successfully!')
    } catch (err) {
      console.error('Error deleting section image:', err)
      alert('Failed to delete image: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  async function handleUploadSectionImage(sectionId: string, file: File) {
    try {
      // Upload directly to Supabase Storage (no base64)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('sectionId', sectionId)

      const response = await fetch('/api/upload-section-image', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      alert('Image uploaded successfully!')

      // Reload sections to refresh the carousel
      await loadSections()
    } catch (err) {
      console.error('Error uploading section image:', err)
      alert('Failed to upload image: ' + (err instanceof Error ? err.message : 'Unknown error'))
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
        {/* Section Carousel - Full Width */}
        <div className="mb-6">
          <SectionCarousel
            sections={sections}
            selectedSection={selectedSection}
            onSelectSection={setSelectedSection}
            onDeleteImage={handleDeleteSectionImage}
            onUploadImage={handleUploadSectionImage}
            onUseAsReference={handleUseAsReference}
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* No Active Prompt */}
            {selectedSection && !activePrompt && (
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
                <p className="text-gray-400 mb-4">
                  This section doesn't have an active prompt yet.
                </p>
                <button
                  onClick={async () => {
                    // Create a default prompt for this section
                    const { data, error } = await (supabase as any)
                      .from('prompts')
                      .insert({
                        section_id: selectedSection.id,
                        prompt_text: 'A stunning concert venue view',
                        version: 1,
                        is_active: true,
                        notes: 'Initial prompt',
                        tags: [],
                        is_template: false
                      })
                      .select()
                      .single()

                    if (!error) {
                      setActivePrompt(data)
                    }
                  }}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
                >
                  Create Initial Prompt
                </button>
              </div>
            )}

            {/* Main Workflow */}
            {selectedSection && activePrompt && (
              <>
            {/* Current Section Image - Always Visible */}
            <SectionImageManager
              section={selectedSection}
              onPrimaryImageChange={handleSectionImageChange}
              onGlobalReferenceAdded={loadGlobalReferences}
              localFallbackUrl={getLocalPhotoUrl(selectedSection.section_code)}
            />

            {/* Prompt Editor - Always Visible */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h3 className="text-lg font-semibold mb-4">✏️ Edit Prompt</h3>
              <PromptEditor
                section={selectedSection}
                prompt={activePrompt}
                onPromptUpdate={handlePromptUpdate}
              />
            </div>

            {/* Image Generator - Collapsible */}
            <Collapsible
              title="✨ Generate New Image"
              description="Create AI-generated images"
              defaultOpen={true}
            >
              <ImageGenerator
                section={selectedSection}
                prompt={activePrompt}
                settings={generationSettings}
                onImageGenerated={handleImageGenerated}
                referenceImageUrl={selectedSection.current_image_url || getLocalPhotoUrl(selectedSection.section_code)}
                selectedReferenceImageUrl={selectedReferenceImageUrl}
                globalReferences={globalReferences}
                onClearReference={handleClearReference}
                onSelectGlobalReference={handleUseAsReference}
                onRemoveGlobalReference={handleRemoveGlobalReference}
              />
            </Collapsible>

            {/* Pending Reviews */}
            {pendingImages.length > 0 && (
              <Collapsible
                title="📋 Review Queue"
                description="Approve or reject generated images"
                badge={`${pendingImages.length}`}
                defaultOpen={true}
              >
                <div className="space-y-4">
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
              </Collapsible>
            )}
              </>
            )}
          </div>

          {/* Right Column - Settings (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            <SettingsPanel
              settings={generationSettings}
              onSettingsChange={setGenerationSettings}
              onPresetApplied={handlePresetApplied}
              sectionName={selectedSection?.name}
              sectionCode={selectedSection?.section_code}
              rowInfo={selectedSection?.row_info || undefined}
            />

            {/* Prompt History - Optional */}
            {selectedSection && activePrompt && (
              <Collapsible
                title="📝 Prompt History"
                description="Previous versions"
                defaultOpen={false}
              >
                <PromptHistory
                  section={selectedSection}
                  activePrompt={activePrompt}
                  onPromptRestore={handlePromptUpdate}
                />
              </Collapsible>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
