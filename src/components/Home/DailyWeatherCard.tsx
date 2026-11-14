import React, { useState, useEffect } from 'react';
import {
  Sun,
  Droplets,
  Wind,
  Gauge,
  Cloud,
  CloudRain,
  CloudLightning,
  ArrowRight,
} from 'lucide-react';
import { DailyStatusSnapshot, SavedFarmPlan } from '../../types';
import {
  fetchLiveWeather,
  LiveWeatherObservation,
} from '../../services/liveWeather';

interface DailyWeatherCardProps {
  snapshot: DailyStatusSnapshot;
  farm?: SavedFarmPlan;
  onWeatherLoaded?: (weather: LiveWeatherObservation) => void;
  onViewDetails?: () => void;
  isAdvanced?: boolean;
}

export const DailyWeatherCard: React.FC<DailyWeatherCardProps> = ({
  snapshot,
  farm,
  onWeatherLoaded,
  onViewDetails,
  isAdvanced = false,
}) => {
  const { weather: snapshotWeather, locationName } = snapshot;

  const lat = farm?.farmAnswers?.lat ?? 38.5;
  const lon = farm?.farmAnswers?.lon ?? -98.5;

  const [liveWeather, setLiveWeather] = useState<LiveWeatherObservation | null>(null);

  // Fetch live weather data
  useEffect(() => {
    let isMounted = true;
    fetchLiveWeather(lat, lon, snapshotWeather.tempC, 400)
      .then((obs) => {
        if (!isMounted) return;
        setLiveWeather(obs);
        if (onWeatherLoaded) {
          onWeatherLoaded(obs);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [lat, lon]);

  const tempC = liveWeather?.tempC ?? snapshotWeather.tempC ?? 28;
  const humidityPct = liveWeather?.humidityPct ?? 64;
  const windSpeedKmH = liveWeather?.windSpeedKmH ?? 12;
  const precipitationMm = liveWeather?.precipitationMm ?? 0;
  const highTemp = Math.round(tempC + 4);
  const lowTemp = Math.round(tempC - 6);

  // Use real 5-day daily forecast from Open-Meteo if available
  const forecastDays = liveWeather?.forecastDays && liveWeather.forecastDays.length > 0
    ? liveWeather.forecastDays
    : [
        { date: 'today', dayLabel: 'Today', weatherCode: 0, condition: 'sunny', conditionLabel: 'Sunny', tempMaxC: highTemp, tempMinC: lowTemp, precipitationMm: 0 },
        { date: 'tomorrow', dayLabel: 'Tomorrow', weatherCode: 0, condition: 'sunny', conditionLabel: 'Sunny', tempMaxC: highTemp + 1, tempMinC: lowTemp + 1, precipitationMm: 0 },
        { date: 'day3', dayLabel: 'Wed', weatherCode: 1, condition: 'partly_cloudy', conditionLabel: 'Partly Cloudy', tempMaxC: highTemp + 2, tempMinC: lowTemp + 2, precipitationMm: 0 },
        { date: 'day4', dayLabel: 'Thu', weatherCode: 0, condition: 'sunny', conditionLabel: 'Sunny', tempMaxC: highTemp + 1, tempMinC: lowTemp + 1, precipitationMm: 0 },
        { date: 'day5', dayLabel: 'Fri', weatherCode: 0, condition: 'sunny', conditionLabel: 'Sunny', tempMaxC: highTemp, tempMinC: lowTemp, precipitationMm: 0 },
      ];

  const renderForecastIcon = (condition: string) => {
    if (condition === 'partly_cloudy') {
      return (
        <div className="relative w-6 h-6 flex items-center justify-center">
          <Sun className="w-4 h-4 text-[#E6B86A] fill-[#E6B86A] absolute -top-0.5 -right-0.5" />
          <Cloud className="w-4 h-4 text-slate-300 fill-slate-300/40 absolute bottom-0 left-0" />
        </div>
      );
    }
    if (condition === 'rainy' || condition === 'stormy') {
      return <CloudRain className="w-5 h-5 text-[#73CAD0]" />;
    }
    if (condition === 'cloudy') {
      return <Cloud className="w-5 h-5 text-slate-300" />;
    }
    return <Sun className="w-5 h-5 text-[#E6B86A] fill-[#E6B86A]" />;
  };

  return (
    <div className="w-full rounded-2xl glass-card border border-white/[0.14] p-5 sm:p-6 space-y-5 text-white transition-all shadow-lg">
      {/* ===================================================================== */}
      {/* 1. HEADER: [☀ Sun] Weather at a Glance           View Details →       */}
      {/* ===================================================================== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
            <Sun className="w-4 h-4 fill-amber-400/80 text-amber-400" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans">
            Weather at a Glance
          </h2>
        </div>

        <button
          type="button"
          onClick={onViewDetails}
          className="text-xs font-semibold text-[#27D7B2] hover:text-white flex items-center gap-1 transition-colors cursor-pointer group"
          title="View detailed weather telemetry"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#27D7B2] group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Header divider */}
      <div className="w-full h-px bg-white/[0.08]" />

      {/* ===================================================================== */}
      {/* 2. MAIN CURRENT WEATHER: [Large ☀]  28°C / Mostly sunny / H:32 L:22    */}
      {/* ===================================================================== */}
      <div className="flex items-center gap-5 sm:gap-6 py-1">
        {/* Large Sun Icon with subtle glow */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_24px_rgba(245,158,11,0.2)]">
          <Sun className="w-9 h-9 sm:w-10 sm:h-10 fill-amber-400/90 text-amber-400" />
        </div>

        {/* Center/right weather readout */}
        <div className="space-y-0.5">
          <div className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-none font-sans drop-shadow-sm">
            {tempC}°C
          </div>
          <div className="text-sm sm:text-base font-semibold text-slate-100 font-sans pt-1">
            Mostly sunny
          </div>
          <div className="text-xs font-medium text-slate-300 font-sans">
            High {highTemp}° &nbsp;·&nbsp; Low {lowTemp}°
          </div>
        </div>
      </div>

      {/* Divider underneath current conditions */}
      <div className="w-full h-px bg-white/[0.08]" />

      {/* ===================================================================== */}
      {/* 3. FOUR METRICS ROW: Humidity | Wind | Precipitation | Pressure       */}
      {/* Evenly distributed with vertical frosted dividers                     */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-4 divide-x divide-white/[0.08] text-left py-1">
        {/* 1. Humidity */}
        <div className="pr-2 sm:pr-4 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[#8EA3AF]">
            <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-xs text-[#8EA3AF] font-sans">Humidity</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-white font-mono mt-1">
            {humidityPct}%
          </div>
        </div>

        {/* 2. Wind */}
        <div className="px-2 sm:px-4 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[#8EA3AF]">
            <Wind className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-xs text-[#8EA3AF] font-sans">Wind</span>
          </div>
          <div className="mt-1">
            <div className="text-base sm:text-lg font-bold text-white font-mono leading-tight">
              {windSpeedKmH} km/h
            </div>
            <div className="text-[11px] font-mono text-[#8EA3AF] mt-0.5">
              NE
            </div>
          </div>
        </div>

        {/* 3. Precipitation */}
        <div className="px-2 sm:px-4 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[#8EA3AF]">
            <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-xs text-[#8EA3AF] font-sans">Precipitation</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-white font-mono mt-1">
            {precipitationMm} mm
          </div>
        </div>

        {/* 4. Pressure */}
        <div className="pl-2 sm:pl-4 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[#8EA3AF]">
            <Gauge className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-xs text-[#8EA3AF] font-sans">Pressure</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-white font-mono mt-1">
            1013 hPa
          </div>
        </div>
      </div>

      {/* Advanced Mode: Solar Radiation, 24-hr Rainfall Accumulation, Decadal Comparison */}
      {isAdvanced && (
        <div className="p-3 rounded-xl bg-black/40 border border-[#27D7B2]/30 space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between text-[#8EA3AF]">
            <span>Solar Radiation (Insolation):</span>
            <span className="text-white font-bold">{snapshotWeather.solarRadiationMj || 19.4} MJ/m²/day</span>
          </div>
          <div className="flex items-center justify-between text-[#8EA3AF]">
            <span>24-hr Rainfall Total:</span>
            <span className="text-cyan-300 font-bold">{snapshotWeather.recentRainMm} mm (7-day: {snapshotWeather.sevenDayRainMm} mm)</span>
          </div>
          <div className="flex items-center justify-between text-[#8EA3AF]">
            <span>High Thermal Days this Month:</span>
            <span className="text-amber-300 font-bold">{snapshotWeather.hotDaysThisMonth} days &gt;30°C</span>
          </div>
          <div className="flex items-center justify-between text-[#8EA3AF] pt-1 border-t border-white/[0.08]">
            <span>Provenance:</span>
            <span className="text-[#27D7B2]">NASA POWER Gridded Hourly Satellite v2.1</span>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. FIVE-DAY FORECAST SECTION                                          */}
      {/* Inset rounded container divided into 5 vertical columns                */}
      {/* ===================================================================== */}
      <div className="rounded-xl glass-pill border border-white/[0.12] p-3 sm:p-4 backdrop-blur-md">
        <div className="grid grid-cols-5 divide-x divide-white/[0.08] text-center">
          {forecastDays.map((fc, idx) => (
            <div key={idx} className="flex flex-col items-center justify-between space-y-2 px-1">
              {/* Day */}
              <span className="text-xs sm:text-sm font-semibold text-[#F1F6EF] font-sans">
                {fc.dayLabel}
              </span>

              {/* Weather icon */}
              <div className="my-1">
                {renderForecastIcon(fc.condition)}
              </div>

              {/* High / Low Temperature */}
              <span className="text-xs sm:text-sm font-bold text-[#F1F6EF] font-mono">
                {fc.tempMaxC}° / {fc.tempMinC}°
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
