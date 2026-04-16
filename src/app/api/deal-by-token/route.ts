import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: deal, error } = await supabase
      .from('deals')
      .select('id, reference_number, loan_amount, collateral_type, secondary_collateral_type, upload_token')
      .eq('upload_token', token)
      .single();

    if (error || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const { data: docs } = await supabase
      .from('documents')
      .select('id, file_name, file_size, created_at')
      .eq('deal_id', deal.id)
      .eq('uploaded_by_borrower', true)
      .order('created_at', { ascending: false });

    return NextResponse.json({ deal, documents: docs || [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
