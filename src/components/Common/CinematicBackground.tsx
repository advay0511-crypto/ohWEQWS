import React, { createContext, useContext, useState, useEffect } from 'react';
import aerialSunrise from '../../assets/images/farm_aerial_cinematic_1793374539769.jpg';
import cropCanopy from '../../assets/images/crop_canopy_cinematic_1793374553402.jpg';
import twilightIrrigation from '../../assets/images/farm_irrigation_twilight_1793374566818.jpg';
import earthSatellite from '../../assets/images/earth_satellite_banner_1790691731000.jpg';

export type BackgroundThemeId = 'sunrise' | 'canopy' | 'twilight' | 'satellite';

export interface BackgroundTheme {
  id: BackgroundThemeId;
  name: string;
  image: string;
  overlayGradient: string;
}

export const BACKGROUND_THEMES: BackgroundTheme[] = [
  {
    id: 'sunrise',
    name: 'Dawn Fields',
    image: aerialSunrise,
    overlayGradient: 'linear-gradient(180deg, rgba(3, 12, 16, 0.35) 0%, rgba(3, 14, 18, 0.45) 50%, rgba(2, 8, 12, 0.62) 100%)',
  },
  {
    id: 'canopy',
    name: 'Dewy Canopy',
    image: cropCanopy,
    overlayGradient: 'linear-gradient(180deg, rgba(3, 14, 12, 0.35) 0%, rgba(3, 16, 14, 0.46) 50%, rgba(2, 9, 8, 0.62) 100%)',
  },
  {
    id: 'twilight',
    name: 'Twilight Pivot',
    image: twilightIrrigation,
    overlayGradient: 'linear-gradient(180deg, rgba(4, 11, 18, 0.36) 0%, rgba(3, 10, 16, 0.48) 50%, rgba(2, 7, 12, 0.64) 100%)',
  },
  {
    id: 'satellite',
    name: 'Orbital Earth',
    image: earthSatellite,
    overlayGradient: 'linear-gradient(180deg, rgba(3, 10, 16, 0.36) 0%, rgba(2, 8, 14, 0.48) 50%, rgba(1, 6, 11, 0.64) 100%)',
  },
];

interface BackgroundContextType {
  activeThemeId: BackgroundThemeId;
  setActiveThemeId: (id: BackgroundThemeId) => void;
  nextTheme: () => void;
  activeTheme: BackgroundTheme;
}

const DEFAULT_BG_CONTEXT: BackgroundContextType = {
  activeThemeId: 'sunrise',
  setActiveThemeId: () => {},
  nextTheme: () => {},
  activeTheme: BACKGROUND_THEMES[0],
};

const BackgroundContext = createContext<BackgroundContextType | null>(null);

export const useBackground = (): BackgroundContextType => {
  const context = useContext(BackgroundContext);
  return context || DEFAULT_BG_CONTEXT;
};

export const BackgroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeThemeId, setActiveThemeId] = useState<BackgroundThemeId>(() => {
    return (localStorage.getItem('fs_bg_theme') as BackgroundThemeId) || 'sunrise';
  });

  const activeTheme = BACKGROUND_THEMES.find((t) => t.id === activeThemeId) || BACKGROUND_THEMES[0];

  const handleSetTheme = (id: BackgroundThemeId) => {
    setActiveThemeId(id);
    localStorage.setItem('fs_bg_theme', id);
  };

  const nextTheme = () => {
    const idx = BACKGROUND_THEMES.findIndex((t) => t.id === activeThemeId);
    const nextIdx = (idx + 1) % BACKGROUND_THEMES.length;
    handleSetTheme(BACKGROUND_THEMES[nextIdx].id);
  };

  return (
    <BackgroundContext.Provider
      value={{
        activeThemeId,
        setActiveThemeId: handleSetTheme,
        nextTheme,
        activeTheme,
      }}
    >
      {/* Permanent Fixed Ultra-Realistic Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        {BACKGROUND_THEMES.map((theme) => {
          const isActive = theme.id === activeThemeId;
          return (
            <div
              key={theme.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Ultra realistic photography wallpaper */}
              <img
                src={theme.image}
                alt=""
                className="w-full h-full object-cover object-center scale-[1.03] transition-transform duration-[12000ms] ease-out"
                style={{
                  filter: 'saturate(1.15) contrast(1.05)',
                }}
              />
              {/* Cinematic Vignette and Legibility Shade Overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: theme.overlayGradient,
                  backdropFilter: 'blur(1.5px)',
                }}
              />
              {/* Radial edge vignette */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at 50% 30%, transparent 50%, rgba(0,0,0,0.40) 100%)',
                }}
              />
            </div>
          );
        })}

        {/* ENDLESS MOVING WATERFLOW GRADIENT STREAMS (Brand colors: Mint, Emerald, Aqua, Deep Teal) */}
        {/* Stream 1: Living Mint & Emerald fluid wave drifting diagonally across the screen */}
        <div
          className="absolute -top-[25%] -left-[20%] w-[120vw] h-[95vh] rounded-full blur-[90px] animate-waterflow-1 pointer-events-none opacity-45 mix-blend-screen"
          style={{
            background:
              'radial-gradient(ellipse at 40% 50%, rgba(39, 215, 178, 0.40) 0%, rgba(18, 136, 122, 0.25) 45%, rgba(4, 30, 26, 0) 75%)',
          }}
        />

        {/* Stream 2: Deep Aqua Cyan & Sky ocean current undulating from bottom-right */}
        <div
          className="absolute -bottom-[20%] -right-[15%] w-[110vw] h-[90vh] rounded-full blur-[100px] animate-waterflow-2 pointer-events-none opacity-40 mix-blend-screen"
          style={{
            background:
              'radial-gradient(ellipse at 60% 50%, rgba(115, 202, 208, 0.38) 0%, rgba(14, 116, 144, 0.22) 50%, rgba(3, 20, 28, 0) 80%)',
          }}
        />

        {/* Stream 3: Spring Teal & Vitality Green undulating current across center */}
        <div
          className="absolute top-[20%] left-[15%] w-[85vw] h-[75vh] rounded-full blur-[110px] animate-waterflow-3 pointer-events-none opacity-35 mix-blend-screen"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(52, 211, 153, 0.30) 0%, rgba(16, 185, 129, 0.18) 40%, rgba(4, 25, 20, 0) 75%)',
          }}
        />

        {/* Stream 4: Liquid surface refraction & endless water shimmer */}
        <div
          className="absolute inset-0 animate-waterflow-shimmer opacity-25 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(115deg, rgba(39, 215, 178, 0.18) 0%, rgba(115, 202, 208, 0.12) 30%, rgba(18, 136, 122, 0.22) 60%, rgba(39, 215, 178, 0.15) 100%)',
          }}
        />
      </div>

      <div className="relative z-10 w-full min-h-screen">
        {children}
      </div>
    </BackgroundContext.Provider>
  );
};
