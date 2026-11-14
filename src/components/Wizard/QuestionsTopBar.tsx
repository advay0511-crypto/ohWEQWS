import React from 'react';
import { ArrowLeft, Check, X, HelpCircle, Save } from 'lucide-react';

interface QuestionsTopBarProps {
  currentStepIndex: number;
  totalSteps: number;
  stepTitle: string;
  isReview: boolean;
  onBack: () => void;
  onExit: () => void;
  onJumpToReview: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  isSaved?: boolean;
  onOpenGuide?: () => void;
  requiredStepNumber?: number;
  totalRequiredSteps?: number;
}

export const QuestionsTopBar: React.FC<QuestionsTopBarProps> = ({
  currentStepIndex,
  totalSteps,
  stepTitle,
  isReview,
  onBack,
  onExit,
  onJumpToReview,
  isSaved = true,
  onOpenGuide,
  requiredStepNumber = 1,
  totalRequiredSteps = 6,
}) => {
  // 3px progress track tied to actual required-step completion; optional sharpen excluded
  const progressPercent = isReview
    ? 100
    : Math.min(100, Math.round((requiredStepNumber / totalRequiredSteps) * 100));

  return (
    <header className="sticky top-0 z-50 w-full bg-[rgba(7,20,12,0.92)] backdrop-blur-[16px] border-b border-[rgba(226,241,228,0.12)] transition-colors">
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
        {/* Left: Back Action & Step Info */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-semibold text-[#F1F6EF] bg-[rgba(16,35,25,0.7)] hover:bg-[rgba(16,35,25,0.95)] border border-[rgba(226,241,228,0.12)] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#83C58E]" />
            <span>{currentStepIndex === 0 && !isReview ? 'Exit' : 'Back'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[rgba(226,241,228,0.1)]">
            <span className="text-xs font-mono font-medium text-[#83C58E]">
              {isReview ? 'REVIEW' : `STEP ${requiredStepNumber} OF ${totalRequiredSteps}`}
            </span>
            <span className="text-xs text-[#9BA99C]">·</span>
            <span className="text-xs font-medium text-[#F1F6EF] truncate max-w-[200px]">
              {isReview ? 'Review & Confirm' : stepTitle}
            </span>
          </div>
        </div>

        {/* Center: Step Title & Auto-saved Indicator */}
        <div className="flex items-center gap-2">
          {isSaved && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#83C58E] font-mono">
              <Check className="w-3 h-3 text-[#83C58E]" />
              <span className="hidden md:inline">Draft saved</span>
            </span>
          )}
        </div>

        {/* Right: Review Shortcut, Guide, Save & Exit */}
        <div className="flex items-center gap-2.5 shrink-0">
          {!isReview && (
            <button
              type="button"
              onClick={onJumpToReview}
              className="px-3 py-1.5 text-xs font-medium text-[#C0CEC2] hover:text-[#F1F6EF] bg-[rgba(16,35,25,0.6)] hover:bg-[rgba(16,35,25,0.85)] rounded-[10px] border border-[rgba(226,241,228,0.1)] transition-colors cursor-pointer hidden md:inline-flex"
            >
              <span>Review all</span>
            </button>
          )}

          {/* Guide Button */}
          {onOpenGuide && (
            <button
              type="button"
              onClick={onOpenGuide}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-[10px] bg-[rgba(131,197,142,0.12)] hover:bg-[rgba(131,197,142,0.22)] border border-[rgba(131,197,142,0.3)] text-[#83C58E] text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
              title="Open Setup Guide"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Guide</span>
            </button>
          )}

          {/* Save & Exit Button */}
          <button
            type="button"
            onClick={onExit}
            className="px-3 py-1.5 rounded-[10px] text-xs font-medium text-[#C0CEC2] hover:text-[#F1F6EF] bg-[rgba(16,35,25,0.6)] hover:bg-[rgba(16,35,25,0.9)] border border-[rgba(226,241,228,0.1)] transition-all cursor-pointer flex items-center gap-1.5"
            title="Save draft and exit"
          >
            <Save className="w-3.5 h-3.5 text-[#9BA99C]" />
            <span className="hidden sm:inline">Save & exit</span>
          </button>
        </div>
      </div>

      {/* 3px Progress Track across the bottom of the header */}
      <div className="w-full h-[3px] bg-[rgba(226,241,228,0.08)] relative overflow-hidden">
        <div
          className="h-full bg-[#83C58E] transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </header>
  );
};
