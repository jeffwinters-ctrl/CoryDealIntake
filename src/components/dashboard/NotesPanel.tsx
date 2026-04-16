'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { DealNote } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { Send, Pin } from 'lucide-react';

export function NotesPanel({
  dealId,
  initialNotes,
}: {
  dealId: string;
  initialNotes: DealNote[];
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function addNote() {
    if (!newNote.trim()) return;
    setSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('deal_notes')
      .insert({
        deal_id: dealId,
        user_id: user.id,
        content: newNote.trim(),
      })
      .select('*, user:users(*)')
      .single();

    if (!error && data) {
      setNotes([data as DealNote, ...notes]);
      setNewNote('');
    }
    setSubmitting(false);
  }

  async function togglePin(noteId: string, currentPin: boolean) {
    const supabase = createClient();
    await supabase.from('deal_notes').update({ is_pinned: !currentPin }).eq('id', noteId);
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, is_pinned: !currentPin } : n))
    );
  }

  const pinned = notes.filter((n) => n.is_pinned);
  const unpinned = notes.filter((n) => !n.is_pinned);
  const sorted = [...pinned, ...unpinned];

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-white mb-4">Internal Notes</h3>

      {/* New Note */}
      <div className="flex gap-2 mb-4">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note..."
          className="input-base min-h-[60px] resize-y text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote();
          }}
        />
        <button
          onClick={addNote}
          disabled={submitting || !newNote.trim()}
          className="btn-primary px-3 self-end"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Notes List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sorted.map((note) => (
          <div
            key={note.id}
            className={`p-3 rounded-lg text-sm ${
              note.is_pinned
                ? 'bg-brand-gold/5 border border-brand-gold/20'
                : 'bg-brand-bg border border-brand-border'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-400">
                {note.user?.full_name || 'Team Member'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePin(note.id, note.is_pinned)}
                  className={`${note.is_pinned ? 'text-brand-gold' : 'text-slate-600 hover:text-slate-400'}`}
                >
                  <Pin className="w-3 h-3" />
                </button>
                <span className="text-xs text-slate-600">{formatDateTime(note.created_at)}</span>
              </div>
            </div>
            <p className="text-slate-300 whitespace-pre-wrap">{note.content}</p>
          </div>
        ))}
        {notes.length === 0 && (
          <p className="text-sm text-slate-600 text-center py-4">No notes yet.</p>
        )}
      </div>
    </div>
  );
}
