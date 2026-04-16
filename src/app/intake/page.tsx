'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { CollateralType } from '@/types';
import { COLLATERAL_LABELS } from '@/types';

const STEPS = ['Contact Info', 'Deal Details', 'Review & Submit'];

interface IntakeForm {
  contact_name: string;
  company_name: string;
  email: string;
  phone: string;
  state: string;
  loan_amount: string;
  loan_purpose: string;
  collateral_type: CollateralType | '';
  collateral_description: string;
  deal_description: string;
}

const INITIAL_FORM: IntakeForm = {
  contact_name: '',
  company_name: '',
  email: '',
  phone: '',
  state: '',
  loan_amount: '',
  loan_purpose: '',
  collateral_type: '',
  collateral_description: '',
  deal_description: '',
};

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

export default function IntakePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<IntakeForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function updateField(field: keyof IntakeForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  }

  function validateStep(): boolean {
    if (step === 0) {
      if (!form.contact_name.trim()) { setError('Please enter your name.'); return false; }
      if (!form.email.trim() || !form.email.includes('@')) { setError('Please enter a valid email.'); return false; }
    }
    if (step === 1) {
      if (!form.loan_amount.trim() || isNaN(Number(form.loan_amount.replace(/[,$]/g, '')))) {
        setError('Please enter a valid loan amount.'); return false;
      }
      if (!form.loan_purpose.trim()) { setError('Please describe the loan purpose.'); return false; }
      if (!form.collateral_type) { setError('Please select a collateral type.'); return false; }
    }
    return true;
  }

  function nextStep() {
    if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 0));
    setError('');
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    setSubmitting(true);
    setError('');

    try {
      const supabase = createClient();

      const { data: borrower, error: borrowerErr } = await supabase
        .from('borrowers')
        .insert({
          contact_name: form.contact_name.trim(),
          company_name: form.company_name.trim() || null,
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || null,
          state: form.state || null,
        })
        .select()
        .single();

      if (borrowerErr) throw borrowerErr;

      const loanAmount = Number(form.loan_amount.replace(/[,$\s]/g, ''));

      const { data: deal, error: dealErr } = await supabase
        .from('deals')
        .insert({
          borrower_id: borrower.id,
          loan_amount: loanAmount,
          loan_purpose: form.loan_purpose.trim(),
          collateral_type: form.collateral_type,
          collateral_description: form.collateral_description.trim() || null,
          deal_description: form.deal_description.trim() || null,
        })
        .select()
        .single();

      if (dealErr) throw dealErr;

      router.push(`/intake/confirmation?ref=${deal.reference_number}&token=${deal.upload_token}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <header className="border-b border-brand-border">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-brand-gold rounded-lg flex items-center justify-center">
              <span className="text-brand-bg font-bold text-sm">VC</span>
            </div>
            <span className="text-lg font-semibold text-white">Visionary Capital</span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-2">Submit Your Deal</h1>
        <p className="text-slate-400 mb-8">Quick and simple. We will be in touch within 24-48 hours.</p>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 transition-colors ${
                    i < step
                      ? 'bg-brand-gold text-brand-bg'
                      : i === step
                      ? 'bg-brand-gold/20 text-brand-gold border-2 border-brand-gold'
                      : 'bg-brand-surface text-slate-500 border border-brand-border'
                  }`}
                >
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={`text-sm hidden sm:block ${
                    i <= step ? 'text-slate-200' : 'text-slate-500'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px flex-1 ${
                    i < step ? 'bg-brand-gold' : 'bg-brand-border'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Contact Info */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Full Name <span className="text-brand-gold">*</span>
              </label>
              <input
                type="text"
                className="input-base"
                placeholder="John Smith"
                value={form.contact_name}
                onChange={(e) => updateField('contact_name', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                className="input-base"
                placeholder="Acme Corp (optional)"
                value={form.company_name}
                onChange={(e) => updateField('company_name', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Email <span className="text-brand-gold">*</span>
                </label>
                <input
                  type="email"
                  className="input-base"
                  placeholder="john@company.com"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone</label>
                <input
                  type="tel"
                  className="input-base"
                  placeholder="(555) 123-4567"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">State</label>
              <select
                className="input-base"
                value={form.state}
                onChange={(e) => updateField('state', e.target.value)}
              >
                <option value="">Select state (optional)</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Deal Details */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Loan Amount Requested <span className="text-brand-gold">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <input
                  type="text"
                  className="input-base pl-8"
                  placeholder="1,000,000"
                  value={form.loan_amount}
                  onChange={(e) => updateField('loan_amount', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Loan Purpose / Use of Funds <span className="text-brand-gold">*</span>
              </label>
              <input
                type="text"
                className="input-base"
                placeholder="Working capital, bridge loan, inventory purchase..."
                value={form.loan_purpose}
                onChange={(e) => updateField('loan_purpose', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Primary Collateral Type <span className="text-brand-gold">*</span>
              </label>
              <select
                className="input-base"
                value={form.collateral_type}
                onChange={(e) => updateField('collateral_type', e.target.value)}
              >
                <option value="">Select collateral type</option>
                {Object.entries(COLLATERAL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Collateral Description
              </label>
              <textarea
                className="input-base min-h-[80px] resize-y"
                placeholder="Brief description of the collateral (optional)"
                value={form.collateral_description}
                onChange={(e) => updateField('collateral_description', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Deal Description
              </label>
              <textarea
                className="input-base min-h-[100px] resize-y"
                placeholder="Anything else we should know about this deal? (optional)"
                value={form.deal_description}
                onChange={(e) => updateField('deal_description', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="card space-y-4">
              <h3 className="text-lg font-semibold text-white">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Name</span>
                  <p className="text-slate-200">{form.contact_name}</p>
                </div>
                <div>
                  <span className="text-slate-500">Company</span>
                  <p className="text-slate-200">{form.company_name || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Email</span>
                  <p className="text-slate-200">{form.email}</p>
                </div>
                <div>
                  <span className="text-slate-500">Phone</span>
                  <p className="text-slate-200">{form.phone || '—'}</p>
                </div>
                {form.state && (
                  <div>
                    <span className="text-slate-500">State</span>
                    <p className="text-slate-200">{form.state}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card space-y-4">
              <h3 className="text-lg font-semibold text-white">Deal Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Loan Amount</span>
                  <p className="text-slate-200 text-lg font-semibold">
                    ${Number(form.loan_amount.replace(/[,$\s]/g, '')).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Collateral Type</span>
                  <p className="text-slate-200">
                    {form.collateral_type ? COLLATERAL_LABELS[form.collateral_type] : '—'}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">Loan Purpose</span>
                  <p className="text-slate-200">{form.loan_purpose}</p>
                </div>
                {form.collateral_description && (
                  <div className="col-span-2">
                    <span className="text-slate-500">Collateral Description</span>
                    <p className="text-slate-200">{form.collateral_description}</p>
                  </div>
                )}
                {form.deal_description && (
                  <div className="col-span-2">
                    <span className="text-slate-500">Deal Description</span>
                    <p className="text-slate-200">{form.deal_description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-brand-border">
          {step > 0 ? (
            <button onClick={prevStep} className="btn-secondary flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <Link href="/" className="btn-secondary flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Home
            </Link>
          )}

          {step < STEPS.length - 1 ? (
            <button onClick={nextStep} className="btn-primary flex items-center gap-2">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                'Submit Deal'
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
