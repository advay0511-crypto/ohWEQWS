import React from 'react';
import {
  Sprout,
  CheckCircle2,
  ArrowRight,
  Droplets,
  ShieldCheck,
  Leaf,
  Layers,
  Info,
} from 'lucide-react';
import { wheatImg, lettuceImg, beansImg, maizeImg, getCropImage } from '../../services/cropImages';

export interface RotationCropItem {
  yearLabel: string; // e.g. "Year 1", "Year 2"
  name: string; // e.g. "Wheat"
  season: string; // e.g. "Autumn", "Winter"
  seasonColor?: string; // circular colored dot
  imageSrc?: string; // realistic photo
  plantingWindow?: string;
  harvestWindow?: string;
  durationYears?: number;
  durationDays?: number;
}

export interface RotationCardProps {
  id?: string;
  rotationNumber?: number; // 1, 2, 3
  title?: string; // "Rotation 1"
  isRecommended?: boolean; // Recommended badge
  score?: number; // e.g. 92
  scoreLabel?: string; // "Best overall balance"
  metrics?: {
    yield?: string; // "+18%"
    soilHealth?: string; // "+32%"
    waterUse?: string; // "-28%"
    resilience?: string; // "+26%"
  };
  crops?: RotationCropItem[];
  explanations?: string[];
  isSelected?: boolean;
  hasAiData?: boolean;
  onSelect?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

export const RotationCard: React.FC<RotationCardProps> = ({
  rotationNumber = 1,
  title,
  isRecommended = true,
  score = 92,
  scoreLabel = 'Best overall balance',
  metrics = {
    yield: '+18%',
    soilHealth: '+32%',
    waterUse: '-28%',
    resilience: '+26%',
  },
  crops,
  explanations = [
    'Breaks pest and disease cycles',
    'Improves soil nitrogen levels',
    'Optimises water usage',
    'Matches seasonal climate',
  ],
  isSelected = false,
  hasAiData = true,
  onSelect,
  onViewDetails,
  className = '',
}) => {
  // Default 4-year crop sequence as explicitly specified:
  // Year 1: Wheat (Winter)
  // Year 2: Lettuce (Spring)
  // Year 3: Beans (Summer)
  // Year 4: Maize (Autumn)
  const defaultCropsRotation1: RotationCropItem[] = [
    {
      yearLabel: 'Year 1',
      name: 'Wheat',
      season: 'Winter',
      seasonColor: '#38BDF8', // Cyan/blue dot
      imageSrc: wheatImg,
    },
    {
      yearLabel: 'Year 2',
      name: 'Lettuce',
      season: 'Spring',
      seasonColor: '#4ADE80', // Green dot
      imageSrc: lettuceImg,
    },
    {
      yearLabel: 'Year 3',
      name: 'Beans',
      season: 'Summer',
      seasonColor: '#4ADE80', // Green dot
      imageSrc: beansImg,
    },
    {
      yearLabel: 'Year 4',
      name: 'Maize',
      season: 'Autumn',
      seasonColor: '#38BDF8', // Cyan/blue dot
      imageSrc: maizeImg,
    },
  ];

  const defaultCropsRotation2: RotationCropItem[] = [
    {
      yearLabel: 'Year 1',
      name: 'Maize',
      season: 'Autumn',
      seasonColor: '#38BDF8',
      imageSrc: maizeImg,
    },
    {
      yearLabel: 'Year 2',
      name: 'Soybean',
      season: 'Summer',
      seasonColor: '#4ADE80',
      imageSrc: getCropImage('Soybean'),
    },
    {
      yearLabel: 'Year 3',
      name: 'Wheat',
      season: 'Winter',
      seasonColor: '#38BDF8',
      imageSrc: wheatImg,
    },
    {
      yearLabel: 'Year 4',
      name: 'Lettuce',
      season: 'Spring',
      seasonColor: '#4ADE80',
      imageSrc: lettuceImg,
    },
  ];

  const defaultCropsRotation3: RotationCropItem[] = [
    {
      yearLabel: 'Year 1',
      name: 'Beans',
      season: 'Summer',
      seasonColor: '#4ADE80',
      imageSrc: beansImg,
    },
    {
      yearLabel: 'Year 2',
      name: 'Wheat',
      season: 'Winter',
      seasonColor: '#38BDF8',
      imageSrc: wheatImg,
    },
    {
      yearLabel: 'Year 3',
      name: 'Sunflower',
      season: 'Summer',
      seasonColor: '#FBBF24',
      imageSrc: getCropImage('Sunflower'),
    },
    {
      yearLabel: 'Year 4',
      name: 'Barley',
      season: 'Autumn',
      seasonColor: '#FB923C',
      imageSrc: getCropImage('Barley'),
    },
  ];

  const displayCrops =
    crops && crops.length > 0
      ? crops.slice(0, 5)
      : rotationNumber === 2
      ? defaultCropsRotation2
      : rotationNumber === 3
      ? defaultCropsRotation3
      : defaultCropsRotation1;

  const handleCardClick = () => {
    if (onSelect) onSelect();
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails();
    } else if (onSelect) {
      onSelect();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`w-full rounded-2xl bg-[#031522]/50 backdrop-blur-md border transition-all duration-200 ${
        isSelected
          ? 'border-[#27D7B2]/70 shadow-[0_0_24px_rgba(39,215,178,0.15)] ring-1 ring-[#27D7B2]/40'
          : hasAiData
          ? 'border-[#27D7B2]/30 hover:border-[#27D7B2]/60 hover:shadow-[0_0_18px_rgba(39,215,178,0.08)]'
          : 'border-white/[0.08] hover:border-white/[0.18]'
      } ${className}`}
    >
      {/* 3 distinct divided sections: left score, center timeline, right reasoning */}
      <div className="flex flex-col lg:flex-row items-stretch p-5 sm:p-6 lg:p-7 gap-5 lg:gap-0">
        {/* ========================================================= */}
        {/* SECTION 1 — ROTATION SCORE (~26% of card width) */}
        {/* ========================================================= */}
        <div className="w-full lg:w-[26%] lg:pr-6 flex flex-col justify-between shrink-0">
          <div>
            {/* Top row: Small crop/rotation icon + "Rotation 1" + Green badge "Recommended" */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 shrink-0">
                <Sprout className="w-4 h-4 text-[#27D7B2] shrink-0" />
                <span className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {title || `Rotation ${rotationNumber}`}
                </span>
              </div>
              {isRecommended && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#27D7B2]/15 border border-[#27D7B2]/30 text-[#27D7B2] shrink-0">
                  Recommended
                </span>
              )}
            </div>

            {/* Score row */}
            <div className="mt-2.5 flex items-baseline gap-2 relative group/tooltip">
              <span className="text-3xl sm:text-4xl leading-none font-bold text-white tracking-tight font-mono">
                {score}%
              </span>
              <span className="text-xs text-[#27D7B2] font-semibold uppercase tracking-wider font-mono">Match</span>
              
              <div className="relative inline-flex items-center ml-1">
                <span className="w-3.5 h-3.5 rounded-full bg-white/10 hover:bg-white/20 text-[#8EA3AF] hover:text-white flex items-center justify-center cursor-help transition-colors text-[10px] font-mono">
                  i
                </span>
                {/* Tooltip popup */}
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-64 p-3 rounded-xl bg-[#020A10] border border-white/15 text-xs text-[#E1EDF2] shadow-xl z-50 pointer-events-none">
                  <div className="font-bold text-[#27D7B2] font-mono mb-1">Match score</div>
                  <p className="leading-relaxed text-[11px] text-[#8EA3AF]">
                    This score estimates how well the rotation fits your farm conditions and selected priorities. It considers factors such as water availability, soil conditions, climate, crop requirements, and your preferences.
                  </p>
                </div>
              </div>
            </div>

            {/* Below score: "Best overall balance" */}
            <div className="mt-1 text-xs font-medium text-[#27D7B2] leading-snug">
              {scoreLabel}
            </div>
            <div className="text-[11px] text-[#8EA3AF] mt-0.5 leading-snug">
              Overall fit for your farm and preferences
            </div>
          </div>

          <div>
            {/* Thin Horizontal Divider */}
            <div className="w-full h-px bg-white/[0.06] my-3" />

            {/* 4 Performance Metrics */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              {/* 1. Yield */}
              <div className="flex items-center gap-1.5 min-w-0">
                <Leaf className="w-3.5 h-3.5 text-[#27D7B2] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-[#8EA3AF] leading-tight whitespace-nowrap">
                    Yield
                  </span>
                  <span className="text-xs font-semibold text-[#27D7B2] leading-tight font-mono mt-0.5">
                    {metrics.yield || '+18%'}
                  </span>
                </div>
              </div>

              {/* 2. Soil Health */}
              <div className="flex items-center gap-1.5 min-w-0">
                <Layers className="w-3.5 h-3.5 text-[#27D7B2] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-[#8EA3AF] leading-tight whitespace-nowrap">
                    Soil Health
                  </span>
                  <span className="text-xs font-semibold text-[#27D7B2] leading-tight font-mono mt-0.5">
                    {metrics.soilHealth || '+32%'}
                  </span>
                </div>
              </div>

              {/* 3. Water Use */}
              <div className="flex items-center gap-1.5 min-w-0">
                <Droplets className="w-3.5 h-3.5 text-[#27D7B2] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-[#8EA3AF] leading-tight whitespace-nowrap">
                    Water Use
                  </span>
                  <span className="text-xs font-semibold text-[#27D7B2] leading-tight font-mono mt-0.5">
                    {metrics.waterUse || '-28%'}
                  </span>
                </div>
              </div>

              {/* 4. Resilience */}
              <div className="flex items-center gap-1.5 min-w-0">
                <ShieldCheck className="w-3.5 h-3.5 text-[#27D7B2] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-[#8EA3AF] leading-tight whitespace-nowrap">
                    Resilience
                  </span>
                  <span className="text-xs font-semibold text-[#27D7B2] leading-tight font-mono mt-0.5">
                    {metrics.resilience || '+26%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* THIN VERTICAL DIVIDER 1 */}
        <div className="hidden lg:block w-px bg-white/[0.06] self-stretch shrink-0" />

        {/* ========================================================= */}
        {/* SECTION 2 — CROP ROTATION TIMELINE (~48% of card width) */}
        {/* ========================================================= */}
        <div className="w-full lg:w-[48%] px-0 lg:px-6 flex flex-col justify-center shrink-0">
          <div className="flex items-center justify-between gap-2 w-full">
            {displayCrops.map((crop, idx) => {
              const plantedDays = crop.durationDays || (crop.durationYears ? crop.durationYears * 365 : 115);

              return (
                <React.Fragment key={idx}>
                  <div className="flex-1 flex flex-col items-center text-center min-w-0 group/crop relative">
                    {/* YEAR LABEL (STRICTLY SEPARATED) */}
                    <span className="text-[11px] font-semibold text-[#8EA3AF] mb-1 font-mono uppercase">
                      {crop.yearLabel || `Year ${idx + 1}`}
                    </span>

                    {/* CROP IMAGE CARD WITH HOVER DAYS TOOLTIP */}
                    <div
                      title={`Planted for ~${plantedDays} days in field`}
                      className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-white/10 group-hover/crop:border-[#27D7B2]/70 group-hover/crop:shadow-[0_0_12px_rgba(39,215,178,0.25)] shadow-sm bg-black/20 relative transition-all cursor-pointer"
                    >
                      <img
                        src={crop.imageSrc || getCropImage(crop.name)}
                        alt={crop.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/crop:scale-110"
                      />
                      {/* Hover Tooltip Overlay */}
                      <div className="absolute inset-x-0 bottom-0 py-1 bg-black/85 text-[10px] font-mono font-bold text-[#27D7B2] opacity-0 group-hover/crop:opacity-100 transition-opacity">
                        ~{plantedDays}d
                      </div>
                    </div>

                    {/* CROP NAME: directly underneath each image */}
                    <span className="mt-1.5 text-xs sm:text-sm font-semibold text-white tracking-tight truncate w-full">
                      {crop.name}
                    </span>

                    {/* SEASON INDICATOR (STRICTLY SEPARATED) */}
                    <div className="mt-0.5 flex items-center justify-center gap-1.5 text-[11px] text-[#8EA3AF]">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            crop.seasonColor ||
                            (crop.season === 'Winter'
                              ? '#38BDF8'
                              : crop.season === 'Spring'
                              ? '#4ADE80'
                              : crop.season === 'Summer'
                              ? '#FBBF24'
                              : '#FB923C'),
                        }}
                      />
                      <span className="truncate">{crop.season}</span>
                    </div>
                  </div>

                  {/* Connecting Arrow between crops */}
                  {idx < displayCrops.length - 1 && (
                    <span className="text-[#27D7B2] font-bold text-xs select-none shrink-0 px-0.5 mb-4">
                      →
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* THIN VERTICAL DIVIDER 2 */}
        <div className="hidden lg:block w-px bg-white/[0.06] self-stretch shrink-0" />

        {/* ========================================================= */}
        {/* SECTION 3 — WHY THIS WORKS (~26% of card width) */}
        {/* ========================================================= */}
        <div className="w-full lg:w-[26%] pl-0 lg:pl-6 flex flex-col justify-between shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">
              Why this works
            </h3>

            {/* 4 Vertically Stacked Explanations */}
            <div className="mt-2.5 space-y-2">
              {explanations.map((exp, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#27D7B2]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-[#27D7B2]" />
                  </div>
                  <span className="text-xs leading-relaxed text-[#8EA3AF]">
                    {exp}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Large Outlined Button at bottom */}
          <button
            type="button"
            onClick={handleDetailsClick}
            className="w-full h-10 mt-4 rounded-xl bg-white/[0.03] hover:bg-[#27D7B2]/10 border border-white/[0.08] hover:border-[#27D7B2]/40 text-[#27D7B2] font-semibold text-xs flex items-center justify-between px-3.5 transition-all duration-150 cursor-pointer group"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#27D7B2] group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
