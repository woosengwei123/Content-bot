import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from '@/components/dashboard-client';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, workspaces(*)')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('workspace_id', profile.workspace_id)
    .order('created_at', { ascending: true });

  const clientIds = (clients ?? []).map((c) => c.id);

  const { data: contentPieces } = clientIds.length
    ? await supabase
        .from('content_pieces')
        .select('*')
        .in('client_id', clientIds)
        .order('created_at', { ascending: false })
    : { data: [] };

  return (
    <DashboardClient
      workspace={profile.workspaces}
      clients={clients ?? []}
      contentPieces={contentPieces ?? []}
    />
  );
}
