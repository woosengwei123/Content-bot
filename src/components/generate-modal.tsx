'use client';

import { useState } from 'react';
import type { Client } from '@/lib/types';

export default function GenerateModal({
  client,
  onClose,
  onGenerated,
}: {
  client: Client;
  onClose: () => void;
  onGenerated: () => void;
}) {
  const [platform, setPlatform] = useState('LinkedIn');
  const [contentType, setContentType] = useState('Hook post');
  const [goal, setGoal] = useState('building trust and authority');
  const [tone, setTone] = useState('Professional & authoritative');
  const [length, setLength] = useState('medium (200-350 words)');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          platform,
          contentType,
          goal,
          tone,
          length,
          context,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      onGenerated();
    } catch {
      setError('Could not reach the server. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-medium text-neutral-900">New content for {client.name}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 text-xl leading-none">
            ×
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Platform">
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="select">
              <option>LinkedIn</option>
              <option>Instagram</option>
              <option>TikTok</option>
              <option>Twitter/X</option>
              <option>YouTube</option>
              <option>Newsletter</option>
              <option>Blog</option>
            </select>
          </Field>

          <Field label="Content type">
            <select value={contentType} onChange={(e) => setContentType(e.target.value)} className="select">
              <option>Hook post</option>
              <option>Thought leadership</option>
              <option>Video script</option>
              <option>Carousel / tips</option>
              <option>Case study</option>
              <option>Lead magnet CTA</option>
              <option>Cold outreach DM</option>
            </select>
          </Field>

          <Field label="Goal">
            <select value={goal} onChange={(e) => setGoal(e.target.value)} className="select">
              <option value="brand awareness and virality">Brand awareness & virality</option>
              <option value="building trust and authority">Trust & authority</option>
              <option value="lead generation">Lead generation</option>
              <option value="sales conversion">Sales & conversion</option>
              <option value="thought leadership">Thought leadership</option>
              <option value="community engagement">Engagement</option>
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tone">
              <select value={tone} onChange={(e) => setTone(e.target.value)} className="select">
                <option>Professional & authoritative</option>
                <option>Bold & contrarian</option>
                <option>Conversational & relatable</option>
                <option>Data-driven & analytical</option>
                <option>Inspiring & visionary</option>
              </select>
            </Field>
            <Field label="Length">
              <select value={length} onChange={(e) => setLength(e.target.value)} className="select">
                <option value="short (under 150 words)">Short</option>
                <option value="medium (200-350 words)">Medium</option>
                <option value="long (400-600 words)">Long</option>
              </select>
            </Field>
          </div>

          <Field label="Context (optional)">
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={2}
              className="select resize-none"
              placeholder="Recent win, stat, story to feature…"
            />
          </Field>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-neutral-900 text-white rounded-md py-2.5 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? 'Generating…' : 'Generate content'}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .select {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d4d4d4;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
