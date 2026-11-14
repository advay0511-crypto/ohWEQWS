import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { AlertTriangle, X, Check, ArrowRight } from 'lucide-react';
import { NasaAlert } from '../../types';

interface SwipeableAlertItemProps {
  alert: NasaAlert;
  onDismiss: (alertId: string) => void;
  onSelect?: () => void;
}

export const SwipeableAlertItem: React.FC<SwipeableAlertItemProps> = ({
  alert,
  onDismiss,
  onSelect,
}) => {
  const [isDismissing, setIsDismissing] = useState(false);
  const isCrit = alert.severity === 'critical';

  const x = useMotionValue(0);
  const opacity = useTransform(x, [-160, 0, 160], [0.2, 1, 0.2]);
  const background = useTransform(
    x,
    [-120, 0, 120],
    [
      'rgba(239, 68, 68, 0.25)',
      isCrit ? 'rgba(28, 13, 19, 0.9)' : 'rgba(26, 21, 8, 0.9)',
      'rgba(16, 185, 129, 0.25)',
    ]
  );

  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (Math.abs(info.offset.x) > 90 || Math.abs(info.velocity.x) > 400) {
      triggerDismiss();
    }
  };

  const triggerDismiss = () => {
    setIsDismissing(true);
    setTimeout(() => {
      onDismiss(alert.id);
    }, 220);
  };

  return (
    <AnimatePresence>
      {!isDismissing && (
        <motion.div
          layout
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0, transition: { duration: 0.2 } }}
          className="relative overflow-hidden rounded-xl touch-pan-y"
        >
          <motion.div
            drag="x"
            dragConstraints={{ left: -140, right: 140 }}
            dragElastic={0.4}
            onDragEnd={handleDragEnd}
            style={{ x, opacity, background }}
            className={`p-3.5 sm:p-4 rounded-xl border transition-colors cursor-grab active:cursor-grabbing select-none relative ${
              isCrit ? 'border-rose-500/40' : 'border-amber-500/40'
            }`}
          >
            {/* Header row: Icon + Simple Title + Severity badge + Dismiss button */}
            <div className="flex items-start justify-between gap-2.5">
              <div
                className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                onClick={onSelect}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    isCrit ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                  {alert.title}
                </h4>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                    isCrit
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {isCrit ? 'Important' : 'Notice'}
                </span>

                {/* Dismiss button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerDismiss();
                  }}
                  title="Dismiss alert"
                  aria-label="Dismiss alert"
                  className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 text-[#A7C0CC] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Simple everyday warning text */}
            <p className="text-xs text-slate-200 mt-2 font-sans leading-relaxed">
              {alert.boldWarning || alert.shortAlert}
            </p>

            {/* Practical What To Do */}
            <div className="mt-2.5 pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px]">
              <div className="text-slate-300">
                <span className="text-[#27D7B2] font-semibold font-mono mr-1">Advice:</span>
                <span>{alert.actionRecommendation || alert.conciseAction}</span>
              </div>
              <span className="text-[10px] text-[#718D9A] font-mono hidden sm:inline-block shrink-0 ml-2">
                Swipe to dismiss →
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
