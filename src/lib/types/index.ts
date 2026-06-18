export type Plan = 'free' | 'pro' | 'agency';

export interface Workspace {
  id: string;
  name: string;
  plan: Plan;
  created_at: string;
}

export interface Profile {
  id: string;
  workspace_id: string;
  full_name: string | null;
  role: 'owner' | 'member';
  created_at: string;
}

export interface Client {
  id: string;
  workspace_id: string;
  name: string;
  industry: string | null;
  audience: string | null;
  brand_voice: string | null;
  avatar_label: string | null;
  avatar_color: string;
  created_at: string;
}

export type ContentStatus = 'draft' | 'scheduled' | 'published';
export type PredictedReach = 'Low' | 'Medium' | 'High' | 'Viral';

export interface ContentPiece {
  id: string;
  client_id: string;
  created_by: string | null;
  title: string;
  body: string;
  platform: string;
  content_type: string;
  goal: string;
  tone: string | null;
  status: ContentStatus;
  scheduled_for: string | null;
  variety_score: number | null;
  hook_score: number | null;
  clarity_score: number | null;
  cta_score: number | null;
  emotion_score: number | null;
  authority_score: number | null;
  virality_score: number | null;
  predicted_reach: PredictedReach | null;
  classification: string | null;
  why_it_works: string | null;
  improvement_tip: string | null;
  created_at: string;
}

export const PLAN_LIMITS: Record<Plan, { clients: number; generationsPerMonth: number }> = {
  free: { clients: 1, generationsPerMonth: 10 },
  pro: { clients: 5, generationsPerMonth: 150 },
  agency: { clients: 25, generationsPerMonth: 1000 },
};
