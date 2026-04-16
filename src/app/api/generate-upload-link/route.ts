import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { deal_id } = await request.json();

    if (!deal_id) {
      return NextResponse.json({ error: 'deal_id is required' }, { status: 400 });
    }

    const { data: deal } = await supabase
      .from('deals')
      .select('upload_token')
      .eq('id', deal_id)
      .single();

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const origin = request.headers.get('origin') || request.nextUrl.origin;
    const uploadLink = `${origin}/upload/${deal.upload_token}`;

    return NextResponse.json({ upload_link: uploadLink });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
