import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export interface NotificationProps {
  title: string;
  message?: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  onDismiss?: () => void;
  className?: string;
}

export const Notification: React.FC<NotificationProps> = ({
  title,
  message,
  variant = 'info',
  onDismiss,
  className = '',
}) => {
  const variantStyles = {
    info: {
      bg: 'bg-[#041E2B]/90 border-[#3BD9C2]/40',
      icon: <Info className="w-5 h-5 text-[#3BD9C2] shrink-0" />,
      text: 'text-[#F0F7FA]',
    },
    success: {
      bg: 'bg-[#041E2B]/90 border-[#42D6AE]/40',
      icon: <CheckCircle2 className="w-5 h-5 text-[#42D6AE] shrink-0" />,
      text: 'text-[#F0F7FA]',
    },
    warning: {
      bg: 'bg-[#041E2B]/90 border-amber-400/40',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
      text: 'text-[#F0F7FA]',
    },
    error: {
      bg: 'bg-[#041E2B]/90 border-rose-500/40',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
      text: 'text-[#F0F7FA]',
    },
  };

  const current = variantStyles[variant];

  return (
    <div
      role="alert"
      className={`p-4 rounded-xl border backdrop-blur-md shadow-lg shadow-black/40 flex items-start gap-3 transition-all ${current.bg} ${className}`}
    >
      {current.icon}
      <div className="flex-1 space-y-0.5 min-w-0">
        <h4 className="text-sm font-bold text-[#F0F7FA] tracking-tight">
          {title}
        </h4>
        {message && (
          <p className="text-xs text-[#A7C0CC] leading-relaxed">
            {message}
          </p>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-[#718D9A] hover:text-[#F0F7FA] p-1 transition-colors cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
