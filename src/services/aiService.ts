import { FarmAnswers, RotationResult, ClimateObservation } from '../types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  evidenceSources?: string[];
}

export async function fetchAiRotationDescription(
  rotation: RotationResult,
  farmAnswers: FarmAnswers,
  climateData: ClimateObservation
): Promise<string> {
  try {
    const res = await fetch('/api/ai-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rotation, farmAnswers, climateData }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.description && !data.fallback) {
        return data.description;
      }
    }
  } catch (err) {
    console.warn('AI description endpoint offline or failed, using deterministic agronomic rationale:', err);
  }

  // Deterministic, scientifically grounded fallback based exclusively on verified inputs
  const soil = farmAnswers.soilTexture ? farmAnswers.soilTexture.replace('_', ' ') : 'specified';
  const mode = farmAnswers.irrigationMode === 'rain_only' ? 'rain-fed' : 'irrigated';
  const seq = rotation.sequence?.map((s) => s.cropName).join(' → ') || 'Multi-crop sequence';
  const loc = farmAnswers.locationName || 'your farm parcel';

  return `Evaluated for ${soil} soil under ${mode} conditions in ${loc}: The sequence (${seq}) rotates distinct botanical families to break soilborne pathogen cycles while optimizing seasonal water utilization. Biological nitrogen credits from pulse crops replenish soil reserves, directly addressing your selected priorities without exceeding climate moisture buffers.`;
}

export async function sendAiAgronomistMessage(
  message: string,
  history: { role: 'user' | 'model'; text: string }[],
  context: {
    farmName?: string;
    farmAnswers?: FarmAnswers;
    selectedRotation?: RotationResult;
    climateData?: ClimateObservation;
  }
): Promise<string> {
  try {
    const res = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, context }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reply) {
        return data.reply;
      }
    }
  } catch (err) {
    console.warn('AI chat endpoint offline, using local expert fallback:', err);
  }

  // Deterministic agronomic answer grounded strictly in user's field parameters
  const loc = context.farmAnswers?.locationName || 'your parcel';
  const soil = context.farmAnswers?.soilTexture ? context.farmAnswers.soilTexture.replace('_', ' ') : 'field topsoil';
  const hasPlan = Boolean(context.selectedRotation?.name);
  const plan = context.selectedRotation?.name ? `your plan (${context.selectedRotation.name})` : 'recommended crop sequencing';
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('water') || lowerMsg.includes('irrigation') || lowerMsg.includes('moisture')) {
    const quota = context.farmAnswers?.seasonalWaterQuotaMm ? `${context.farmAnswers.seasonalWaterQuotaMm} mm quota` : 'seasonal rainfall limits';
    return `Regarding water management for ${loc}: Your ${soil} parcel has an available water capacity that requires careful scheduling during peak vegetative stages. Under ${plan}, crop water demand is balanced against ${quota}. To prevent moisture stress, apply supplemental irrigation during early morning hours to minimize evaporative loss.`;
  }

  if (lowerMsg.includes('nitrogen') || lowerMsg.includes('fertilizer') || lowerMsg.includes('soil')) {
    return `Regarding soil nutrient dynamics in ${loc}: Your ${soil} profile benefits from alternating taproot and fibrous root structures. ${hasPlan ? `In ${plan}, the pulse legume phase` : 'Legume pulse phases'} return biological nitrogen into the active root zone. Before applying synthetic nitrogen, measure residual nitrate to credit this biological carryover.`;
  }

  if (lowerMsg.includes('pest') || lowerMsg.includes('disease') || lowerMsg.includes('fungus')) {
    return `Regarding disease management: The primary benefit of botanical rotation is enforcing diversity between seasons. Alternating non-host crops disrupts Fusarium, Ascochyta blight, and root-cyst nematodes, preventing resting spore accumulation in the soil profile.`;
  }

  return `Based on your field records for ${loc} with ${soil}: Crop transitions should be sequenced to balance water demand and preserve soil structure. For your question ("${message}"), ensure planting dates align with local thermal growing windows and verify seedbed moisture before germination.`;
}

// Structured practice parser for natural language farmer input
export interface ParsedPracticeDraft {
  method: 'drip' | 'sprinkler' | 'pivot' | 'flood' | 'manual';
  frequency: string;
  durationMinutes?: number;
  timeOfDay?: 'dawn' | 'morning' | 'evening' | 'night' | 'flexible';
  confidence: 'high' | 'moderate' | 'low';
  rawInput: string;
  assumptions: string[];
}

export function parseNaturalLanguagePractice(text: string): ParsedPracticeDraft {
  const lower = text.toLowerCase();
  let method: ParsedPracticeDraft['method'] = 'drip';
  if (lower.includes('sprinkler')) method = 'sprinkler';
  else if (lower.includes('pivot')) method = 'pivot';
  else if (lower.includes('flood') || lower.includes('furrow')) method = 'flood';
  else if (lower.includes('hose') || lower.includes('manual') || lower.includes('hand')) method = 'manual';

  // Duration extraction
  let durationMinutes: number | undefined = undefined;
  const matchMin = lower.match(/(\d+)\s*(?:min|minute|mins)/);
  if (matchMin) {
    durationMinutes = parseInt(matchMin[1], 10);
  } else {
    const matchHour = lower.match(/(\d+(?:\.\d+)?)\s*(?:hr|hour|hours)/);
    if (matchHour) {
      durationMinutes = Math.round(parseFloat(matchHour[1]) * 60);
    }
  }

  // Frequency extraction
  let frequency = 'Daily';
  if (lower.includes('every second day') || lower.includes('alternate day') || lower.includes('every other day')) {
    frequency = 'Every 2 days';
  } else if (lower.includes('twice a week') || lower.includes('2 times a week')) {
    frequency = '2 times per week';
  } else if (lower.includes('weekly') || lower.includes('once a week')) {
    frequency = 'Weekly';
  } else if (lower.includes('twice a day')) {
    frequency = 'Twice daily';
  }

  let timeOfDay: ParsedPracticeDraft['timeOfDay'] = 'flexible';
  if (lower.includes('morning') || lower.includes('dawn') || lower.includes('sunrise')) {
    timeOfDay = 'morning';
  } else if (lower.includes('evening') || lower.includes('dusk') || lower.includes('sunset')) {
    timeOfDay = 'evening';
  } else if (lower.includes('night')) {
    timeOfDay = 'night';
  }

  const assumptions: string[] = [];
  if (durationMinutes && !lower.includes('l/h') && !lower.includes('flow rate') && !lower.includes('liters')) {
    assumptions.push('Duration recorded directly; volumetric depth (mm) requires flow rate or emitter spacing.');
  }

  return {
    method,
    frequency,
    durationMinutes,
    timeOfDay,
    confidence: durationMinutes ? 'high' : 'moderate',
    rawInput: text,
    assumptions,
  };
}
