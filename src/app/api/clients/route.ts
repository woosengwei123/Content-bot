import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PLAN_LIMITS, type Plan } from '@/lib/types';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('workspace_id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 });
  }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('plan')
    .eq('id', profile.workspace_id)
    .single();

  const plan = (workspace?.plan ?? 'free') as Plan;
  const limit = PLAN_LIMITS[plan].clients;

  const { count } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', profile.workspace_id);

  if ((count ?? 0) >= limit) {
    return NextResponse.json(
      { error: `Your ${plan} plan allows up to ${limit} client${limit === 1 ? '' : 's'}. Upgrade your plan to add more.` },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { name, industry, audience, brand_voice, avatar_label, avatar_color } = body;

  if (!name) {
    return NextResponse.json({ error: 'Client name is required.' }, { status: 400 });
  }

  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      workspace_id: profile.workspace_id,
      name,
      industry: industry ?? null,
      audience: audience ?? null,
      brand_voice: brand_voice ?? null,
      avatar_label: avatar_label ?? name.slice(0, 2).toUpperCase(),
      avatar_color: avatar_color ?? 'blue',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ client });
}
