'use client';

import { useState } from 'react';

const COLOR_OPTIONS = ['blue', 'green', 'amber', 'coral', 'purple'];

export default function AddClientModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [audience, setAudience] = useState('');
  const [brandVoice, setBrandVoice] = useState('');
  const [color, setColor] = useState('blue');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!name.trim()) {
      setError('Client name is required.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          industry,
          audience,
          brand_voice: brandVoice,
          avatar_label: name.slice(0, 2).toUpperCase(),
          avatar_color: color,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setLoading(false);
        return;
      }

      onCreated();
    } catch {
      setError('Could not reach the server. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-medium text-neutral-900">Add a client</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 text-xl leading-none">
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Client name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
              placeholder="e.g. Axiom Consulting"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Industry</label>
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
              placeholder="e.g. Business consulting"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Target audience</label>
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
              placeholder="e.g. SME owners"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Brand voice notes (optional)</label>
            <textarea
              value={brandVoice}
              onChange={(e) => setBrandVoice(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm resize-none"
              placeholder="Anything distinctive about how this client communicates…"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Color tag</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 ${color === c ? 'border-neutral-900' : 'border-transparent'}`}
                  style={{
                    background: { blue: '#85B7EB', green: '#97C459', amber: '#EF9F27', coral: '#F0997B', purple: '#AFA9EC' }[c],
                  }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-neutral-900 text-white rounded-md py-2.5 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? 'Adding…' : 'Add client'}
          </button>
        </div>
      </div>
    </div>
  );
}
