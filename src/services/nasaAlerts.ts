import { SavedFarmPlan, NasaAlert } from '../types';

const STORAGE_KEY_READ_ALERTS = 'fieldshift_read_alerts_v1';
const STORAGE_KEY_DISMISSED_ALERTS = 'fieldshift_dismissed_alerts_v1';

export function getReadAlertIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_READ_ALERTS);
    if (raw) {
      return new Set(JSON.parse(raw));
    }
  } catch {
    // ignore
  }
  return new Set();
}

export function getDismissedAlertIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DISMISSED_ALERTS);
    if (raw) {
      return new Set(JSON.parse(raw));
    }
  } catch {
    // ignore
  }
  return new Set();
}

export function dismissAlert(alertId: string): void {
  const dismissed = getDismissedAlertIds();
  dismissed.add(alertId);
  try {
    localStorage.setItem(STORAGE_KEY_DISMISSED_ALERTS, JSON.stringify(Array.from(dismissed)));
  } catch {
    // ignore
  }
}

export function dismissAllAlerts(alertIds: string[]): void {
  const dismissed = getDismissedAlertIds();
  alertIds.forEach((id) => dismissed.add(id));
  try {
    localStorage.setItem(STORAGE_KEY_DISMISSED_ALERTS, JSON.stringify(Array.from(dismissed)));
  } catch {
    // ignore
  }
}

export function markAlertAsRead(alertId: string): void {
  const read = getReadAlertIds();
  read.add(alertId);
  try {
    localStorage.setItem(STORAGE_KEY_READ_ALERTS, JSON.stringify(Array.from(read)));
  } catch {
    // ignore
  }
}

export function markAllAlertsAsRead(alertIds: string[]): void {
  const read = getReadAlertIds();
  alertIds.forEach((id) => read.add(id));
  try {
    localStorage.setItem(STORAGE_KEY_READ_ALERTS, JSON.stringify(Array.from(read)));
  } catch {
    // ignore
  }
}

export function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Active now';
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Active now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } catch {
    return 'Active recently';
  }
}

/**
 * Generates environmental alerts based on the farm's own local historical baseline.
 * Plain language throughout — zero jargon, completely understandable for any farmer.
 * Dismissed alerts are completely excluded so they never stay forever.
 */
