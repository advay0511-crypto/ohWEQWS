import React, { useMemo } from 'react';
import { LiveWeatherObservation } from '../services/liveWeather';

interface WeatherAmbientBackgroundProps {
  weather?: LiveWeatherObservation | null;
}

export const WeatherAmbientBackground: React.FC<WeatherAmbientBackgroundProps> = ({ weather }) => {
  const condition = weather?.condition || (weather?.isDay === false ? 'clear_night' : 'sunny');
  const isDay = weather ? weather.isDay : true;
  const season = weather?.season || 'Spring';

  // Generate 85 realistic starry sky points with varied coordinates, delays, sizes, and colors
  const nightStars = useMemo(() => {
    const stars = [];
    const seed = [
      { x: 4, y: 7, s: 2.4, d: 0.2, c: '#E0F2FE' },
      { x: 9, y: 15, s: 1.6, d: 1.1, c: '#BAE6FD' },
      { x: 14, y: 5, s: 2.8, d: 2.4, c: '#FFFFFF' },
      { x: 19, y: 22, s: 1.4, d: 0.8, c: '#A7F3D0' },
      { x: 25, y: 11, s: 2.2, d: 1.9, c: '#E0F2FE' },
      { x: 31, y: 28, s: 1.5, d: 2.8, c: '#FFFFFF' },
      { x: 37, y: 8, s: 3.2, d: 0.4, c: '#38BDF8' },
      { x: 43, y: 19, s: 1.8, d: 1.7, c: '#E0F2FE' },
      { x: 49, y: 13, s: 2.6, d: 2.1, c: '#C7D2FE' },
      { x: 55, y: 6, s: 2.1, d: 0.9, c: '#FFFFFF' },
      { x: 61, y: 26, s: 1.7, d: 1.3, c: '#E0F2FE' },
      { x: 67, y: 10, s: 2.9, d: 2.5, c: '#67E8F9' },
      { x: 73, y: 18, s: 1.9, d: 0.6, c: '#FFFFFF' },
      { x: 79, y: 7, s: 2.5, d: 1.8, c: '#BAE6FD' },
      { x: 84, y: 24, s: 1.4, d: 2.2, c: '#E0F2FE' },
      { x: 90, y: 12, s: 2.7, d: 0.5, c: '#FFFFFF' },
      { x: 95, y: 20, s: 2.0, d: 1.4, c: '#A7F3D0' },
      { x: 7, y: 34, s: 1.6, d: 2.6, c: '#FFFFFF' },
      { x: 13, y: 44, s: 2.4, d: 0.7, c: '#E0F2FE' },
      { x: 21, y: 36, s: 1.8, d: 1.9, c: '#C7D2FE' },
      { x: 28, y: 49, s: 3.0, d: 2.3, c: '#38BDF8' },
      { x: 35, y: 39, s: 1.5, d: 0.3, c: '#FFFFFF' },
      { x: 42, y: 51, s: 2.3, d: 1.6, c: '#E0F2FE' },
      { x: 48, y: 43, s: 1.9, d: 2.7, c: '#BAE6FD' },
      { x: 56, y: 53, s: 2.5, d: 1.0, c: '#FFFFFF' },
      { x: 63, y: 37, s: 1.6, d: 1.5, c: '#E0F2FE' },
      { x: 70, y: 46, s: 2.4, d: 0.8, c: '#A7F3D0' },
      { x: 77, y: 34, s: 1.5, d: 2.0, c: '#FFFFFF' },
      { x: 83, y: 52, s: 2.8, d: 1.2, c: '#C7D2FE' },
      { x: 89, y: 41, s: 2.0, d: 2.9, c: '#E0F2FE' },
      { x: 96, y: 48, s: 2.2, d: 0.4, c: '#FFFFFF' },
      { x: 5, y: 62, s: 1.7, d: 1.7, c: '#BAE6FD' },
      { x: 16, y: 72, s: 2.6, d: 2.4, c: '#FFFFFF' },
      { x: 24, y: 65, s: 1.5, d: 0.9, c: '#E0F2FE' },
      { x: 33, y: 76, s: 2.2, d: 1.8, c: '#67E8F9' },
      { x: 41, y: 68, s: 1.8, d: 2.2, c: '#FFFFFF' },
      { x: 50, y: 74, s: 2.5, d: 0.5, c: '#C7D2FE' },
      { x: 58, y: 63, s: 1.6, d: 1.3, c: '#E0F2FE' },
      { x: 66, y: 75, s: 2.9, d: 2.7, c: '#38BDF8' },
      { x: 74, y: 67, s: 1.7, d: 0.6, c: '#FFFFFF' },
      { x: 82, y: 73, s: 2.3, d: 1.8, c: '#A7F3D0' },
      { x: 91, y: 69, s: 1.5, d: 2.4, c: '#E0F2FE' },
      { x: 11, y: 85, s: 2.1, d: 0.9, c: '#FFFFFF' },
      { x: 22, y: 91, s: 2.7, d: 2.0, c: '#BAE6FD' },
      { x: 38, y: 88, s: 1.6, d: 1.4, c: '#E0F2FE' },
      { x: 52, y: 86, s: 2.4, d: 0.7, c: '#FFFFFF' },
      { x: 68, y: 92, s: 1.8, d: 2.3, c: '#C7D2FE' },
      { x: 85, y: 87, s: 2.2, d: 1.1, c: '#67E8F9' },
      { x: 94, y: 93, s: 1.9, d: 1.7, c: '#FFFFFF' },
      { x: 3, y: 24, s: 2.0, d: 1.5, c: '#E0F2FE' },
      { x: 18, y: 17, s: 2.9, d: 2.8, c: '#38BDF8' },
      { x: 27, y: 29, s: 1.7, d: 0.4, c: '#FFFFFF' },
      { x: 36, y: 22, s: 2.3, d: 1.9, c: '#BAE6FD' },
      { x: 45, y: 31, s: 1.5, d: 2.5, c: '#E0F2FE' },
      { x: 53, y: 21, s: 2.7, d: 0.8, c: '#A7F3D0' },
      { x: 64, y: 27, s: 1.6, d: 2.1, c: '#FFFFFF' },
      { x: 72, y: 16, s: 2.4, d: 1.4, c: '#C7D2FE' },
      { x: 81, y: 25, s: 1.8, d: 0.7, c: '#E0F2FE' },
      { x: 88, y: 17, s: 3.1, d: 2.6, c: '#38BDF8' },
      { x: 97, y: 29, s: 1.5, d: 1.2, c: '#FFFFFF' },
    ];
    return seed;
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      {/* ========================================================================= */}
      {/* 1. VIBRANT ANIMATED TOP GRADIENT WASH (STRONGER ATMOSPHERIC PRESENCE)     */}
      {/* ========================================================================= */}
      {condition === 'stormy' ? (
        // STORMY ATMOSPHERE: Deep dramatic electric indigo & violet gradient wash
        <div className="absolute top-0 left-0 right-0 h-[720px] bg-gradient-to-b from-[#3b156b]/95 via-[#230f4e]/85 via-[#0f0729]/65 to-transparent transition-all duration-1000 animate-gradient-shift" />
      ) : condition === 'rainy' ? (
        // RAINY ATMOSPHERE: Rich dark slate-teal overcast wash with cyan undertones
        <div className="absolute top-0 left-0 right-0 h-[720px] bg-gradient-to-b from-[#0f4b6e]/95 via-[#08344e]/85 via-[#041a29]/65 to-transparent transition-all duration-1000 animate-gradient-shift" />
      ) : isDay ? (
        // DAYTIME: Noticeable, rich celestial sky-blue gradient fading downward
        <div className="absolute top-0 left-0 right-0 h-[720px] bg-gradient-to-b from-[#0a6699]/90 via-[#064a73]/75 via-[#032b45]/45 to-transparent transition-all duration-1000 animate-gradient-shift" />
      ) : (
        // NIGHTTIME: Rich cosmic royal dark blue & deep navy gradient fading down
        <div className="absolute top-0 left-0 right-0 h-[760px] bg-gradient-to-b from-[#132c6b]/95 via-[#091a45]/90 via-[#040e2b]/70 to-transparent transition-all duration-1000 animate-gradient-shift" />
      )}

      {/* Atmospheric Aurora Ambient Glows */}
      {isDay ? (
        <>
          <div className="absolute -top-16 left-0 w-[640px] h-[520px] rounded-full bg-sky-400/25 blur-[120px] pointer-events-none" />
          <div className="absolute top-10 right-0 w-[500px] h-[450px] rounded-full bg-cyan-500/15 blur-[140px] pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute -top-16 left-0 w-[640px] h-[540px] rounded-full bg-indigo-500/30 blur-[130px] pointer-events-none" />
          <div className="absolute top-10 right-10 w-[520px] h-[480px] rounded-full bg-blue-600/20 blur-[150px] pointer-events-none" />
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. NIGHTTIME EXTENSIVE STAR FIELD (40+ TWINKLING STARS)                    */}
      {/* ========================================================================= */}
      {!isDay && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {nightStars.map((st, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-star-twinkle"
              style={{
                left: `${st.x}%`,
                top: `${st.y}%`,
                width: `${st.s}px`,
                height: `${st.s}px`,
                backgroundColor: st.c || '#FFFFFF',
                animationDelay: `${st.d}s`,
                animationDuration: `${2.2 + (i % 3) * 0.8}s`,
                boxShadow: st.s > 2.2 ? `0 0 8px ${st.c || '#38BDF8'}` : '0 0 4px rgba(255, 255, 255, 0.9)',
              }}
            />
          ))}

          {/* 4 Larger Brilliant Compass Star Points in upper sky */}
          <div className="absolute top-[14%] left-[18%] text-cyan-200/80 animate-star-twinkle" style={{ animationDelay: '0.4s' }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M12 0L14 9L23 12L14 15L12 24L10 15L1 12L10 9Z" />
            </svg>
          </div>
          <div className="absolute top-[8%] left-[72%] text-sky-200/80 animate-star-twinkle" style={{ animationDelay: '1.7s' }}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M12 0L14 9L23 12L14 15L12 24L10 15L1 12L10 9Z" />
            </svg>
          </div>
          <div className="absolute top-[28%] left-[84%] text-blue-200/70 animate-star-twinkle" style={{ animationDelay: '2.3s' }}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M12 0L14 9L23 12L14 15L12 24L10 15L1 12L10 9Z" />
            </svg>
          </div>
          <div className="absolute top-[22%] left-[42%] text-cyan-100/75 animate-star-twinkle" style={{ animationDelay: '1.1s' }}>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
              <path d="M12 0L14 9L23 12L14 15L12 24L10 15L1 12L10 9Z" />
            </svg>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MINIMALIST SUN / MOON EMBLEM — ON THE LEFT BEHIND CARDS                */}
      {/* ========================================================================= */}

      {/* SUNNY DAYTIME: Radiant Golden Sun with glowing corona */}
      {condition === 'sunny' && isDay && (
        <div className="absolute top-6 sm:top-12 left-4 sm:left-12 lg:left-20 w-80 h-80 sm:w-[460px] sm:h-[460px] lg:w-[520px] lg:h-[520px]">
          {/* Intense ambient soft golden glow */}
          <div className="absolute inset-4 rounded-full bg-amber-400/35 blur-[100px] pointer-events-none" />

          {/* Minimalist Vector Sun: Simple circle + lines */}
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full text-amber-300/60 stroke-current fill-none animate-[spin_180s_linear_infinite]"
            style={{ strokeWidth: 1.8, strokeLinecap: 'round' }}
          >
            {/* Center simple minimalist circle */}
            <circle cx="100" cy="100" r="34" className="stroke-amber-300/80 fill-amber-400/10" />

            {/* Clean radiating spoke lines */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <line
                key={deg}
                x1="100"
                y1="48"
                x2="100"
                y2="34"
                transform={`rotate(${deg} 100 100)`}
              />
            ))}
          </svg>
        </div>
      )}

      {/* CLEAR NIGHT: Luminous Crescent Moon with Indigo/Cyan Aura */}
      {(condition === 'clear_night' || (!isDay && condition === 'sunny')) && (
        <div className="absolute top-6 sm:top-12 left-4 sm:left-12 lg:left-20 w-72 h-72 sm:w-[420px] sm:h-[420px] lg:w-[480px] lg:h-[480px]">
          <div className="absolute inset-6 rounded-full bg-cyan-400/25 blur-[100px] pointer-events-none" />

          <svg
            viewBox="0 0 200 200"
            className="w-full h-full text-cyan-200/65 stroke-current fill-none"
            style={{ strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }}
          >
            {/* Clean luminous crescent moon outline */}
            <path d="M 110,40 A 55,55 0 1,0 155,130 A 45,45 0 0,1 110,40 Z" className="fill-cyan-300/10" />

            {/* Star points near moon */}
            <g className="animate-pulse">
              <path d="M 155,50 L 155,60 M 150,55 L 160,55" style={{ strokeWidth: 1.4 }} />
              <path d="M 175,85 L 175,93 M 171,89 L 179,89" style={{ strokeWidth: 1.2 }} />
              <circle cx="140" cy="95" r="2" className="fill-cyan-200/80" />
            </g>
          </svg>
        </div>
      )}

      {/* THUNDERSTORM: Vibrant lightning flashes */}
      {condition === 'stormy' && (
        <>
          <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-indigo-950/60 to-transparent pointer-events-none" />

          {/* Transparent lightning bolt 1 */}
          <div className="absolute top-6 left-8 sm:left-24 w-60 h-72 sm:w-72 sm:h-96 animate-lightning pointer-events-none opacity-30">
            <svg
              viewBox="0 0 120 180"
              className="w-full h-full text-cyan-200 stroke-current fill-none"
              style={{ strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }}
            >
              <path d="M 70,10 L 45,65 L 62,68 L 35,130 L 48,132 L 25,175" />
              <path d="M 45,65 L 25,95 L 35,98 L 20,125" style={{ strokeWidth: 1.2 }} />
            </svg>
          </div>

          {/* Lightning bolt 2 */}
          <div
            className="absolute top-12 left-1/4 sm:left-1/3 w-52 h-64 sm:w-64 sm:h-80 animate-lightning pointer-events-none opacity-25"
            style={{ animationDelay: '3.5s' }}
          >
            <svg
              viewBox="0 0 120 180"
              className="w-full h-full text-sky-200 stroke-current fill-none"
              style={{ strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }}
            >
              <path d="M 60,15 L 42,60 L 56,64 L 32,120 L 44,122 L 28,160" />
              <path d="M 42,60 L 65,85" style={{ strokeWidth: 1.2 }} />
            </svg>
          </div>
        </>
      )}

      {/* RAIN OR STORMY: Translucent water droplets */}
      {(condition === 'rainy' || condition === 'stormy') && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-6 left-4 sm:top-12 sm:left-14 w-72 h-72 sm:w-[440px] sm:h-[440px] opacity-40">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full text-cyan-300/70 stroke-current fill-none"
              style={{ strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }}
            >
              <path d="M 50,105 A 25,25 0 0,1 85,75 A 35,35 0 0,1 145,85 A 22,22 0 0,1 160,110 L 50,110 Z" />
            </svg>
          </div>

          {/* Water droplets */}
          <div className="absolute inset-0">
            {[
              { left: '6%', delay: '0s', dur: '4.2s', size: 12 },
              { left: '14%', delay: '1.2s', dur: '3.8s', size: 14 },
              { left: '22%', delay: '2.5s', dur: '4.5s', size: 10 },
              { left: '30%', delay: '0.7s', dur: '4.0s', size: 16 },
              { left: '40%', delay: '2.0s', dur: '3.6s', size: 12 },
              { left: '52%', delay: '1.5s', dur: '4.4s', size: 11 },
              { left: '65%', delay: '0.3s', dur: '3.9s', size: 15 },
              { left: '76%', delay: '2.8s', dur: '4.1s', size: 10 },
              { left: '86%', delay: '1.8s', dur: '3.7s', size: 13 },
              { left: '94%', delay: '0.9s', dur: '4.6s', size: 12 },
            ].map((drop, idx) => (
              <div
                key={idx}
                className="absolute animate-droplet"
                style={{
                  left: drop.left,
                  animationDelay: drop.delay,
                  animationDuration: drop.dur,
                  top: '-30px',
                }}
              >
                <div
                  className="rounded-full bg-gradient-to-b from-cyan-200/80 via-cyan-400/50 to-transparent"
                  style={{
                    width: '2px',
                    height: `${drop.size}px`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CLOUDY */}
      {(condition === 'cloudy' || condition === 'partly_cloudy') && (
        <div className="absolute top-6 left-4 sm:top-12 sm:left-14 w-72 h-72 sm:w-[440px] sm:h-[440px] opacity-35">
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full text-slate-300 stroke-current fill-none"
            style={{ strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }}
          >
            {condition === 'partly_cloudy' && isDay && (
              <g className="text-amber-300 opacity-80">
                <circle cx="70" cy="70" r="22" />
                <line x1="70" y1="40" x2="70" y2="30" />
                <line x1="40" y1="70" x2="30" y2="70" />
                <line x1="48" y1="48" x2="40" y2="40" />
              </g>
            )}
            <path d="M 60,115 A 28,28 0 0,1 98,82 A 40,40 0 0,1 165,95 A 25,25 0 0,1 180,125 L 60,125 Z" />
          </svg>
        </div>
      )}

      {/* Indicator pill on bottom right */}
      <div className="absolute bottom-4 right-6 hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm text-[11px] font-mono text-[#8EA3AF]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#27D7B2]" />
        <span>{season}</span>
        <span className="text-white/30">·</span>
        <span>{weather?.conditionLabel || (isDay ? 'Day' : 'Night')}</span>
      </div>
    </div>
  );
};
