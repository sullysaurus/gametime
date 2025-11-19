'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
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
}

// Map section codes to local photos
function getLocalPhotoUrl(sectionCode: string): string | null {
  const mapping: Record<string, string> = {
    'BL': '/sections/back-left.jpeg',
    'BCL': '/sections/back-left-center.jpeg',
    'BCR': '/sections/back-right-center.jpeg',
    'BR': '/sections/back-right.jpeg',
    'GA1': '/sections/general-admission.jpeg',
    'GA2': '/sections/general-admission.jpeg',
    'SRO': '/sections/general-admission.jpeg',
  }
  return mapping[sectionCode] || null
}

export default function AdminPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)
  const [activePrompt, setActivePrompt] = useState<Prompt | null>(null)
  const [pendingImages, setPendingImages] = useState<GeneratedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null)

  useEffect(() => {
    loadSections()

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
      // Load reference image URL
      const localPhoto = getLocalPhotoUrl(selectedSection.section_code)
      setReferenceImageUrl(localPhoto || selectedSection.current_image_url)
    }
  }, [selectedSection])

  async function loadSections() {
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .order('category', { ascending: true })

    if (error) {
      console.error('Error loading sections:', error)
      setLoading(false)
      return
    }

    if (data) {
      setSections(data)
      if (data.length > 0) {
        // Check if there's a pending section ID from URL
        const pendingSectionId = sessionStorage.getItem('pendingSectionId')
        if (pendingSectionId) {
          const targetSection = data.find((s: Section) => s.id === pendingSectionId)
          if (targetSection) {
            setSelectedSection(targetSection)
            sessionStorage.removeItem('pendingSectionId')
          } else {
            setSelectedSection(data[0])
          }
        } else if (!selectedSection) {
          setSelectedSection(data[0])
        } else {
          const refreshed = data.find((section: Section) => section.id === selectedSection.id)
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
      .select('*')
      .eq('section_id', selectedSection.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading pending images:', error)
    } else {
      setPendingImages(data || [])
    }
  }

  async function handlePromptUpdate(updatedPrompt: Prompt) {
    setActivePrompt(updatedPrompt)
  }

  async function handleImageGenerated() {
    await loadPendingImages()
  }

  async function handleImageStatusChange() {
    await loadPendingImages()
    await loadSections()
  }

  function handleSectionImageChange(newUrl: string | null) {
    if (!selectedSection) return
    setSelectedSection({ ...selectedSection, current_image_url: newUrl })
    loadSections()
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
                {/* Image Generator */}
                <ImageGenerator
                  section={selectedSection}
                  prompt={activePrompt}
                  onImageGenerated={handleImageGenerated}
                  referenceImageUrl={referenceImageUrl}
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

                <SectionImageManager
                  section={selectedSection}
                  onPrimaryImageChange={handleSectionImageChange}
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
