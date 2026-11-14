import React from 'react';
import { Modal, PrimaryButton } from '../DesignSystem';

interface WatchHowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartAnalysis: () => void;
}

export const WatchHowItWorksModal: React.FC<WatchHowItWorksModalProps> = ({
  isOpen,
  onClose,
  onStartAnalysis,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="How Field Shift Works"
      subtitle="From satellite observations to multi-season crop recommendations."
      maxWidth="2xl"
      footer={
        <div className="w-full flex items-center justify-between">
          <span className="text-[11px] text-[#718D9A] font-mono">
            Powered by NASA Earth Science Division
          </span>
          <PrimaryButton
            size="sm"
            showArrow
            onClick={() => {
              onClose();
              onStartAnalysis();
            }}
          >
            Start Analysis Now
          </PrimaryButton>
        </div>
      }
    >
      <div className="space-y-3.5">
        <div className="p-3.5 rounded-xl glass-card flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#42D6AE]/15 text-[#42D6AE] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
            1
          </div>
          <div>
            <div className="text-[13px] font-bold text-[#F0F7FA]">Satellite Data Retrieval</div>
            <p className="text-[12px] text-[#A7C0CC] mt-0.5 leading-relaxed">
              When you specify your field's coordinates, Field Shift queries NASA POWER for 30+ years of solar radiation, rainfall, and temperature extremes, alongside NASA SMAP for root-zone moisture percentiles.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl glass-card flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#42D6AE]/15 text-[#42D6AE] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
            2
          </div>
          <div>
            <div className="text-[13px] font-bold text-[#F0F7FA]">Soil & Moisture Capacity Modeling</div>
            <p className="text-[12px] text-[#A7C0CC] mt-0.5 leading-relaxed">
              Your soil texture (silt loam, sandy loam, clay) dictates field capacity and wilting points. The FAO-56 dual crop coefficient model tracks evapotranspiration stress day-by-day.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl glass-card flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#42D6AE]/15 text-[#42D6AE] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
            3
          </div>
          <div>
            <div className="text-[13px] font-bold text-[#F0F7FA]">Multi-Season Sequence Optimization</div>
            <p className="text-[12px] text-[#A7C0CC] mt-0.5 leading-relaxed">
              The engine evaluates thousands of 3-to-5 season permutations, enforcing botanical family break intervals, residual nitrogen credits from legumes, and pest cycle disruption.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl glass-card flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#42D6AE]/15 text-[#42D6AE] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
            4
          </div>
          <div>
            <div className="text-[13px] font-bold text-[#F0F7FA]">Stress-Tested Decision Support</div>
            <p className="text-[12px] text-[#A7C0CC] mt-0.5 leading-relaxed">
              Every candidate sequence is subjected to 300x Monte Carlo climate simulations, producing verified downside risk floors and interactive What-If scenario tools.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
