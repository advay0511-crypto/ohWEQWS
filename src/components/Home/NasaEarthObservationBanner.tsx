import React from 'react';
import { ArrowRight } from 'lucide-react';
import satelliteBannerImg from '../../assets/images/earth_satellite_banner_1790691731000.jpg';
import { SecondaryButton } from '../DesignSystem';

interface NasaEarthObservationBannerProps {
  onLearnMore: () => void;
}

export const NasaEarthObservationBanner: React.FC<NasaEarthObservationBannerProps> = ({
  onLearnMore,
}) => {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#49AABE]/25 h-auto sm:h-[160px] flex items-center shadow-xl">
      {/* Background Satellite & Earth Imagery */}
      <div className="absolute inset-0 z-0">
        <img
          src={satelliteBannerImg}
          alt="NASA Earth Observation satellite orbiting earth"
          className="w-full h-full object-cover object-[right_center]"
        />
        {/* Dark navy gradient overlay from left to right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#031923] via-[#031923]/90 sm:via-[#031923]/75 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 sm:px-8 max-w-[560px] space-y-2">
        <div className="text-[10px] font-bold tracking-[2px] uppercase text-[#718D9A]">
          REAL DATA. REAL INSIGHTS.
        </div>

        <h3 className="text-[18px] sm:text-[20px] font-bold tracking-tight text-[#F0F7FA]">
          NASA Earth Observation
        </h3>

        <p className="text-[12px] sm:text-[13px] leading-relaxed text-[#A7C0CC]">
          We use satellite data from NASA to understand your land's soil, moisture, vegetation and climate — so your plan is based on real conditions, not guesswork.
        </p>

        <div className="pt-1">
          <SecondaryButton
            type="button"
            onClick={onLearnMore}
            size="sm"
            icon={<ArrowRight className="w-3.5 h-3.5 order-last" />}
          >
            Learn more
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
};
