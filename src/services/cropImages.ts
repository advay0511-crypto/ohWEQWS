/**
 * Realistic Photographic Assets for Crops and Farm Regions
 */
import wheatImg from '../assets/images/crop_wheat_1790789261580.jpg';
import lettuceImg from '../assets/images/crop_lettuce_1790789274802.jpg';
import beansImg from '../assets/images/crop_beans_1790789288018.jpg';
import maizeImg from '../assets/images/crop_maize_1790789298341.jpg';
import soybeanImg from '../assets/images/crop_soybean_1790791011503.jpg';
import sunflowerImg from '../assets/images/crop_sunflower_1790791032279.jpg';
import barleyImg from '../assets/images/crop_barley_1790791046594.jpg';
import aerialMarjan from '../assets/images/farm_aerial_marjan_1790789310167.jpg';
import aerialRak from '../assets/images/farm_aerial_rak_1790789322524.jpg';
import earthBanner from '../assets/images/earth_satellite_banner_1790691731000.jpg';
import heroFarmland from '../assets/images/hero_farmland_1790691713410.jpg';
import farmThumbGeneric from '../assets/images/farm_thumbnail_1790691751269.jpg';

export {
  wheatImg,
  lettuceImg,
  beansImg,
  maizeImg,
  soybeanImg,
  sunflowerImg,
  barleyImg,
  aerialMarjan,
  aerialRak,
  earthBanner,
  heroFarmland,
  farmThumbGeneric,
};

export function getCropImage(cropName: string): string {
  const normalized = (cropName || '').toLowerCase();
  if (normalized.includes('wheat') || normalized.includes('cereal') || normalized.includes('rye') || normalized.includes('oat')) {
    return wheatImg;
  }
  if (normalized.includes('barley')) {
    return barleyImg;
  }
  if (normalized.includes('sunflower')) {
    return sunflowerImg;
  }
  if (normalized.includes('soy') || normalized.includes('soybean')) {
    return soybeanImg;
  }
  if (normalized.includes('lettuce') || normalized.includes('spinach') || normalized.includes('brassica') || normalized.includes('cover') || normalized.includes('kale') || normalized.includes('cabbage')) {
    return lettuceImg;
  }
  if (normalized.includes('bean') || normalized.includes('legume') || normalized.includes('lentil') || normalized.includes('chickpea') || normalized.includes('alfalfa') || normalized.includes('pea')) {
    return beansImg;
  }
  if (normalized.includes('maize') || normalized.includes('corn') || normalized.includes('sorghum') || normalized.includes('millet')) {
    return maizeImg;
  }
  return wheatImg;
}

/**
 * Returns a high-resolution regional photographic asset fallback
 */
export function getFarmRegionFallbackImage(locationName?: string, farmName?: string, lat?: number, lon?: number): string {
  const loc = `${locationName || ''} ${farmName || ''}`.toLowerCase();

  // 1. Ras Al Khaimah / UAE / Gulf Desert agriculture
  if (loc.includes('marjan') || loc.includes('al marjan')) {
    return aerialMarjan;
  }
  if (loc.includes('rak') || loc.includes('ras al khaimah') || loc.includes('uae') || loc.includes('emirates') || loc.includes('dubai') || loc.includes('sharjah') || loc.includes('al ain')) {
    return aerialRak;
  }

  // 2. Midwest / Great Plains / US Corn & Wheat Belt
  if (loc.includes('kansas') || loc.includes('illinois') || loc.includes('iowa') || loc.includes('nebraska') || loc.includes('salina') || loc.includes('champaign') || loc.includes('usa') || loc.includes('united states')) {
    return heroFarmland;
  }

  // 3. Australia (Darling Downs, Queensland, Murray-Darling)
  if (loc.includes('darling') || loc.includes('queensland') || loc.includes('australia') || loc.includes('toowoomba') || loc.includes('nsw')) {
    return farmThumbGeneric;
  }

  // 4. Coordinates based check
  if (typeof lat === 'number' && typeof lon === 'number') {
    if (lat >= 15 && lat <= 32 && lon >= 35 && lon <= 60) {
      return aerialRak;
    }
    if (lat >= 25 && lat <= 50 && lon >= -125 && lon <= -65) {
      return heroFarmland;
    }
    if (lat < 0 && lon > 110) {
      return farmThumbGeneric;
    }
  }

  return aerialMarjan;
}

/**
 * Returns high-resolution real-world orbital satellite & aerial photography
 * for the exact coordinates of the farm parcel via the ESRI World Imagery REST API,
 * with zero-fail fallback to high-resolution regional agricultural photography.
 */
export function getFarmRegionImage(locationName?: string, farmName?: string, lat?: number, lon?: number): string {
  // If valid coordinates exist, stream live high-resolution satellite imagery for the parcel bounding box
  if (typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon) && (lat !== 0 || lon !== 0)) {
    const delta = 0.025; // ~2.5km spatial bounding-box window around parcel
    const xmin = (lon - delta).toFixed(5);
    const ymin = (lat - delta).toFixed(5);
    const xmax = (lon + delta).toFixed(5);
    const ymax = (lat + delta).toFixed(5);
    return `https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/export?bbox=${xmin},${ymin},${xmax},${ymax}&bboxSR=4326&imageSR=4326&size=800,600&format=jpg&f=image`;
  }

  return getFarmRegionFallbackImage(locationName, farmName, lat, lon);
}
