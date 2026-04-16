'use client';

import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="btn-primary flex items-center gap-2"
    >
      <Printer className="w-4 h-4" />
      Print / Save as PDF
    </button>
  );
}
