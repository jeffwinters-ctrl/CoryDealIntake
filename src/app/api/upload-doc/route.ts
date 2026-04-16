import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string;
    const file = formData.get('file') as File;

    if (!token || !file) {
      return NextResponse.json({ error: 'Token and file are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: deal } = await supabase
      .from('deals')
      .select('id')
      .eq('upload_token', token)
      .single();

    if (!deal) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    const filePath = `${deal.id}/${Date.now()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadErr } = await supabase.storage
      .from('deal-documents')
      .upload(filePath, buffer, { contentType: file.type });

    if (uploadErr) {
      return NextResponse.json({ error: uploadErr.message }, { status: 500 });
    }

    const { error: dbErr } = await supabase.from('documents').insert({
      deal_id: deal.id,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      category: 'Borrower Upload',
      uploaded_by_borrower: true,
      status: 'received',
    });

    if (dbErr) {
      return NextResponse.json({ error: 'Failed to save document metadata' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
