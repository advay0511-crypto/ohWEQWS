import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

export interface DropdownProps {
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  selectedValue,
  onSelect,
  label,
  placeholder = 'Select option...',
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === selectedValue);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-mono uppercase tracking-wider text-[#A7C0CC] mb-1.5">
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-[42px] px-3.5 rounded-lg bg-[#041E2B]/80 backdrop-blur-md border border-[#49AABE]/30 hover:border-[#42D6AE]/50 text-left text-sm text-[#F0F7FA] flex items-center justify-between gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="truncate flex items-center gap-2">
          {selected?.icon}
          {selected ? selected.label : <span className="text-[#718D9A]">{placeholder}</span>}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#A7C0CC] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#42D6AE]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-[#041E2B] border border-[#49AABE]/40 rounded-xl shadow-xl shadow-black/50 overflow-hidden py-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          {options.map((opt) => {
            const isMatch = opt.value === selectedValue;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onSelect(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 text-left text-xs sm:text-sm flex items-center justify-between transition-colors cursor-pointer ${
                  isMatch
                    ? 'bg-[#42D6AE]/15 text-[#42D6AE] font-semibold'
                    : 'text-[#F0F7FA] hover:bg-[#49AABE]/15 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {opt.icon}
                  <div className="truncate">
                    <div>{opt.label}</div>
                    {opt.sublabel && (
                      <div className="text-[11px] text-[#718D9A] font-normal truncate">
                        {opt.sublabel}
                      </div>
                    )}
                  </div>
                </div>

                {isMatch && <Check className="w-4 h-4 text-[#42D6AE] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
