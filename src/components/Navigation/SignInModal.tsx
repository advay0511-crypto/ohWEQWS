import React, { useState } from 'react';
import { User, Check, X, Building, Mail, Shield, Sparkles, Edit3 } from 'lucide-react';
import { UserProfile } from '../../types';

export interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLogin: (user: UserProfile) => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name || 'Bilal Abbasi');
  const [email, setEmail] = useState(currentUser.email || 'bilalaabbasi272011@gmail.com');
  const [org, setOrg] = useState(currentUser.organization || 'Al Marjan Agricultural Holdings');
  const [role, setRole] = useState(currentUser.role || 'Lead Agronomist');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const updated: UserProfile = {
      ...currentUser,
      name: name.trim(),
      email: email.trim() || 'bilalaabbasi272011@gmail.com',
      organization: org.trim() || 'Al Marjan Agricultural Holdings',
      role: role.trim() || 'Lead Agronomist',
      avatarLetter: name.trim().charAt(0).toUpperCase() || 'B',
    };
    onLogin(updated);
    setIsEditing(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[3px] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl glass-card border border-white/[0.16] shadow-2xl p-6 text-white space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#27D7B2]/25 to-[#12887A]/30 border border-[#27D7B2]/40 flex items-center justify-center text-[#27D7B2]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Agronomist Account</h3>
              <p className="text-xs text-slate-300">Verified User Credentials</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isEditing ? (
          <div className="space-y-4">
            {/* Active User Card with translucent gradient */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#27D7B2]/10 via-white/[0.04] to-black/30 border border-[#27D7B2]/30 space-y-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#27D7B2] to-[#12887A] text-[#020A10] font-black text-lg flex items-center justify-center shadow-md shadow-[#27D7B2]/25">
                  {currentUser.avatarLetter || 'B'}
                </div>
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>{currentUser.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#27D7B2]/20 text-[#27D7B2]">
                      Active
                    </span>
                  </div>
                  <div className="text-xs text-[#73CAD0] font-medium">{currentUser.role}</div>
                  <div className="text-xs text-slate-300">{currentUser.organization}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-xs text-slate-300">
                <Mail className="w-3.5 h-3.5 text-[#27D7B2]" />
                <span className="font-mono text-slate-200">{currentUser.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#27D7B2]" />
                <span>Edit Account Details</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[#27D7B2] hover:bg-[#20caa6] text-[#020A10] text-xs font-black transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-300 block mb-1 font-medium">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-white focus:outline-none focus:border-[#27D7B2]"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-white font-mono focus:outline-none focus:border-[#27D7B2]"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium">Organization / Farm Entity</label>
              <input
                type="text"
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-white focus:outline-none focus:border-[#27D7B2]"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium">Professional Role</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-white focus:outline-none focus:border-[#27D7B2]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#27D7B2] hover:bg-[#20caa6] text-[#020A10] font-black transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
