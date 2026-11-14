import { useState, useEffect, useCallback } from 'react';
import {
  AnalysisPayload,
  FarmAnswers,
  NormalizedWeights,
  PrioritiesState,
  WhatIfComparison,
  WhatIfParameters,
} from '../types';
import { calculateNormalizedWeights, generateAndScoreRotations, runWhatIfScenario } from '../engine/scoring';
import { fetchNasaEarthData, PRESET_REGIONS } from '../services/nasaApi';

export const DEFAULT_PRIORITIES: PrioritiesState = {
  waterSaving: 2, // Important
  soilHealth: 3, // Very important
  climateResilience: 3, // Very important
  cropSuitability: 2, // Important
  productivity: 2, // Important
};

export const DEFAULT_FARM_ANSWERS: FarmAnswers = {
  farmName: 'Al Marjan Farm',
  locationName: 'Salina, Kansas, USA',
  lat: 38.8403,
  lon: -97.6114,
  country: 'United States',
  locationConfirmed: true,
  soilTexture: 'silt_loam',
  soilTextureConfirmed: true,
  irrigationMode: 'rain_only',
  irrigationType: undefined,
  waterReliability: 'mostly',
  seasonalWaterQuotaMm: null,
  cropHistory: [
    { seasonIndex: 1, seasonLabel: 'Last Season', cropId: 'winter_wheat', performance: 'good' },
    { seasonIndex: 2, seasonLabel: '2 Seasons Ago', cropId: 'soybean', performance: 'good' },
    { seasonIndex: 3, seasonLabel: '3 Seasons Ago', cropId: 'spring_barley', performance: 'ok' },
  ],
  planningHorizon: 'auto',
  priorities: DEFAULT_PRIORITIES,
  excludedCropIds: [],
  forcedCropIds: [],
  soilPh: 6.6,
  soilPhEstimated: false,
  hasSoilLabTest: false,
  soilOrganicMatterPct: 2.7,
  soilNitrogenPpm: 18,
  drainageClass: 'good',
  slopeClass: 'gentle',
  tillagePractice: 'reduced',
  fertilizerPractice: 'both',
  coverCropPractice: 'cover_crops',
  cropsPerYear: 'one',
  knownPestsOrDiseases: [],
  waterSalinity: 'good',
  fieldSizeHa: 65,
  riskAttitude: 'balanced',
};

export const BLANK_FARM_ANSWERS: FarmAnswers = {
  farmName: '',
  locationName: '',
  lat: 38.8403,
  lon: -97.6114,
  country: '',
  locationConfirmed: false,
  soilTexture: 'unknown',
  soilTextureConfirmed: false,
  irrigationMode: '' as any,
  irrigationType: undefined,
  waterReliability: undefined,
  seasonalWaterQuotaMm: null,
  cropHistory: [],
  planningHorizon: '' as any,
  priorities: DEFAULT_PRIORITIES,
  excludedCropIds: [],
  forcedCropIds: [],
  soilPh: null,
  soilPhEstimated: true,
  hasSoilLabTest: false,
  soilOrganicMatterPct: null,
  soilNitrogenPpm: null,
  drainageClass: 'good',
  slopeClass: 'gentle',
  tillagePractice: 'reduced',
  fertilizerPractice: 'both',
  coverCropPractice: 'cover_crops',
  cropsPerYear: 'one',
  knownPestsOrDiseases: [],
  waterSalinity: 'good',
  fieldSizeHa: 30,
  riskAttitude: 'balanced',
};

const STORAGE_KEY_ANSWERS = 'fieldshift_draft_v1';
const STORAGE_KEY_ANALYSIS = 'fieldshift_analysis_v1';

export function isRequiredAnswered(answers: FarmAnswers): boolean {
  if (!answers.locationConfirmed) return false;
  if (!answers.soilTexture || answers.soilTexture === 'unknown') return false;
  if (!answers.irrigationMode) return false;
  if (!answers.cropHistory || answers.cropHistory.length === 0) return false;
  if (!answers.planningHorizon) return false;
  if (!answers.priorities) return false;
  return true;
}

export function getFirstUnansweredStep(answers: FarmAnswers): string {
  if (!answers.locationConfirmed) return 'location';
  if (!answers.soilTexture || answers.soilTexture === 'unknown') return 'soil';
  if (!answers.irrigationMode) return 'water';
  if (!answers.cropHistory || answers.cropHistory.length === 0) return 'history';
  if (!answers.planningHorizon) return 'horizon';
  if (!answers.priorities) return 'priorities';
  return 'review';
}
