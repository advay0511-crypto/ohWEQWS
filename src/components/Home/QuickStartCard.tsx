import React from 'react';
import { Zap } from 'lucide-react';
import { GlassCard, PrimaryButton } from '../DesignSystem';

interface QuickStartCardProps {
  onStartAnalysis: () => void;
}

export const QuickStartCard: React.FC<QuickStartCardProps> = ({ onStartAnalysis }) => {
  const steps = [
    {
      number: '1',
      title: 'Location',
      desc: 'Tell us where your farm is.',
    },
    {
      number: '2',
      title: 'Farm Details',
      desc: 'Share your land and soil info.',
    },
    {
      number: '3',
      title: 'Current Crops',
      desc: "What's growing now?",
    },
    {
      number: '4',
      title: 'Climate & Goals',
      desc: 'Tell us your priorities.',
    },
  ];

  return (
    <GlassCard variant="default" className="p-5 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-start gap-2.5 pb-2">
        <div className="w-8 h-8 rounded-lg bg-[#42D6AE]/10 border border-[#42D6AE]/20 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-[#42D6AE]" />
        </div>
        <div>
          <h2 className="text-[16px] font-bold text-[#F0F7FA] tracking-tight">Quick Start</h2>
          <p className="text-[12px] text-[#A7C0CC]">Get a rotation plan in 4 simple steps.</p>
        </div>
      </div>

      {/* 4 Vertical Steps */}
      <div className="space-y-2.5 py-1">
        {steps.map((s, idx) => (
          <div key={s.number}>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 font-bold text-[12px] flex items-center justify-center shrink-0">
                {s.number}
              </div>

              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-[13px] font-bold text-[#F0F7FA] shrink-0">
                  {s.title}
                </span>
                <span className="text-[12px] text-[#718D9A] truncate">
                  {s.desc}
                </span>
              </div>
            </div>

            {idx < steps.length - 1 && (
              <div className="h-[1px] bg-[#49AABE]/15 mt-2 ml-9" />
            )}
          </div>
        ))}
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <PrimaryButton
          type="button"
          onClick={onStartAnalysis}
          fullWidth
          showArrow
          size="sm"
        >
          START 4-STEP ANALYSIS
        </PrimaryButton>
      </div>
    </GlassCard>
  );
};
