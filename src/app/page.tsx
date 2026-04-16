import Link from 'next/link';
import { ArrowRight, Shield, Clock, FileText } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <header className="border-b border-brand-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-gold rounded-lg flex items-center justify-center">
              <span className="text-brand-bg font-bold text-lg">VC</span>
            </div>
            <span className="text-xl font-semibold text-white">Visionary Capital</span>
          </div>
          <Link
            href="/login"
            className="text-sm text-slate-400 hover:text-brand-gold transition-colors"
          >
            Team Login
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6">
        <div className="pt-20 pb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Submit Your Deal in<br />
            <span className="text-brand-gold">Under 2 Minutes</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
            Visionary Capital provides agile private credit solutions for unique situations.
            Tell us about your deal and we will move fast.
          </p>
          <Link
            href="/intake"
            className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
          >
            Start Your Application
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Value Props */}
        <div className="grid md:grid-cols-3 gap-6 pb-20">
          <div className="card text-center">
            <div className="w-12 h-12 bg-brand-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-brand-gold" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Rapid Response</h3>
            <p className="text-slate-400 text-sm">
              We review every submission within 24-48 hours and move at the speed of opportunity.
            </p>
          </div>
          <div className="card text-center">
            <div className="w-12 h-12 bg-brand-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-brand-gold" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Secure & Confidential</h3>
            <p className="text-slate-400 text-sm">
              Your documents and deal information are encrypted and stored securely.
            </p>
          </div>
          <div className="card text-center">
            <div className="w-12 h-12 bg-brand-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-brand-gold" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Creative Structures</h3>
            <p className="text-slate-400 text-sm">
              We work with traditional and non-traditional collateral to get your deal done.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-border py-6">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} Visionary Capital. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
