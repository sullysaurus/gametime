import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { status, notes } = body

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const updateData: any = {
      status,
      comparison_notes: notes || null,
    }

    // Set timestamp based on status
    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString()
      updateData.rejected_at = null
    } else if (status === 'rejected') {
      updateData.rejected_at = new Date().toISOString()
      updateData.approved_at = null
    }

    const { data, error } = await (supabase as any)
      .from('generated_images')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    // If approved, update the section's current_image_url
    if (status === 'approved' && data.section_id) {
      await (supabase as any)
        .from('sections')
        .update({
          current_image_url: data.image_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.section_id)
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Status update error:', error)
    const message = error instanceof Error ? error.message : 'Failed to update status'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
