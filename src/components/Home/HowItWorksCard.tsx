import React from 'react';
import { Layers, MapPin, Sprout, Leaf, Sun, ArrowRight } from 'lucide-react';
import { GlassCard } from '../DesignSystem';

interface HowItWorksCardProps {
  onStartAnalysis?: () => void;
}

export const HowItWorksCard: React.FC<HowItWorksCardProps> = ({ onStartAnalysis }) => {
  const steps = [
    {
      step: '1. Location',
      label: "Your farm's location",
      icon: MapPin,
    },
    {
      step: '2. Farm Details',
      label: 'Soil, land, and history',
      icon: Sprout,
    },
    {
      step: '3. Current Crops',
      label: "What's growing now",
      icon: Leaf,
    },
    {
      step: '4. Climate & Goals',
      label: 'Your priorities',
      icon: Sun,
    },
  ];

  return (
    <GlassCard variant="default" className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#42D6AE]/10 border border-[#42D6AE]/20 flex items-center justify-center shrink-0">
          <Layers className="w-4 h-4 text-[#42D6AE]" />
        </div>
        <div>
          <h2 className="text-[16px] font-bold text-[#F0F7FA] tracking-tight">How It Works</h2>
          <p className="text-[12px] text-[#A7C0CC]">
            From your land to a tailored crop rotation plan — powered by real NASA data.
          </p>
        </div>
      </div>

      <div className="h-[1px] bg-[#49AABE]/20" />

      {/* 4-Step Horizontal Flow */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
        {steps.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={item.step} className="flex items-center justify-between">
              <div className="flex flex-col items-center text-center space-y-2 flex-1">
                {/* Circular dark-blue container with subtle blue border */}
                <div className="w-12 h-12 rounded-full bg-[#031923] border border-[#49AABE]/35 flex items-center justify-center shadow-md">
                  <Icon className="w-5 h-5 text-[#3BD9C2]" />
                </div>

                <div className="space-y-0.5">
                  <div className="text-[13px] font-bold text-[#F0F7FA]">
                    {item.step}
                  </div>
                  <div className="text-[11px] text-[#A7C0CC]">
                    {item.label}
                  </div>
                </div>
              </div>

              {/* Thin cyan arrow pointing to next step */}
              {idx < steps.length - 1 && (
                <div className="hidden md:flex items-center justify-center px-1 text-[#3BD9C2]/60">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};
