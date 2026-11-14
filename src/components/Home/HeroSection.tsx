import React from 'react';
import { Play, HelpCircle } from 'lucide-react';
import heroFarmlandImg from '../../assets/images/hero_farmland_1790691713410.jpg';
import { PrimaryButton, SecondaryButton } from '../DesignSystem';

interface HeroSectionProps {
  onStartAnalysis: () => void;
  onWatchHowItWorks: () => void;
  onOpenGuide?: () => void;
  onOpenDeepAnalysis?: () => void;
  onOpenMap?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartAnalysis,
  onWatchHowItWorks,
  onOpenGuide,
  onOpenDeepAnalysis,
  onOpenMap,
}) => {
  return (
    <section className="relative w-full h-[320px] sm:h-[350px] overflow-hidden border-b border-white/[0.06]">
      {/* Background Image: Aerial Farmland */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroFarmlandImg}
          alt="Aerial view of agricultural farmland"
          className="w-full h-full object-cover object-[center_35%]"
        />
        
        {/* Subtle dark gradient overlay blending into the page background */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#020A10]/95 via-[#031522]/65 to-transparent mix-blend-multiply pointer-events-none" />

        {/* Dark navy gradient overlay from left to right for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#020A10] via-[#020A10]/85 sm:via-[#020A10]/70 to-transparent pointer-events-none" />
      </div>

      {/* Floating NASA Earth Data Glass Badge (Top-Right) */}
      <div className="absolute top-5 right-6 sm:right-10 z-20 hidden md:flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#031522]/60 backdrop-blur-md border border-white/[0.08]">
        {/* NASA Meatball Logo */}
        <div className="w-9 h-9 rounded-full bg-[#0B3D91] flex items-center justify-center p-1 shrink-0 shadow-sm">
          <svg viewBox="0 0 100 100" fill="none" className="w-7 h-7">
            <circle cx="50" cy="50" r="48" fill="#0B3D91" />
            <path
              d="M18 68 L60 22 L72 34 L30 80 Z"
              fill="#FC3D21"
            />
            <ellipse
              cx="50"
              cy="50"
              rx="42"
              ry="18"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              transform="rotate(-25 50 50)"
            />
            <text
              x="50"
              y="58"
              fill="#FFFFFF"
              fontFamily="sans-serif"
              fontSize="24"
              fontWeight="900"
              letterSpacing="2"
              textAnchor="middle"
            >
              NASA
            </text>
          </svg>
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-bold text-white tracking-tight">
            NASA Earth Data
          </span>
          <span className="text-[10px] text-[#8EA3AF] font-medium tracking-wide">
            Satellite • Climate • Soil • Land
          </span>
        </div>
      </div>

      {/* Left Hero Content */}
      <div className="relative z-10 max-w-[1440px] mx-auto h-full px-4 sm:px-8 lg:px-10 flex flex-col justify-center">
        <div className="max-w-[560px] space-y-3">
          {/* Eyebrow */}
          <div className="text-xs font-mono font-bold tracking-[2px] uppercase text-[#27D7B2]">
            SMARTER ROTATIONS. HEALTHIER LAND.
          </div>

          {/* Headline (Professional, well-proportioned) */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight text-white">
            Better decisions for{' '}
            <span className="bg-gradient-to-r from-[#3BD9C2] to-[#42D6AE] bg-clip-text text-transparent">
              a more productive tomorrow.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm leading-relaxed text-[#8EA3AF] max-w-[480px]">
            Field Shift uses NASA Earth observation data and advanced analysis to create the best crop rotation plan for your land — so you can improve soil health, increase yields, and build long-term resilience.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <PrimaryButton
              type="button"
              onClick={onStartAnalysis}
              showArrow
            >
              Plan Crop Rotations
            </PrimaryButton>

            {onOpenDeepAnalysis && (
              <SecondaryButton
                type="button"
                onClick={onOpenDeepAnalysis}
              >
                Run Deep Analysis
              </SecondaryButton>
            )}

            {onOpenMap && (
              <button
                type="button"
                onClick={onOpenMap}
                className="h-10 px-3.5 rounded-xl bg-[#041D2A]/90 hover:bg-[#041D2A] border border-[rgba(225,241,245,0.15)] hover:border-[#27D7B2] text-[#B2C3CA] hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <span>Open Map</span>
              </button>
            )}

            <button
              type="button"
              onClick={onWatchHowItWorks}
              className="h-10 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#B2C3CA] hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>How It Works</span>
            </button>

            {onOpenGuide && (
              <button
                type="button"
                onClick={onOpenGuide}
                className="h-10 px-3 rounded-xl bg-[#27D7B2]/10 hover:bg-[#27D7B2]/20 border border-[#27D7B2]/40 text-[#27D7B2] hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md group"
                title="What does Field Shift do? (?)"
              >
                <HelpCircle className="w-4 h-4 text-[#27D7B2] group-hover:scale-110 transition-transform" />
                <span>Guide</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
