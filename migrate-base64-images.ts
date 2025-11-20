#!/usr/bin/env tsx

/**
 * Migration script to convert base64 images to Supabase Storage
 *
 * Usage:
 *   npx tsx migrate-base64-images.ts          # Check status only
 *   npx tsx migrate-base64-images.ts migrate  # Run migration
 */

async function checkStatus() {
  console.log('Checking migration status...\n')

  const response = await fetch('http://localhost:3000/api/migrate-images-to-storage')
  const data = await response.json()

  console.log('📊 Current Status:')
  console.log(`   Total images: ${data.total}`)
  console.log(`   Base64 images: ${data.base64}`)
  console.log(`   Storage images: ${data.storage}`)
  console.log(`   Service role configured: ${data.serviceRoleConfigured ? '✅' : '❌'}\n`)

  if (!data.serviceRoleConfigured) {
    console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY is not configured!')
    console.log('   Add it to .env.local to enable storage uploads\n')
    return false
  }

  if (data.needsMigration) {
    console.log(`⚠️  ${data.base64} images need migration to storage`)
    console.log('   Run: npx tsx migrate-base64-images.ts migrate\n')
  } else {
    console.log('✅ All images are using Supabase Storage!\n')
  }

  return data.serviceRoleConfigured
}

async function runMigration() {
  console.log('Starting migration...\n')

  let totalMigrated = 0
  let iterations = 0
  const maxIterations = 100 // Safety limit

  while (iterations < maxIterations) {
    iterations++

    const response = await fetch('http://localhost:3000/api/migrate-images-to-storage', {
      method: 'POST'
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Migration error:', data.error)
      break
    }

    if (data.migrated === 0) {
      console.log('\n✅ Migration complete!')
      console.log(`   Total migrated: ${totalMigrated} images\n`)
      break
    }

    totalMigrated += data.migrated
    console.log(`✓ Batch ${iterations}: Migrated ${data.migrated} images (${data.failed} failed)`)

    if (data.results) {
      data.results.forEach((result: any) => {
        if (!result.success) {
          console.log(`  ⚠️  Failed: ${result.id} - ${result.error}`)
        }
      })
    }

    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Final status check
  await checkStatus()
}

async function main() {
  const command = process.argv[2]

  if (command === 'migrate') {
    const canMigrate = await checkStatus()
    if (!canMigrate) {
      console.log('Cannot migrate: Service role key not configured')
      process.exit(1)
    }

    console.log('Starting migration in 3 seconds...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    await runMigration()
  } else {
    await checkStatus()
  }
}

main().catch(console.error)
