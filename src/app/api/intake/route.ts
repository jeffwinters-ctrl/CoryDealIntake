import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contact_name,
      company_name,
      email,
      phone,
      state,
      loan_amount,
      loan_purpose,
      collateral_type,
      collateral_description,
      deal_description,
    } = body;

    if (!contact_name || !email || !loan_amount || !loan_purpose || !collateral_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: borrower, error: borrowerErr } = await supabase
      .from('borrowers')
      .insert({
        contact_name: contact_name.trim(),
        company_name: company_name?.trim() || null,
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        state: state || null,
      })
      .select()
      .single();

    if (borrowerErr) {
      return NextResponse.json({ error: borrowerErr.message }, { status: 500 });
    }

    const { data: deal, error: dealErr } = await supabase
      .from('deals')
      .insert({
        borrower_id: borrower.id,
        loan_amount: Number(String(loan_amount).replace(/[,$\s]/g, '')),
        loan_purpose: loan_purpose.trim(),
        collateral_type,
        collateral_description: collateral_description?.trim() || null,
        deal_description: deal_description?.trim() || null,
      })
      .select()
      .single();

    if (dealErr) {
      return NextResponse.json({ error: dealErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reference_number: deal.reference_number,
      upload_token: deal.upload_token,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
