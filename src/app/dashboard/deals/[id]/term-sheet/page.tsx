import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { ArrowLeft, Printer } from 'lucide-react';
import type { Deal, DealScore } from '@/types';
import { COLLATERAL_LABELS, STAGE_LABELS } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PrintButton } from '@/components/dashboard/PrintButton';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TermSheetPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: deal } = await supabase
    .from('deals')
    .select('*, borrower:borrowers(*), score:deal_scores(*)')
    .eq('id', id)
    .single();

  if (!deal) notFound();

  const d = deal as Deal;

  return (
    <div>
      {/* Controls (hidden on print) */}
      <div className="no-print">
        <Link
          href={`/dashboard/deals/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-brand-gold transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Deal
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Term Sheet</h1>
            <p className="text-slate-500 text-sm mt-1">
              {d.reference_number} -- Print or save as PDF with Ctrl+P / Cmd+P
            </p>
          </div>
          <PrintButton />
        </div>
      </div>

      {/* Term Sheet Content (print-friendly) */}
      <div className="bg-white text-black rounded-xl p-8 max-w-3xl mx-auto print:shadow-none print:rounded-none print:p-0 print:max-w-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-black">VISIONARY CAPITAL</h2>
            <p className="text-sm text-gray-600">Indicative Term Sheet</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-mono text-gray-600">{d.reference_number}</p>
            <p className="text-sm text-gray-500">{formatDate(new Date().toISOString())}</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 italic mb-6">
          This Indicative Term Sheet is for discussion purposes only and does not constitute a
          commitment to lend or a binding agreement. Final terms are subject to completion of due
          diligence, credit approval, and execution of definitive documentation.
        </p>

        {/* Key Terms Table */}
        <table className="w-full text-sm mb-6">
          <tbody>
            <TermRow label="Borrower" value={d.borrower?.company_name || d.borrower?.contact_name || 'TBD'} />
            <TermRow label="Contact" value={d.borrower?.contact_name || 'TBD'} />
            <TermRow label="Loan Amount" value={formatCurrency(d.loan_amount)} highlight />
            <TermRow label="Loan Purpose" value={d.loan_purpose} />
            <TermRow label="Collateral Type" value={COLLATERAL_LABELS[d.collateral_type]} />
            {d.collateral_description && (
              <TermRow label="Collateral Description" value={d.collateral_description} />
            )}
            <TermRow label="Interest Rate" value={d.interest_rate ? `${d.interest_rate}% per annum` : 'TBD'} />
            <TermRow label="Loan Term" value={d.term_months ? `${d.term_months} months` : 'TBD'} />
            <TermRow label="Repayment" value="Interest-only, balloon at maturity" />
            <TermRow
              label="Origination Fee"
              value={d.origination_fee ? `${d.origination_fee}% of loan amount` : 'TBD'}
            />
            <TermRow label="Security" value={getSecurityDescription(d)} />
          </tbody>
        </table>

        {/* Conditions */}
        <div className="mb-6">
          <h3 className="text-base font-bold text-black mb-2">Conditions Precedent to Funding</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Completion of satisfactory due diligence</li>
            <li>Execution of definitive loan documentation</li>
            <li>Perfection of security interests in all pledged collateral</li>
            <li>Delivery of all required insurance certificates</li>
            <li>Personal guarantee of principal(s)</li>
            <li>No material adverse change in borrower&apos;s financial condition</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-300 pt-4 mt-8">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs text-gray-500 mb-8">Accepted and agreed by Borrower:</p>
              <div className="border-b border-gray-400 mb-1" />
              <p className="text-xs text-gray-600">
                {d.borrower?.contact_name || 'Name'}
              </p>
              <p className="text-xs text-gray-500">Date: ________________</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-8">On behalf of Visionary Capital:</p>
              <div className="border-b border-gray-400 mb-1" />
              <p className="text-xs text-gray-600">Authorized Signatory</p>
              <p className="text-xs text-gray-500">Date: ________________</p>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-gray-400 mt-8 text-center">
          CONFIDENTIAL -- This document is proprietary to Visionary Capital and is intended solely
          for the use of the intended recipient.
        </p>
      </div>
    </div>
  );
}

function TermRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <tr className="border-b border-gray-200">
      <td className="py-2.5 pr-4 font-semibold text-gray-800 w-48 align-top">{label}</td>
      <td className={`py-2.5 ${highlight ? 'font-bold text-black text-base' : 'text-gray-700'}`}>
        {value}
      </td>
    </tr>
  );
}

function getSecurityDescription(deal: Deal): string {
  const parts: string[] = [];
  const type = COLLATERAL_LABELS[deal.collateral_type];
  parts.push(`First priority lien/security interest in ${type.toLowerCase()}`);
  if (deal.collateral_type !== 'personal_guarantee') {
    parts.push('personal guarantee of principal(s)');
  }
  return parts.join(', plus ');
}
