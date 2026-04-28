import { getData } from './client';

export type WorkTrack = {
  domain: string;
  title: string;
  core_tasks: string[];
  key_language_targets?: string[];
  speaking_scenarios?: string[];
  writing_tasks?: string[];
  vocabulary_clusters?: string[];
};

export type ProfessionalOverview = {
  tracks: WorkTrack[];
  recommendedTrack?: WorkTrack;
  nextMission: string;
};

export type IncidentScenario = {
  track: string;
  title: string;
  difficulty: 'guided' | 'standard' | 'pressured' | string;
  situation: string;
  language_targets?: string[];
  response_choices?: string[];
  best_response?: number;
  follow_up_task?: string;
  why: string;
};

export type IncidentLab = { track: string; scenarios: IncidentScenario[]; coaching_notes?: string[] };

export async function getProfessionalOverview(): Promise<ProfessionalOverview> {
  return getData('/api/v1/professional/overview');
}

export async function getWorkTracks(): Promise<WorkTrack[]> {
  const payload = await getData<{ tracks: WorkTrack[] }>('/api/v1/learning/work-tracks');
  return payload.tracks;
}

export async function getWorkplaceIncidentLab(track: string): Promise<IncidentLab> {
  return getData(`/api/v1/learning/workplace-incident/${track}`);
}
