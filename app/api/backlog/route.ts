import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET all photos from backlog
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await (supabase as any)
      .from('photo_backlog')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching backlog photos:', error);
      return NextResponse.json(
        { error: 'Failed to fetch backlog photos' },
        { status: 500 }
      );
    }

    return NextResponse.json({ photos: data });
  } catch (error) {
    console.error('Error in GET /api/backlog:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
