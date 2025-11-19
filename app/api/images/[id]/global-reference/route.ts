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
    const { is_global_reference } = body

    if (typeof is_global_reference !== 'boolean') {
      return NextResponse.json(
        { error: 'is_global_reference must be a boolean' },
        { status: 400 }
      )
    }

    const { data, error } = await (supabase as any)
      .from('generated_images')
      .update({ is_global_reference })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Global reference update error:', error)
    const message = error instanceof Error ? error.message : 'Failed to update global reference'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
