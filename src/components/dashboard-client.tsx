'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Client, ContentPiece, Workspace } from '@/lib/types';
import GenerateModal from './generate-modal';
import AddClientModal from './add-client-modal';

const AVATAR_COLORS: Record<string, { bg: string; fg: string }> = {
  blue: { bg: '#E6F1FB', fg: '#0C447C' },
  green: { bg: '#EAF3DE', fg: '#3B6D11' },
  amber: { bg: '#FAEEDA', fg: '#854F0B' },
  coral: { bg: '#FAECE7', fg: '#993C1D' },
  purple: { bg: '#EEEDFE', fg: '#3C3489' },
};

function scoreColor(score: number) {
  if (score >= 85) return '#1D9E75';
  if (score >= 70) return '#185FA5';
  if (score >= 55) return '#BA7517';
  return '#D85A30';
}

const TYPE_COLORS: Record<string, { bg: string; fg: string }> = {
  'Trust-building': { bg: '#E6F1FB', fg: '#0C447C' },
  'Lead generation': { bg: '#EAF3DE', fg: '#3B6D11' },
  Engagement: { bg: '#FAEEDA', fg: '#854F0B' },
  Conversion: { bg: '#FAECE7', fg: '#993C1D' },
  Exposure: { bg: '#F1EFE8', fg: '#5F5E5A' },
};

