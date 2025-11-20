'use client'

import { useState } from 'react'

type Props = {
  onClose: () => void
}

export default function SettingsSidebar({ onClose }: Props) {
  const [migrationStatus, setMigrationStatus] = useState<any>(null)
  const [migrating, setMigrating] = useState(false)
  const [storageTest, setStorageTest] = useState<any>(null)

  async function checkMigrationStatus() {
    try {
      const response = await fetch('/api/migrate-images-to-storage')
      const data = await response.json()
      setMigrationStatus(data)
    } catch (error) {
      console.error('Failed to check migration status:', error)
    }
  }

  async function runMigration() {
    if (!confirm('Migrate all base64 images to Supabase Storage? This will process 10 images at a time.')) {
      return
    }

    setMigrating(true)
    try {
      const response = await fetch('/api/migrate-images-to-storage', {
        method: 'POST'
      })
      const data = await response.json()
      alert(`Migration complete: ${data.migrated} images migrated, ${data.failed} failed`)
      await checkMigrationStatus()
    } catch (error) {
      console.error('Migration failed:', error)
      alert('Migration failed')
    } finally {
      setMigrating(false)
    }
  }

  async function testStorage() {
    try {
      const response = await fetch('/api/storage-test')
      const data = await response.json()
      setStorageTest(data)
    } catch (error) {
      console.error('Storage test failed:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end">
      <div className="w-full max-w-md h-full bg-gray-900 border-l border-gray-800 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 hover:bg-gray-800 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Storage Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-300">🗄️ Storage</h3>

            {/* Storage Test */}
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Storage Status</span>
                <button
                  onClick={testStorage}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors"
                >
                  Test Connection
                </button>
              </div>

              {storageTest && (
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={storageTest.success ? 'text-green-400' : 'text-red-400'}>
                      {storageTest.success ? '✅' : '❌'}
                    </span>
                    <span>{storageTest.recommendation || storageTest.error}</span>
                  </div>
                  {storageTest.uploadTest && (
                    <div className="text-gray-400">
                      Upload test: {storageTest.uploadTest.success ? '✅ Working' : '❌ Failed'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Migration Tool */}
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Image Migration</span>
                <button
                  onClick={checkMigrationStatus}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
                >
                  Check Status
                </button>
              </div>

              {migrationStatus && (
                <div className="text-xs space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-700 rounded p-2">
                      <div className="text-gray-400">Total Images</div>
                      <div className="text-lg font-bold">{migrationStatus.total || 0}</div>
                    </div>
                    <div className="bg-gray-700 rounded p-2">
                      <div className="text-gray-400">Using Storage</div>
                      <div className="text-lg font-bold text-green-400">{migrationStatus.storage || 0}</div>
                    </div>
                    <div className="bg-gray-700 rounded p-2">
                      <div className="text-gray-400">Base64 (old)</div>
                      <div className="text-lg font-bold text-yellow-400">{migrationStatus.base64 || 0}</div>
                    </div>
                    <div className="bg-gray-700 rounded p-2">
                      <div className="text-gray-400">Service Key</div>
                      <div className="text-lg">{migrationStatus.serviceRoleConfigured ? '✅' : '❌'}</div>
                    </div>
                  </div>

                  {migrationStatus.needsMigration && (
                    <button
                      onClick={runMigration}
                      disabled={migrating}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-sm font-medium transition-colors"
                    >
                      {migrating ? 'Migrating...' : `Migrate ${migrationStatus.base64} Images`}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-300">⚡ Quick Actions</h3>

            <div className="bg-gray-800 rounded-lg p-4 space-y-2">
              <button
                onClick={() => window.open('/api/storage-test', '_blank')}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors text-left"
              >
                📊 View Storage Diagnostics
              </button>

              <button
                onClick={() => {
                  if (confirm('This will reload all sections and images. Continue?')) {
                    window.location.reload()
                  }
                }}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors text-left"
              >
                🔄 Reload Admin Page
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-300">ℹ️ Information</h3>

            <div className="bg-gray-800 rounded-lg p-4 text-xs text-gray-400 space-y-2">
              <div>
                <strong className="text-gray-300">Storage Format:</strong> WebP (80% quality)
              </div>
              <div>
                <strong className="text-gray-300">Max Size:</strong> 2048px
              </div>
              <div>
                <strong className="text-gray-300">Bucket:</strong> generated-images
              </div>
              <div>
                <strong className="text-gray-300">Cache:</strong> 1 year
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
