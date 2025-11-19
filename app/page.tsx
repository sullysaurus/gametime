'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

type GeneratedImage = {
  id: string
  image_url: string
  status: 'pending' | 'approved' | 'rejected'
  approved_at: string | null
  created_at: string
}

type SectionRecord = {
  id: string
  name: string
  section_code: string
  category: string
  current_image_url: string | null
  row_info: string | null
  price: number
  deal_badge: string | null
  value_badge: string | null
  generated_images?: GeneratedImage[]
}

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
  display_image_url: string | null
  display_image_status: 'approved' | 'pending' | 'current'
}

export default function HomePage() {
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)
  const sliderRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadSections()
  }, [])

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

  async function loadSections() {
    const { data, error } = await supabase
      .from('sections')
      .select('*, generated_images(id, image_url, status, approved_at, created_at)')
      .order('price', { ascending: false })
      .order('approved_at', { ascending: false, foreignTable: 'generated_images' })

    if (error) {
      console.error('Error loading sections:', error)
      setLoading(false)
      return
    }

    const list = (data || []) as SectionRecord[]
    const hydrated: Section[] = list.map((section) => {
      const images: GeneratedImage[] = section.generated_images || []
      const approved = images
        .filter((img) => img.status === 'approved')
        .sort((a, b) => {
          const aTime = new Date(a.approved_at || a.created_at).getTime()
          const bTime = new Date(b.approved_at || b.created_at).getTime()
          return bTime - aTime
        })
      const pending = images
        .filter((img) => img.status === 'pending')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      // Priority: approved AI images > pending AI images > local photos > current_image_url
      let displayImageUrl: string | null = section.current_image_url
      let displayImageStatus: Section['display_image_status'] = 'current'

      const localPhoto = getLocalPhotoUrl(section.section_code)
      if (localPhoto) {
        displayImageUrl = localPhoto
        displayImageStatus = 'current'
      }

      if (approved.length > 0) {
        displayImageUrl = approved[0].image_url
        displayImageStatus = 'approved'
      } else if (pending.length > 0) {
        displayImageUrl = pending[0].image_url
        displayImageStatus = 'pending'
      }

      const { generated_images, ...rest } = section

      return {
        ...rest,
        display_image_url: displayImageUrl,
        display_image_status: displayImageStatus,
      }
    })

    setSections(hydrated)
    setLoading(false)
  }

  function scrollSlider(direction: 'left' | 'right') {
    if (sliderRef.current) {
      // Mobile: 160px card + 8px gap = 168px, Desktop: 256px card + 12px gap = 268px
      const isMobile = window.innerWidth < 768
      const scrollAmount = isMobile ? 168 : 280
      const newScrollLeft = sliderRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount)
      sliderRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' })
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
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top Nav - Desktop Only */}
      <div className="hidden md:block bg-black border-b border-gray-800 z-50 flex-shrink-0">
        <div className="px-4 py-3 flex items-center gap-6">
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="Gametime"
              width={120}
              height={32}
              className="h-8 w-auto"
            />
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Sports</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Music</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Comedy & Theater</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Cities</a>
            <a href="#" className="text-green-400 hover:text-green-300 transition-colors">World Cup 2026</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Morgan Wallen</a>
          </nav>
          <div className="flex items-center gap-4 ml-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search team, artist or venue"
                className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm w-64 focus:outline-none focus:border-green-500"
              />
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              Admin
            </Link>
            <button className="text-sm text-gray-300 hover:text-white transition-colors">
              Log In
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="flex flex-col md:flex-row flex-1 md:overflow-hidden relative">
        {/* Left Panel - Ticket List */}
        <div className="w-full md:w-[650px] border-r border-gray-800 overflow-y-auto bg-[#1a1a1a] flex-shrink-0">
          {/* Mobile Header - Event Info */}
          <div className="md:hidden bg-[#1a1a1a] p-4 border-b border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <button className="text-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <div className="text-center flex-1">
                <h1 className="text-lg font-bold">Jason Isbell And The 400 Unit</h1>
                <p className="text-sm text-gray-400">Red Rocks Amphitheatre</p>
              </div>
              <Link href="/admin" className="text-white text-xs">Admin</Link>
            </div>

            <div className="flex gap-2 mb-3">
              <button className="flex-1 flex items-center justify-between bg-[#2a2a2a] border border-gray-700 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  <span className="text-sm">Sat 5/2/26 · 7:00 PM</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              <button className="flex items-center justify-between bg-[#2a2a2a] border border-gray-700 rounded-lg px-3 py-2.5 min-w-[80px]">
                <div className="flex items-center gap-2">
                  <span>👥</span>
                  <span className="text-sm">2</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
            </div>

            <span className="inline-block bg-white text-black px-4 py-2 rounded-full text-sm font-bold">
              Includes Fees
            </span>
          </div>

          {/* Desktop Header - Event Info */}
          <div className="hidden md:block p-4 border-b border-gray-700">
            <button className="text-gray-400 hover:text-white mb-3 flex items-center gap-2">
              <span>←</span>
            </button>
            <h1 className="text-lg font-bold mb-1">Jason Isbell And The 400 Unit</h1>
            <p className="text-sm text-gray-400 mb-3">Red Rocks Amphitheatre</p>

            <div className="flex items-center gap-2 mb-3 text-xs">
              <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1.5 rounded">
                <span>📅</span>
                <span>Sat 5/2/26 · 7:00 PM</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1.5 rounded">
                <span>👥</span>
                <span>2</span>
              </div>
            </div>

            <span className="inline-block bg-white text-black px-3 py-1 rounded-full text-xs font-bold">
              Includes Fees
            </span>
          </div>

          {/* Top Deals Slider */}
          <div className="p-3 md:p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-base md:text-lg font-bold">Top Deals on Gametime</h2>
              <div className="flex gap-1 md:gap-2">
                <button
                  onClick={() => scrollSlider('left')}
                  className="text-white p-1.5 md:p-2 hover:bg-gray-800 rounded-full transition-colors"
                >
                  <span className="text-xl md:text-2xl">‹</span>
                </button>
                <button
                  onClick={() => scrollSlider('right')}
                  className="text-white p-1.5 md:p-2 hover:bg-gray-800 rounded-full transition-colors"
                >
                  <span className="text-xl md:text-2xl">›</span>
                </button>
              </div>
            </div>

            {/* Horizontal Scrolling Cards */}
            <div ref={sliderRef} className="overflow-x-auto scrollbar-hide -mx-3 md:-mx-4 px-3 md:px-4">
              <div className="flex gap-2 md:gap-3 pb-2">
                {sections.slice(0, 6).map((section) => (
                  <div
                    key={`slider-${section.id}`}
                    onClick={() => setSelectedSection(section)}
                    className="relative flex-shrink-0 w-40 md:w-64 h-28 md:h-40 rounded-lg overflow-hidden cursor-pointer group"
                  >
                    {/* Background Image */}
                    <div className="absolute inset-0">
                      {section.display_image_url ? (
                        <Image
                          src={section.display_image_url}
                          alt={section.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gray-800" />
                      )}
                      {/* Dark overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    </div>

                    {/* Deal Badge - Top Left */}
                    {section.deal_badge && (
                      <div className="absolute top-1.5 md:top-2 left-1.5 md:left-2">
                        <span
                          className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-bold flex items-center gap-1 ${
                            section.deal_badge === 'cheapest'
                              ? 'bg-pink-600'
                              : 'bg-green-500'
                          }`}
                        >
                          <span className="hidden md:inline">⭐</span>
                          {section.deal_badge === 'cheapest' ? 'CHEAPEST' : 'AMAZING DEAL'}
                        </span>
                      </div>
                    )}

                    {/* Bottom Left - Section Info */}
                    <div className="absolute bottom-1.5 md:bottom-2 left-1.5 md:left-2">
                      <div className="text-[10px] md:text-xs text-gray-300">{section.name}</div>
                      <div className="text-xs md:text-base font-bold">
                        {section.section_code}
                        {section.row_info && `, ${section.row_info}`}
                      </div>
                    </div>

                    {/* Bottom Right Price */}
                    <div className="absolute bottom-1.5 md:bottom-2 right-1.5 md:right-2 text-right">
                      {section.value_badge && (
                        <div className="mb-0.5 md:mb-1 flex justify-end">
                          <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-transparent text-[9px] md:text-[10px] font-bold border md:border-2 border-white">
                            {section.value_badge}
                          </span>
                        </div>
                      )}
                      <div className="text-[9px] md:text-[11px] text-gray-300">Includes Fees</div>
                      <div className="text-base md:text-xl font-bold">${section.price}/ea</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ticket Cards */}
          <div className="p-3 md:p-4">
            <div className="space-y-2 md:space-y-3">
              {sections.map((section) => (
                <div
                  key={section.id}
                  onClick={() => setSelectedSection(section)}
                  className="bg-[#2a2a2a] hover:bg-[#303030] transition-colors overflow-hidden cursor-pointer flex h-28 md:h-32 rounded-lg"
                >
                  {/* Left Side - Image */}
                  <div className="relative w-[45%] flex-shrink-0 bg-gray-800">
                    {section.display_image_url ? (
                      <Image
                        src={section.display_image_url}
                        alt={section.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-xs">
                        No image
                      </div>
                    )}

                    {/* Deal Badge on Image - Top Left */}
                    {section.deal_badge && (
                      <div className="absolute top-1.5 md:top-2 left-1.5 md:left-2">
                        <span
                          className={`px-1.5 md:px-2 py-0.5 md:py-1 text-[10px] md:text-xs font-bold flex items-center gap-1 ${
                            section.deal_badge === 'cheapest'
                              ? 'bg-pink-600'
                              : 'bg-green-500'
                          }`}
                        >
                          <span>{section.deal_badge === 'cheapest' ? '🔥' : '⭐'}</span>
                          <span className="hidden sm:inline">{section.deal_badge === 'cheapest' ? 'CHEAPEST' : 'AMAZING DEAL'}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Side - Content */}
                  <div className="flex-1 flex flex-col justify-between p-2 md:p-3 bg-[#2a2a2a]">
                    <div>
                      <div className="text-[11px] md:text-xs text-gray-400">{section.name}</div>
                      <div className="text-sm md:text-base font-bold mt-0.5 md:mt-1">
                        {section.section_code}, {section.row_info || 'Row GA'}
                      </div>
                    </div>

                    <div className="text-right">
                      {section.value_badge && (
                        <div className="mb-0.5 md:mb-1 flex justify-end">
                          <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-transparent text-[9px] md:text-[10px] font-bold border border-white">
                            {section.value_badge}
                          </span>
                        </div>
                      )}
                      <div className="text-[10px] md:text-[11px] text-gray-400">Includes Fees</div>
                      <div className="text-lg md:text-xl font-bold">${section.price}/ea</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail Panel - Slides in from left */}
        {selectedSection && (
          <div className="absolute inset-y-0 left-0 w-full md:w-[650px] bg-[#1a1a1a] border-r border-gray-700 z-50 overflow-y-auto animate-slide-in">
            {/* Back Button */}
            <div className="p-4">
              <button
                onClick={() => setSelectedSection(null)}
                className="text-gray-400 hover:text-white flex items-center gap-2 mb-4"
              >
                <span>←</span>
              </button>

              <h2 className="text-lg font-bold mb-2">{selectedSection.name}</h2>
              <p className="text-sm text-gray-400 mb-4">Red Rocks Amphitheatre</p>

              {/* Large Image */}
              <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden mb-4">
                {selectedSection.display_image_url ? (
                  <Image
                    src={selectedSection.display_image_url}
                    alt={selectedSection.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                    No image
                  </div>
                )}

                {/* Deal Badge */}
                {selectedSection.deal_badge && (
                  <div className="absolute top-2 left-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        selectedSection.deal_badge === 'cheapest'
                          ? 'bg-pink-600'
                          : 'bg-green-600'
                      }`}
                    >
                      {selectedSection.deal_badge === 'cheapest' ? '🔥 CHEAPEST' : '⭐ AMAZING DEAL'}
                    </span>
                  </div>
                )}
              </div>

              {/* Date & Tickets */}
              <div className="flex items-center gap-3 mb-4 text-sm">
                <div className="flex items-center gap-2 bg-gray-900 px-3 py-2 rounded">
                  <span>📅</span>
                  <span>Fri 6/3/26 · 8:00 PM</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-900 px-3 py-2 rounded">
                  <span>👥</span>
                  <span>2</span>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold">${selectedSection.price}</span>
                  <span className="text-sm text-gray-400">/ea</span>
                </div>
                <div className="text-xs text-gray-400">Includes Fees</div>
                <div className="text-xs text-gray-500 mt-1">
                  4 interest-free payments or as low as $29/mo with Affirm
                </div>
              </div>

              {/* Section Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-gray-400">🎫</span>
                  <div>
                    <div className="font-semibold text-sm">2 Seats Together</div>
                    <div className="text-xs text-gray-400">
                      Selected from seats {selectedSection.section_code} · {selectedSection.row_info || 'Row GA'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-gray-400">✓</span>
                  <div>
                    <div className="font-semibold text-sm">Gametime Best Price Guarantee</div>
                    <div className="text-xs text-gray-400">
                      If you find a seat for less on any site (before fees), we'll refund 110% of the difference
                    </div>
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <button className="w-full py-3 bg-green-500 hover:bg-green-600 rounded-lg font-bold transition-colors">
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Right Panel - Venue Map */}
        <div className="flex-1 relative bg-gray-900 overflow-hidden hidden md:block">
          <Image
            src="/sections/map.png"
            alt="Red Rocks Amphitheatre Map"
            fill
            className="object-contain"
            priority
          />

          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-1 bg-white rounded-lg shadow-xl overflow-hidden z-10">
            <button className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors border-b border-gray-200">
              <span className="text-2xl text-gray-700 font-normal leading-none">+</span>
            </button>
            <button className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors border-b border-gray-200">
              <span className="text-2xl text-gray-700 font-normal leading-none">−</span>
            </button>
            <button className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