export default function DashboardClient({
  workspace,
  clients,
  contentPieces,
}: {
  workspace: Workspace;
  clients: Client[];
  contentPieces: ContentPiece[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [currentClientId, setCurrentClientId] = useState<string | null>(clients[0]?.id ?? null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);

  const currentClient = clients.find((c) => c.id === currentClientId) ?? null;

  const clientContent = useMemo(
    () => contentPieces.filter((p) => p.client_id === currentClientId),
    [contentPieces, currentClientId]
  );

  const stats = useMemo(() => {
    const scored = clientContent.filter((p) => p.variety_score != null);
    const avgScore = scored.length
      ? Math.round(scored.reduce((sum, p) => sum + (p.variety_score ?? 0), 0) / scored.length)
      : 0;
    const highReach = clientContent.filter(
      (p) => p.predicted_reach === 'High' || p.predicted_reach === 'Viral'
    ).length;
    const leadGen = clientContent.filter((p) => p.classification === 'Lead generation').length;
    return { avgScore, highReach, leadGen, total: clientContent.length };
  }, [clientContent]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  if (clients.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Topbar workspaceName={workspace.name} onSignOut={handleSignOut} />
        <div className="max-w-md mx-auto text-center py-24 px-4">
          <h2 className="text-lg font-medium text-neutral-900 mb-2">Add your first client</h2>
          <p className="text-sm text-neutral-500 mb-6">
            Each client gets their own content history, scores, and strategy. Add one to get started.
          </p>
          <button
            onClick={() => setShowAddClient(true)}
            className="bg-neutral-900 text-white rounded-md px-4 py-2.5 text-sm font-medium hover:bg-neutral-800"
          >
            Add a client
          </button>
        </div>
        {showAddClient && (
          <AddClientModal
            onClose={() => setShowAddClient(false)}
            onCreated={() => {
              setShowAddClient(false);
              router.refresh();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Topbar
        workspaceName={workspace.name}
        onSignOut={handleSignOut}
        onGenerate={() => setShowGenerate(true)}
      />

      <div className="border-b border-neutral-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex gap-2 overflow-x-auto">
          {clients.map((client) => {
            const colors = AVATAR_COLORS[client.avatar_color] ?? AVATAR_COLORS.blue;
            const active = client.id === currentClientId;
            return (
              <button
                key={client.id}
                onClick={() => setCurrentClientId(client.id)}
                className={`flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-full border whitespace-nowrap flex-shrink-0 ${
                  active ? 'border-neutral-300 bg-neutral-100' : 'border-neutral-200'
                }`}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0"
                  style={{ background: colors.bg, color: colors.fg }}
                >
                  {client.avatar_label}
                </span>
                <span className="text-sm font-medium text-neutral-900">{client.name}</span>
              </button>
            );
          })}
          <button
            onClick={() => setShowAddClient(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-dashed border-neutral-300 text-neutral-400 text-sm whitespace-nowrap flex-shrink-0"
          >
            + Add client
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {currentClient && (
          <>
            <div className="bg-neutral-100 rounded-xl p-6 mb-5 flex items-center justify-between gap-6 flex-wrap">
              <div className="flex-1 min-w-[240px]">
                <p className="text-xs text-neutral-500 mb-1">
                  {currentClient.industry || 'No industry set'} · {currentClient.audience || 'No audience set'}
                </p>
                <h2 className="text-lg font-medium text-neutral-900 mb-2">
                  How {currentClient.name} is doing
                </h2>
                <p className="text-sm text-neutral-500 max-w-md">
                  {stats.total === 0
                    ? 'No content yet — generate your first piece to see scores here.'
                    : `${stats.highReach} of ${stats.total} pieces are landing in the high-reach zone this period.`}
                </p>
              </div>
              <div className="text-center flex-shrink-0">
                <div className="relative w-20 h-20 mx-auto mb-1.5">
                  <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="white" strokeWidth="7" />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      fill="none"
                      stroke={scoreColor(stats.avgScore)}
                      strokeWidth="7"
                      strokeDasharray={`${Math.round(stats.avgScore * 2.14)} 214`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-lg font-medium text-neutral-900">
                    {stats.avgScore}%
                  </div>
                </div>
                <p className="text-xs text-neutral-500">avg score</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <StatCard label="posts total" value={stats.total} />
              <StatCard label="high-reach pieces" value={stats.highReach} />
              <StatCard label="lead-gen posts" value={stats.leadGen} />
            </div>

            <h3 className="text-sm font-medium text-neutral-900 mb-3">Recent content</h3>
            {clientContent.length === 0 ? (
              <div className="text-center py-16 text-neutral-400 text-sm bg-white rounded-xl border border-neutral-200">
                No content yet for {currentClient.name}.
                <br />
                Click &quot;Create content&quot; to generate the first piece.
              </div>
            ) : (
              <div className="space-y-2.5">
                {clientContent.map((piece) => {
                  const colors = piece.classification
                    ? TYPE_COLORS[piece.classification] ?? TYPE_COLORS.Exposure
                    : TYPE_COLORS.Exposure;
                  return (
                    <div
                      key={piece.id}
                      className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-white border border-neutral-200"
                    >
                      <span
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
                        style={{ background: colors.bg, color: colors.fg }}
                      >
                        ✦
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">{piece.title}</p>
                        <p className="text-xs text-neutral-400">
                          {piece.platform} · {new Date(piece.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {piece.variety_score != null && (
                        <span
                          className="text-sm font-medium px-2.5 py-1 rounded-full flex-shrink-0"
                          style={{ background: '#F1EFE8', color: scoreColor(piece.variety_score) }}
                        >
                          {piece.variety_score}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {showGenerate && currentClient && (
        <GenerateModal
          client={currentClient}
          onClose={() => setShowGenerate(false)}
          onGenerated={() => {
            setShowGenerate(false);
            router.refresh();
          }}
        />
      )}

      {showAddClient && (
        <AddClientModal
          onClose={() => setShowAddClient(false)}
          onCreated={() => {
            setShowAddClient(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function Topbar({
  workspaceName,
  onSignOut,
  onGenerate,
}: {
  workspaceName: string;
  onSignOut: () => void;
  onGenerate?: () => void;
}) {
  return (
    <div className="border-b border-neutral-200 bg-white">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center text-sm font-medium">
            CB
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900 leading-tight">ContentBot Pro</p>
            <p className="text-xs text-neutral-400 leading-tight">{workspaceName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onGenerate && (
            <button
              onClick={onGenerate}
              className="bg-neutral-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-neutral-800"
            >
              Create content
            </button>
          )}
          <button
            onClick={onSignOut}
            className="text-sm text-neutral-500 px-3 py-2 hover:text-neutral-900"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-neutral-100 rounded-xl p-4 text-center">
      <p className="text-xl font-medium text-neutral-900">{value}</p>
      <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
    </div>
  );
}
