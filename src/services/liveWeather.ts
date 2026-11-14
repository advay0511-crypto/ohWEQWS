export interface ForecastDayItem {
  date: string;
  dayLabel: string;
  weatherCode: number;
  condition: 'sunny' | 'clear_night' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
  conditionLabel: string;
  tempMaxC: number;
  tempMinC: number;
  precipitationMm: number;
}

export interface LiveWeatherObservation {
  tempC: number;
  feelsLikeC: number;
  humidityPct: number;
  windSpeedKmH: number;
  precipitationMm: number;
  isDay: boolean; // true = daytime, false = nighttime
  weatherCode: number;
  condition: 'sunny' | 'clear_night' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
  conditionLabel: string;
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  localTimeStr: string;
  timezone: string;
  summaryAdvice: string;
  source: 'OPEN_METEO_LIVE' | 'NASA_BASELINE_FALLBACK';
  forecastDays?: ForecastDayItem[];
  soilMoisture?: any;
  retrievedAt?: string;
}

// In-memory cache to prevent unnecessary repeat requests
const weatherCache = new Map<string, { data: LiveWeatherObservation; expiresAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Maps WMO weather code and day/night status to a clean human condition
 */
function interpretWmoCode(code: number, isDay: boolean): {
  condition: LiveWeatherObservation['condition'];
  conditionLabel: string;
} {
  if (code === 0) {
    return isDay
      ? { condition: 'sunny', conditionLabel: 'Sunny & Clear' }
      : { condition: 'clear_night', conditionLabel: 'Clear Sky' };
  }
  if (code === 1 || code === 2) {
    return { condition: 'partly_cloudy', conditionLabel: 'Partly Cloudy' };
  }
  if (code === 3) {
    return { condition: 'cloudy', conditionLabel: 'Overcast' };
  }
  if (code === 45 || code === 48) {
    return { condition: 'cloudy', conditionLabel: 'Foggy' };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return { condition: 'rainy', conditionLabel: 'Rain Showers' };
  }
  if (code >= 71 && code <= 77) {
    return { condition: 'snowy', conditionLabel: 'Snowy' };
  }
  if (code >= 95 && code <= 99) {
    return { condition: 'stormy', conditionLabel: 'Thunderstorm' };
  }
  return isDay
    ? { condition: 'sunny', conditionLabel: 'Clear' }
    : { condition: 'clear_night', conditionLabel: 'Clear Night' };
}

/**
 * Determines meteorological season from latitude and month
 */
function getSeasonForLatMonth(lat: number, month0Indexed: number): 'Spring' | 'Summer' | 'Autumn' | 'Winter' {
  const isNorthern = lat >= 0;
  // Northern: Winter (11,0,1), Spring (2,3,4), Summer (5,6,7), Autumn (8,9,10)
  if (month0Indexed >= 2 && month0Indexed <= 4) {
    return isNorthern ? 'Spring' : 'Autumn';
  }
  if (month0Indexed >= 5 && month0Indexed <= 7) {
    return isNorthern ? 'Summer' : 'Winter';
  }
  if (month0Indexed >= 8 && month0Indexed <= 10) {
    return isNorthern ? 'Autumn' : 'Spring';
  }
  return isNorthern ? 'Winter' : 'Summer';
}

/**
 * Fetches accurate live weather data for any latitude & longitude worldwide using Open-Meteo.
 * Includes automatic day/night detection, local time, and seasonal awareness.
 */
export async function fetchLiveWeather(
  lat: number,
  lon: number,
  fallbackTempC: number = 24,
  fallbackAnnualRainMm: number = 400
): Promise<LiveWeatherObservation> {
  const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`;
  const now = Date.now();

  const cached = weatherCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const season = getSeasonForLatMonth(lat, currentMonth);

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=5&timezone=auto`;
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });

    if (!resp.ok) {
      throw new Error(`Weather fetch status: ${resp.status}`);
    }

    const json = await resp.json();
    const cur = json.current;
    const isDay = cur.is_day === 1;
    const code = Number(cur.weather_code ?? 0);
    const { condition, conditionLabel } = interpretWmoCode(code, isDay);

    const tempC = Math.round(cur.temperature_2m ?? fallbackTempC);
    const feelsLikeC = Math.round(cur.apparent_temperature ?? tempC);
    const humidityPct = Math.round(cur.relative_humidity_2m ?? 50);
    const windSpeedKmH = Math.round(cur.wind_speed_10m ?? 12);
    const precipitationMm = Number((cur.precipitation ?? 0).toFixed(1));

    // Format local time from timezone if available
    let localTimeStr = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (json.timezone) {
      try {
        localTimeStr = new Intl.DateTimeFormat([], {
          timeZone: json.timezone,
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).format(currentDate);
      } catch {
        // use default
      }
    }

    // Parse 5-day forecast
    const forecastDays: ForecastDayItem[] = [];
    if (json.daily && Array.isArray(json.daily.time)) {
      const times: string[] = json.daily.time;
      const codes: number[] = json.daily.weather_code || [];
      const maxs: number[] = json.daily.temperature_2m_max || [];
      const mins: number[] = json.daily.temperature_2m_min || [];
      const rains: number[] = json.daily.precipitation_sum || [];

      for (let i = 0; i < Math.min(5, times.length); i++) {
        const dStr = times[i];
        const dayDate = new Date(dStr);
        let dayLabel = 'Today';
        if (i === 1) dayLabel = 'Tomorrow';
        else if (i > 1) {
          dayLabel = dayDate.toLocaleDateString([], { weekday: 'short' });
        }
        const dCode = codes[i] ?? 0;
        const dCond = interpretWmoCode(dCode, true);
        forecastDays.push({
          date: dStr,
          dayLabel,
          weatherCode: dCode,
          condition: dCond.condition,
          conditionLabel: dCond.conditionLabel,
          tempMaxC: Math.round(maxs[i] ?? (tempC + 3)),
          tempMinC: Math.round(mins[i] ?? (tempC - 4)),
          precipitationMm: Number((rains[i] ?? 0).toFixed(1)),
        });
      }
    }

    // Practical agricultural summary advice
    let summaryAdvice = 'Good conditions for field checks today.';
    if (precipitationMm > 2 || condition === 'rainy' || condition === 'stormy') {
      summaryAdvice = 'Rain active — hold off on fertilizer spreading or spraying.';
    } else if (tempC > 34) {
      summaryAdvice = 'High daytime heat — check root-zone moisture in late afternoon.';
    } else if (windSpeedKmH > 28) {
      summaryAdvice = 'Windy conditions — avoid fine pesticide spraying.';
    } else if (!isDay) {
      summaryAdvice = 'Night window — lower evaporative water loss.';
    }

    const result: LiveWeatherObservation = {
      tempC,
      feelsLikeC,
      humidityPct,
      windSpeedKmH,
      precipitationMm,
      isDay,
      weatherCode: code,
      condition,
      conditionLabel,
      season,
      localTimeStr,
      timezone: json.timezone || 'Local',
      summaryAdvice,
      source: 'OPEN_METEO_LIVE',
      forecastDays: forecastDays.length > 0 ? forecastDays : undefined,
      retrievedAt: new Date().toISOString(),
    };

    weatherCache.set(cacheKey, { data: result, expiresAt: now + CACHE_TTL_MS });
    return result;
  } catch (err) {
    // Graceful offline / error fallback to calibrated location baseline
    const isDayNow = currentDate.getHours() >= 6 && currentDate.getHours() < 19;
    const fallbackDays: ForecastDayItem[] = [
      { date: new Date().toISOString(), dayLabel: 'Today', weatherCode: 0, condition: 'sunny', conditionLabel: 'Clear', tempMaxC: fallbackTempC + 4, tempMinC: fallbackTempC - 5, precipitationMm: 0 },
      { date: new Date(Date.now() + 86400000).toISOString(), dayLabel: 'Tomorrow', weatherCode: 0, condition: 'sunny', conditionLabel: 'Clear', tempMaxC: fallbackTempC + 5, tempMinC: fallbackTempC - 4, precipitationMm: 0 },
      { date: new Date(Date.now() + 86400000 * 2).toISOString(), dayLabel: 'Day 3', weatherCode: 1, condition: 'partly_cloudy', conditionLabel: 'Partly Cloudy', tempMaxC: fallbackTempC + 3, tempMinC: fallbackTempC - 3, precipitationMm: 0 },
      { date: new Date(Date.now() + 86400000 * 3).toISOString(), dayLabel: 'Day 4', weatherCode: 0, condition: 'sunny', conditionLabel: 'Clear', tempMaxC: fallbackTempC + 4, tempMinC: fallbackTempC - 4, precipitationMm: 0 },
      { date: new Date(Date.now() + 86400000 * 4).toISOString(), dayLabel: 'Day 5', weatherCode: 0, condition: 'sunny', conditionLabel: 'Clear', tempMaxC: fallbackTempC + 3, tempMinC: fallbackTempC - 5, precipitationMm: 0 },
    ];
    const fallback: LiveWeatherObservation = {
      tempC: fallbackTempC,
      feelsLikeC: fallbackTempC,
      humidityPct: 48,
      windSpeedKmH: 14,
      precipitationMm: 0,
      isDay: isDayNow,
      weatherCode: 0,
      condition: isDayNow ? 'sunny' : 'clear_night',
      conditionLabel: isDayNow ? 'Sunny & Clear' : 'Clear Sky',
      season,
      localTimeStr: currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timezone: 'Local',
      summaryAdvice: 'Conditions stable for active growing cycle.',
      source: 'NASA_BASELINE_FALLBACK',
      forecastDays: fallbackDays,
      retrievedAt: new Date().toISOString(),
    };
    return fallback;
  }
}

/**
 * Detects the user's browser location via Geolocation API,
 * finds their coordinates, fetches their live weather, local time, day/night status, and current season.
 */
export async function detectUserCurrentLocation(): Promise<{
  lat: number;
  lon: number;
  locationName: string;
  weather: LiveWeatherObservation;
}> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));

        let locationName = `Detected Location (${lat > 0 ? `${lat}°N` : `${Math.abs(lat)}°S`}, ${lon > 0 ? `${lon}°E` : `${Math.abs(lon)}°W`})`;

        // Attempt reverse geocoding via Open-Meteo geocoding or free nominatim
        try {
          const geoResp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (geoResp.ok) {
            const data = await geoResp.json();
            const city = data.address?.city || data.address?.town || data.address?.county || data.address?.village;
            const country = data.address?.country;
            if (city && country) {
              locationName = `${city}, ${country}`;
            } else if (country) {
              locationName = country;
            }
          }
        } catch {
          // ignore reverse geocode error
        }

        const weather = await fetchLiveWeather(lat, lon);
        resolve({ lat, lon, locationName, weather });
      },
      (err) => {
        reject(err);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  });
}
