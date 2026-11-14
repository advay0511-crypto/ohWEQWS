import React from 'react';

interface BackgroundAuroraProps {
  theme?: 'dark' | 'light';
}

export const BackgroundAurora: React.FC<BackgroundAuroraProps> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden transition-colors duration-700 ${
        isDark ? 'bg-[#080C16]' : 'bg-[#F8FAFC]'
      }`}
      aria-hidden="true"
    >
      {/* 
        LAYER 1: Subtle, calm ocean wave gradient
        Slow, muted diagonal flow that gives deep atmospheric presence
      */}
      <div
        className="absolute inset-[-20%] animate-ocean-wave opacity-50"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at 25% 25%, rgba(14, 116, 144, 0.12) 0%, transparent 55%), radial-gradient(ellipse at 75% 75%, rgba(13, 148, 136, 0.10) 0%, transparent 55%), radial-gradient(ellipse at 50% 50%, rgba(30, 58, 138, 0.08) 0%, transparent 60%)'
            : 'radial-gradient(ellipse at 25% 25%, rgba(186, 230, 253, 0.35) 0%, transparent 55%), radial-gradient(ellipse at 75% 75%, rgba(167, 243, 208, 0.30) 0%, transparent 55%), radial-gradient(ellipse at 50% 50%, rgba(241, 245, 249, 0.40) 0%, transparent 60%)',
        }}
      />

      {/* 
        LAYER 2: Deep Muted Currents (Navy, Pine, Slate Teal)
        Low saturation, high blur, slow drift for an executive aesthetic
      */}
      {/* Current 1: Subtle Deep Marine (Top-Left) */}
      <div
        className={`absolute -top-[15%] -left-[10%] w-[70vw] h-[70vw] max-w-[1000px] max-h-[1000px] rounded-full blur-[140px] animate-ambient-1 ${
          isDark
            ? 'opacity-35 mix-blend-screen'
            : 'opacity-40 mix-blend-multiply'
        }`}
        style={{
          background: isDark
            ? 'radial-gradient(circle, #0e7490 0%, #0c4a6e 45%, transparent 75%)'
            : 'radial-gradient(circle, #bae6fd 0%, #e0f2fe 45%, transparent 75%)',
        }}
      />

      {/* Current 2: Muted Deep Pine (Top-Right) */}
      <div
        className={`absolute -top-[10%] -right-[15%] w-[65vw] h-[65vw] max-w-[900px] max-h-[900px] rounded-full blur-[150px] animate-ambient-2 ${
          isDark
            ? 'opacity-30 mix-blend-screen'
            : 'opacity-35 mix-blend-multiply'
        }`}
        style={{
          background: isDark
            ? 'radial-gradient(circle, #065f46 0%, #042f2e 50%, transparent 80%)'
            : 'radial-gradient(circle, #a7f3d0 0%, #d1fae5 50%, transparent 80%)',
        }}
      />

      {/* Current 3: Dark Ocean Slate (Bottom-Center) */}
      <div
        className={`absolute -bottom-[20%] left-[15%] w-[75vw] h-[75vw] max-w-[1100px] max-h-[1100px] rounded-full blur-[160px] animate-ambient-3 ${
          isDark
            ? 'opacity-30 mix-blend-screen'
            : 'opacity-35 mix-blend-multiply'
        }`}
        style={{
          background: isDark
            ? 'radial-gradient(circle, #0f766e 0%, #1e3a8a 50%, transparent 80%)'
            : 'radial-gradient(circle, #ccfbf1 0%, #e0f2fe 50%, transparent 80%)',
        }}
      />

      {/* 
        LAYER 3: Micro texture grain (prevents banding on calibrated displays)
      */}
      <div className="absolute inset-0 noise-overlay opacity-30 pointer-events-none" />
    </div>
  );
};
