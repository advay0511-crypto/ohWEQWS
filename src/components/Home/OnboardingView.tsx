import React from 'react';
import {
  MapPin,
  Layers,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Compass,
  CheckCircle2,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import heroFarmlandImg from '../../assets/images/hero_farmland_1790691713410.jpg';
import { WizardDraft } from '../../store/farmStorage';

interface OnboardingViewProps {
  onAddFarm: () => void;
  onExploreDemo: () => void;
  onResumeDraft?: () => void;
  savedDraft?: WizardDraft | null;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  onAddFarm,
  onExploreDemo,
  onResumeDraft,
  savedDraft,
}) => {
  const hasDraft = Boolean(savedDraft && savedDraft.currentStep > 0);

  return (
    <div className="w-full flex flex-col space-y-8 pb-16">
      {/* ===================================================================== */}
      {/* 1. ONBOARDING HERO MODULE (300-360px desktop, 12-col grid, max-w-[1480px]) */}
      {/* ===================================================================== */}
      <div className="max-w-[1480px] w-full mx-auto px-4 sm:px-6 lg:px-10">
        <div className="relative w-full min-h-[320px] lg:h-[350px] rounded-2xl overflow-hidden border border-[rgba(226,241,228,0.12)] shadow-[0_12px_32px_rgba(0,0,0,0.25)] flex items-center">
          {/* Real aerial landscape background with realistic directional light */}
          <div className="absolute inset-0 z-0">
            <img
              src={heroFarmlandImg}
              alt="Panoramic aerial view of real agricultural fields"
              className="w-full h-full object-cover object-[center_35%]"
            />
            {/* Left-to-right directional scrim protecting text contrast */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, rgba(4,15,20,0.92) 0%, rgba(4,15,20,0.84) 45%, rgba(4,15,20,0.48) 75%, rgba(4,15,20,0.28) 100%)',
              }}
            />
            {/* Subtle bottom-up shadow grounding the hero */}
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(4,15,20,0.7)] via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Hero Content: 12-column grid (Left 7 cols copy, Right 5 cols glass inset) */}
          <div className="relative z-10 w-full h-full px-6 sm:px-10 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* LEFT 7 COLUMNS: Headline, summary, primary & secondary CTAs */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[#83C58E]">
                <span>FIELD SHIFT ONBOARDING</span>
                <span aria-hidden="true">·</span>
                <span>NASA EARTH OBSERVATION</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-semibold text-[#F1F6EF] leading-[1.08] tracking-tight max-w-[580px]">
                Understand your land. Plan better rotations.
              </h1>

              <p className="text-sm sm:text-base text-[#C0CEC2] leading-relaxed max-w-[540px]">
                Ground your multi-season crop decisions in verified satellite climate history, soil water-holding physics, and regional disease breaks — without guesswork or fake metrics.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {/* Primary Action: Add First Farm */}
                <button
                  type="button"
                  onClick={onAddFarm}
                  className="px-6 py-3 rounded-[10px] bg-[#83C58E] hover:bg-[#97D4A2] text-[#07130C] font-semibold text-sm transition-all shadow-[0_4px_16px_rgba(131,197,142,0.3)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2"
                >
                  <span>Add your first farm</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Resumable draft button if one exists */}
                {hasDraft && onResumeDraft && (
                  <button
                    type="button"
                    onClick={onResumeDraft}
                    className="px-4 py-3 rounded-[10px] bg-[rgba(8,23,14,0.78)] hover:bg-[rgba(16,35,25,0.9)] text-[#F1F6EF] border border-[rgba(131,197,142,0.4)] text-sm font-medium transition-all cursor-pointer flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4 text-[#83C58E]" />
                    <span>Continue setup (Draft)</span>
                  </button>
                )}

                {/* Secondary Action: Explore Deterministic Demo */}
                <button
                  type="button"
                  onClick={onExploreDemo}
                  className="px-4 py-3 rounded-[10px] bg-[rgba(7,20,12,0.6)] hover:bg-[rgba(7,20,12,0.85)] text-[#C0CEC2] hover:text-white border border-[rgba(226,241,228,0.16)] text-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>Explore demo farm</span>
                </button>
              </div>

              {hasDraft && (
                <div className="text-xs text-[#9BA99C] flex items-center gap-1.5 pt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#83C58E]" />
                  <span>Draft saved locally. Pick up right where you left off.</span>
                </div>
              )}
            </div>

            {/* RIGHT 5 COLUMNS: Restrained glass inset (--fs-glass-strong, 88% opaque / 16px radius / 16px padding / 14px blur) */}
            <div className="lg:col-span-5 hidden lg:block">
              <div
                className="w-full rounded-[16px] p-5 space-y-3.5 border border-[rgba(226,241,228,0.12)] shadow-[0_12px_32px_rgba(0,0,0,0.3)] backdrop-blur-[14px]"
                style={{ backgroundColor: 'var(--fs-glass-strong, rgba(7, 20, 12, 0.88))' }}
              >
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(226,241,228,0.08)]">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#83C58E] font-semibold">
                    Setup Summary
                  </span>
                  <span className="text-[11px] text-[#9BA99C]">3 Quick Steps</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[rgba(131,197,142,0.15)] border border-[rgba(131,197,142,0.3)] text-[#83C58E] flex items-center justify-center shrink-0 text-xs font-mono font-bold">
                      1
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#F1F6EF]">Farm & Location</div>
                      <div className="text-xs text-[#9BA99C] leading-snug">
                        Search address, drop coordinate pin, or draw field boundary.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[rgba(131,197,142,0.15)] border border-[rgba(131,197,142,0.3)] text-[#83C58E] flex items-center justify-center shrink-0 text-xs font-mono font-bold">
                      2
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#F1F6EF]">Field Profile & Soil</div>
                      <div className="text-xs text-[#9BA99C] leading-snug">
                        Soil texture, water access, and previous crop history.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[rgba(131,197,142,0.15)] border border-[rgba(131,197,142,0.3)] text-[#83C58E] flex items-center justify-center shrink-0 text-xs font-mono font-bold">
                      3
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#F1F6EF]">Rotation Strategy</div>
                      <div className="text-xs text-[#9BA99C] leading-snug">
                        Ranked candidate sequences, soil health trajectories, and risks.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-[#9BA99C] border-t border-[rgba(226,241,228,0.08)] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#73CAD0]" />
                  <span>Local-first storage. No account or credit card required.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. INSTRUCTIONAL PROCESS ROW (Location → Field Details → Recommendations) */}
      {/* ===================================================================== */}
      <div className="max-w-[1480px] w-full mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Step 1 Card */}
          <div className="p-5 rounded-2xl glass-card glass-card-hover border border-white/[0.14] shadow-lg space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-[#27D7B2] shadow-sm">
                <MapPin className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-white">1. Location & Geography</h2>
            </div>
            <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed">
              Pinpoint your farm on the interactive global map or draw field polygons. Field Shift links directly to NASA POWER 10-year solar and precipitation records for your coordinates.
            </p>
          </div>

          {/* Step 2 Card */}
          <div className="p-5 rounded-2xl glass-card glass-card-hover border border-white/[0.14] shadow-lg space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-[#73CAD0] shadow-sm">
                <Layers className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-white">2. Field Conditions</h2>
            </div>
            <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed">
              Specify soil texture (from sandy loam to clay), water availability (rain-fed, drip, or pivot), and past crop sequences to prevent pest buildup and nutrient depletion.
            </p>
          </div>

          {/* Step 3 Card */}
          <div className="p-5 rounded-2xl glass-card glass-card-hover border border-white/[0.14] shadow-lg space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-[#E6B86A] shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-white">3. Multi-Season Plan</h2>
            </div>
            <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed">
              Explore transparent, ranked crop sequences with calibrated soil organic matter trajectories, water stress estimates, and practical management steps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
