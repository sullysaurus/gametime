'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
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

export default function HomePage() {
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSections()
  }, [])

  async function loadSections() {
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .order('price', { ascending: false })

    if (error) {
      console.error('Error loading sections:', error)
    } else {
      setSections(data || [])
    }
    setLoading(false)
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
      {/* Top Nav */}
      <div className="bg-black border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-2xl font-bold text-green-400">GAMETIME</div>
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>

      {/* Event Header */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-[57px] z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Jason Isbell And The 400 Unit</h1>
          <p className="text-gray-400">Red Rocks Amphitheatre</p>
          <div className="flex gap-4 mt-3 text-sm">
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>Sat 5/2/26 · 7:00 PM</span>
            </div>
            <div className="flex items-center gap-2">
              <span>👥</span>
              <span>2 Tickets</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="inline-block bg-white text-black px-4 py-1 rounded-full text-sm font-bold">
              Includes Fees
            </span>
          </div>
        </div>
      </div>

      {/* Ticket Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-6">Available Seats</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section) => (
            <div
              key={section.id}
              className="bg-gray-900 rounded-lg border border-gray-800 hover:border-green-500 transition-colors overflow-hidden cursor-pointer"
            >
              {/* Image */}
              <div className="relative h-48 bg-gray-800">
                {section.current_image_url ? (
                  <Image
                    src={section.current_image_url}
                    alt={section.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                    No image available
                  </div>
                )}

                {/* Badges Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {section.deal_badge && (
                    <div className="absolute top-2 left-2">
                      <span
                        className={`px-3 py-1 rounded-md text-xs font-bold ${
                          section.deal_badge === 'cheapest'
                            ? 'bg-pink-600'
                            : 'bg-green-600'
                        }`}
                      >
                        {section.deal_badge === 'cheapest' ? '🔥 CHEAPEST' : '⭐ AMAZING DEAL'}
                      </span>
                    </div>
                  )}
                  {section.value_badge && (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 rounded bg-black/80 text-xs font-bold backdrop-blur-sm">
                        {section.value_badge}
                      </span>
                    </div>
                  )}

                  {/* Bottom Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="font-bold text-white">{section.name}</div>
                        <div className="text-xs text-gray-300">
                          {section.section_code}
                          {section.row_info && `, ${section.row_info}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">
                          ${section.price}/ea
                        </div>
                        <div className="text-xs text-gray-300">Includes Fees</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 uppercase">Quantity</div>
            <div className="text-lg font-bold">2 Tickets</div>
          </div>
          <button className="px-8 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-bold transition-colors">
            CONTINUE →
          </button>
        </div>
      </div>
    </div>
  )
}