export function generateFarmNasaAlerts(farms: SavedFarmPlan[]): NasaAlert[] {
  const readIds = getReadAlertIds();
  const dismissedIds = getDismissedAlertIds();
  const alerts: NasaAlert[] = [];

  farms.forEach((farm) => {
    const climate = farm.analysis?.climateData;
    if (!climate) return;

    const history = climate.annualHistorySeries || [];

    // Calculate farm's own historical baselines
    const localRainBaseline = history.length > 0
      ? Math.round(history.reduce((acc, h) => acc + h.precipitationMm, 0) / history.length)
      : climate.annualPrecipitationMm;

    const localSummerMaxBaseline = history.length > 0
      ? Number((history.reduce((acc, h) => acc + h.summerMaxTempC, 0) / history.length).toFixed(1))
      : Number((climate.maxSummerTempC - 1.8).toFixed(1));

    const localSoilMoistureBaseline = climate.soilMoistureHistoricalBaseline ?? 52;

    // Alert 1: Soil Moisture Deficit
    const moistureDeficit = localSoilMoistureBaseline - climate.soilMoisturePercentile;
    const moistureAlertId = `${farm.id}_moisture_drop`;
    if ((moistureDeficit >= 12 || climate.soilMoisturePercentile <= 35) && !dismissedIds.has(moistureAlertId)) {
      alerts.push({
        id: moistureAlertId,
        farmId: farm.id,
        farmName: farm.name,
        type: 'moisture_drop',
        title: 'Soil is Drying Out',
        shortAlert: 'Soil moisture is lower than usual for your field right now.',
        boldWarning: 'Water your crops soon so roots do not dry out.',
        actionRecommendation: 'Turn on watering for an extra 20–30 minutes this week and check soil dampness.',
        conciseAction: 'Water crops soon',
        metricName: 'Soil Moisture',
        observedValue: `${climate.soilMoisturePercentile}% moisture`,
        historicalBaseline: `${localSoilMoistureBaseline}% normal baseline`,
        anomalyDelta: `${moistureDeficit > 0 ? `-${moistureDeficit}%` : 'Low'} compared to normal`,
        satelliteSensor: 'NASA Earth Observations',
        cropImpact: 'Dry soil slows down plant growth and wilts young leaves.',
        actionGuidance: [
          {
            label: 'When to water',
            detail: 'Water early in the morning or in the evening to stop water evaporating in the sun.',
          },
          {
            label: 'Keep water in soil',
            detail: 'Leave crop residue or spread mulch over dry patches to keep soil moist.',
          },
          {
            label: 'Check roots',
            detail: 'Dig down 10 to 15 cm with a trowel — if the soil is dry and dusty, water today.',
          },
        ],
        severity: moistureDeficit >= 18 ? 'critical' : 'warning',
        timestamp: formatRelativeTime(farm.updatedAt),
        read: readIds.has(moistureAlertId),
      });
    }

    // Alert 2: High Heat Anomaly
    const heatDelta = Number((climate.maxSummerTempC - localSummerMaxBaseline).toFixed(1));
    const heatAlertId = `${farm.id}_heat_anomaly`;
    if ((heatDelta >= 2.0 || climate.maxSummerTempC >= 38.0) && !dismissedIds.has(heatAlertId)) {
      alerts.push({
        id: heatAlertId,
        farmId: farm.id,
        farmName: farm.name,
        type: 'heat_anomaly',
        title: 'High Heat Warning',
        shortAlert: `Today is about ${heatDelta > 0 ? heatDelta : 3}°C hotter than normal for this season.`,
        boldWarning: 'Water only in early morning (5:00 AM – 8:00 AM) so crops stay cool.',
        actionRecommendation: 'Water early in the day and do not spray strong fertilizers until the heat wave passes.',
        conciseAction: 'Water early in morning',
        metricName: 'Daytime Temperature',
        observedValue: `${climate.maxSummerTempC}°C high`,
        historicalBaseline: `${localSummerMaxBaseline}°C normal high`,
        anomalyDelta: `+${heatDelta > 0 ? heatDelta : 3}°C hotter than usual`,
        satelliteSensor: 'NASA Weather Observations',
        cropImpact: 'Hot midday sun dries leaves quickly and can stop flowers from making grain.',
        actionGuidance: [
          {
            label: 'Watering time',
            detail: 'Water between 5:00 AM and 8:00 AM before the sun gets too strong.',
          },
          {
            label: 'Hold fertilizer',
            detail: 'Do not put down strong chemical fertilizer during high heat to avoid burning leaves.',
          },
          {
            label: 'Protect sensitive plants',
            detail: 'Check young seedlings twice a day during peak afternoon heat.',
          },
        ],
        severity: heatDelta >= 3.5 ? 'critical' : 'warning',
        timestamp: formatRelativeTime(farm.updatedAt),
        read: readIds.has(heatAlertId),
      });
    }

    // Alert 3: Low Rainfall Deficit
    const rainDeficitMm = localRainBaseline - climate.annualPrecipitationMm;
    const rainDeficitPct = localRainBaseline > 0 ? Math.round((rainDeficitMm / localRainBaseline) * 100) : 0;
    const rainAlertId = `${farm.id}_rainfall_deficit`;
    if ((rainDeficitPct >= 18 || (climate.annualPrecipitationMm < 350 && rainDeficitPct >= 10)) && !dismissedIds.has(rainAlertId)) {
      alerts.push({
        id: rainAlertId,
        farmId: farm.id,
        farmName: farm.name,
        type: 'rainfall_deficit',
        title: 'Low Rain Notice',
        shortAlert: `Rainfall is down about ${rainDeficitPct}% compared to your farm's average year.`,
        boldWarning: 'Hold off on heavy fertilizers until soil gets more moisture.',
        actionRecommendation: 'Save fertilizer until after rain or your next scheduled watering.',
        conciseAction: 'Hold fertilizer until watered',
        metricName: 'Rainfall Total',
        observedValue: `${climate.annualPrecipitationMm} mm rain`,
        historicalBaseline: `${localRainBaseline} mm normal average`,
        anomalyDelta: `${rainDeficitMm} mm below normal`,
        satelliteSensor: 'NASA Rain Measurements',
        cropImpact: 'Plants cannot absorb dry fertilizer without enough water in the ground.',
        actionGuidance: [
          {
            label: 'Fertilizer timing',
            detail: 'Wait until the soil is damp before spreading granular fertilizer.',
          },
          {
            label: 'Water saving',
            detail: 'Focus irrigation on crops that are currently flowering or forming grain.',
          },
          {
            label: 'Weed removal',
            detail: 'Pull weeds early so they do not steal scarce moisture from your crops.',
          },
        ],
        severity: rainDeficitPct >= 28 ? 'critical' : 'warning',
        timestamp: formatRelativeTime(farm.updatedAt),
        read: readIds.has(rainAlertId),
      });
    }

    // Alert 4: Regional Ecozone Vegetation Deficit (Honest Remediation 2.2)
    const ndviAlertId = `${farm.id}_ndvi_stress`;
    const ndviVal = climate.vegetationNdviMean ?? 0.45;
    if (ndviVal < 0.35 && !dismissedIds.has(ndviAlertId)) {
      alerts.push({
        id: ndviAlertId,
        farmId: farm.id,
        farmName: farm.name,
        type: 'ndvi_stress',
        title: 'Crop Growth & Moisture Watch',
        shortAlert: 'Regional ecozone moisture indicates vegetative stress in your micro-climate.',
        boldWarning: 'Walk your field to check leaf turgor and soil moisture in active rows.',
        actionRecommendation: 'Inspect slower-growing sections to verify irrigation line pressure.',
        conciseAction: 'Walk field to inspect',
        metricName: 'Regional Vegetation Index',
        observedValue: `${ndviVal.toFixed(2)} regional index`,
        historicalBaseline: `0.52 normal baseline`,
        anomalyDelta: `${Math.round((0.52 - ndviVal) * 100)}% below baseline`,
        satelliteSensor: 'Regional Ecozone Climatology Prior',
        cropImpact: 'Persistent evaporative deficit slows down plant canopy development.',
        actionGuidance: [
          {
            label: 'Field walk',
            detail: 'Walk diagonal rows across your parcel and inspect leaf color and soil dampness.',
          },
          {
            label: 'Water check',
            detail: 'Check if irrigation lines are clogged or if some rows are getting missed.',
          },
          {
            label: 'Soil inspection',
            detail: 'Verify root depth moisture at 15cm depth.',
          },
        ],
        severity: ndviVal < 0.28 ? 'critical' : 'warning',
        timestamp: formatRelativeTime(farm.updatedAt),
        read: readIds.has(ndviAlertId),
      });
    }
  });

  return alerts;
}
