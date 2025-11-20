'use client'

import { useState } from 'react'
import Image from 'next/image'

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

type Props = {
  sections: Section[]
  selectedSection: Section | null
  onSelectSection: (section: Section) => void
  onDeleteImage?: (sectionId: string) => void
  onUploadImage?: (sectionId: string, file: File) => void
  onUseAsReference?: (imageUrl: string) => void
}

// Map section codes to local photos (fallback images)
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

export default function SectionCarousel({ sections, selectedSection, onSelectSection, onDeleteImage, onUploadImage, onUseAsReference }: Props) {
  const handleFileUpload = (sectionId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && onUploadImage) {
      onUploadImage(sectionId, file)
    }
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">All Sections</h2>
        <p className="text-sm text-gray-400 mt-1">
          Click on any section to select it and manage its images
        </p>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {sections.map((section) => {
              const hasCustomImage = !!section.current_image_url
              const imageUrl = section.current_image_url || getLocalPhotoUrl(section.section_code)
              const isSelected = selectedSection?.id === section.id

              return (
                <div
                  key={section.id}
                  className={`flex-shrink-0 w-64 rounded-lg overflow-hidden transition-all group ${
                    isSelected
                      ? 'ring-4 ring-green-500 shadow-lg shadow-green-500/50'
                      : 'ring-2 ring-gray-700 hover:ring-gray-600'
                  }`}
                >
                  <div
                    onClick={() => onSelectSection(section)}
                    className="w-full cursor-pointer"
                  >
                    {/* Image */}
                    <div className="relative aspect-video bg-gray-800">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={section.name}
                          fill
                          className="object-cover"
                          
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                          No Image
                        </div>
                      )}

                      {/* Selected Indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                          Selected
                        </div>
                      )}

                      {/* Action Buttons (visible on hover) */}
                      {(onDeleteImage || onUploadImage || onUseAsReference) && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4 flex-wrap">
                          {imageUrl && onUseAsReference && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onUseAsReference(imageUrl)
                              }}
                              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium transition-colors"
                            >
                              📸 Use as Reference
                            </button>
                          )}
                          {hasCustomImage && onDeleteImage && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (confirm('Delete this custom image? The section will revert to the default view.')) {
                                  onDeleteImage(section.id)
                                }
                              }}
                              className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors"
                            >
                              Delete Image
                            </button>
                          )}
                          {onUploadImage && (
                            <label className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors cursor-pointer">
                              Upload New
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  e.stopPropagation()
                                  handleFileUpload(section.id, e)
                                }}
                              />
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section Info */}
                  <div className={`p-3 text-left ${
                    isSelected ? 'bg-green-600' : 'bg-gray-800'
                  }`}>
                    <div className="font-semibold text-white">{section.name}</div>
                    <div className="text-xs text-gray-300 mt-1 flex items-center justify-between">
                      <span>{section.section_code}</span>
                      {section.price && (
                        <span className="font-bold">${section.price}</span>
                      )}
                    </div>
                    {(section.deal_badge || section.value_badge) && (
                      <div className="flex gap-1 mt-2">
                        {section.deal_badge && (
                          <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded">
                            {section.deal_badge}
                          </span>
                        )}
                        {section.value_badge && (
                          <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded">
                            {section.value_badge}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none" />
      </div>
    </div>
  )
}
