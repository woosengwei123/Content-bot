import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface GenerateRequest {
  clientId: string;
  platform: string;
  contentType: string;
  goal: string;
  tone: string;
  length: string;
  context?: string;
}

interface ScoreJson {
  variety: number;
  hook: number;
  clarity: number;
  cta: number;
  emotion: number;
  authority: number;
  virality: number;
  type: string;
  reach: 'Low' | 'Medium' | 'High' | 'Viral';
  why: string;
  tip: string;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Server is not configured with an Anthropic API key.' },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const body: GenerateRequest = await request.json();
  const { clientId, platform, contentType, goal, tone, length, context } = body;

  if (!clientId || !platform || !contentType || !goal) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: 'Client not found or not accessible.' }, { status: 404 });
  }

  const systemPrompt = `You are an elite marketing and technology content strategist. You write high-converting, scroll-stopping content for ${client.industry || 'business'} professionals targeting ${client.audience || 'business professionals'}. Write ONLY the content itself, no preamble. End with 3-5 relevant hashtags on the last line.`;

  const userPrompt = `Write a ${contentType} for ${platform}, optimised for ${goal}.
Industry: ${client.industry || 'general business'}
Audience: ${client.audience || 'business professionals'}
Brand voice notes: ${client.brand_voice || 'none specified'}
Tone: ${tone}
Length: ${length}
${context ? `Additional context: ${context}` : ''}

Make it feel written by a real professional, not AI. Be specific, use numbers or real scenarios where relevant.`;

  let contentText: string;
  try {
    const genRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!genRes.ok) {
      const errBody = await genRes.text();
      return NextResponse.json(
        { error: `Content generation failed: ${errBody}` },
        { status: 502 }
      );
    }

    const genData = await genRes.json();
    contentText = genData.content
      .filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('')
      .trim();
  } catch {
    return NextResponse.json({ error: 'Could not reach the generation service.' }, { status: 502 });
  }

  let score: ScoreJson | null = null;
  try {
    const scoreRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: 'You are a content performance analyst. Respond ONLY with valid JSON, no markdown fences, no explanation.',
        messages: [{
          role: 'user',
          content: `Score this ${platform} content for a ${client.industry || 'business'} brand targeting ${client.audience || 'business professionals'}.

Return ONLY this JSON shape:
{"variety":N,"hook":N,"clarity":N,"cta":N,"emotion":N,"authority":N,"virality":N,"type":"Exposure|Trust-building|Lead generation|Conversion|Engagement","reach":"Low|Medium|High|Viral","why":"two sentences on why this will perform","tip":"one specific actionable improvement"}

All N values are integers 0-100.

Content:
${contentText}`,
        }],
      }),
    });

    if (scoreRes.ok) {
      const scoreData = await scoreRes.json();
      const raw = scoreData.content
        .filter((b: { type: string }) => b.type === 'text')
        .map((b: { text: string }) => b.text)
        .join('')
        .replace(/```json|```/g, '')
        .trim();
      score = JSON.parse(raw);
    }
  } catch {
    score = null;
  }

  const title = contentText.split('\n')[0].slice(0, 80) || 'Untitled content';

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  const { data: saved, error: saveError } = await supabase
    .from('content_pieces')
    .insert({
      client_id: clientId,
      created_by: profile?.id ?? null,
      title,
      body: contentText,
      platform,
      content_type: contentType,
      goal,
      tone,
      status: 'draft',
      variety_score: score?.variety ?? null,
      hook_score: score?.hook ?? null,
      clarity_score: score?.clarity ?? null,
      cta_score: score?.cta ?? null,
      emotion_score: score?.emotion ?? null,
      authority_score: score?.authority ?? null,
      virality_score: score?.virality ?? null,
      predicted_reach: score?.reach ?? null,
      classification: score?.type ?? null,
      why_it_works: score?.why ?? null,
      improvement_tip: score?.tip ?? null,
    })
    .select()
    .single();

  if (saveError) {
    return NextResponse.json(
      { error: `Generated content but failed to save: ${saveError.message}`, content: contentText, score },
      { status: 207 }
    );
  }

  return NextResponse.json({ piece: saved });
}
