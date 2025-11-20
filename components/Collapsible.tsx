'use client'

import { useState, ReactNode } from 'react'

type Props = {
  title: string
  description?: string
  defaultOpen?: boolean
  badge?: string
  children: ReactNode
}

export default function Collapsible({
  title,
  description,
  defaultOpen = false,
  badge,
  children
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{title}</h2>
              {badge && (
                <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                  {badge}
                </span>
              )}
            </div>
            {description && (
              <p className="text-sm text-gray-400 mt-1">{description}</p>
            )}
          </div>
        </div>
        <div className="text-gray-400">
          <svg
            className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 pt-2">
          {children}
        </div>
      )}
    </div>
  )
}
