import React, { useState } from 'react';
import { Plus, MapPin, Trash2, Edit2 } from 'lucide-react';
import { SavedFarmPlan } from '../../types';
import { Modal, PrimaryButton, StatusBadge } from '../DesignSystem';

interface FarmSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  farms: SavedFarmPlan[];
  activeFarmId: string;
  onSelectFarm: (farmId: string) => void;
  onCreateNewFarm: () => void;
  onRenameFarm: (farmId: string, newName: string) => void;
  onDeleteFarm: (farmId: string) => void;
}

export const FarmSwitcherModal: React.FC<FarmSwitcherModalProps> = ({
  isOpen,
  onClose,
  farms,
  activeFarmId,
  onSelectFarm,
  onCreateNewFarm,
  onRenameFarm,
  onDeleteFarm,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleStartRename = (farm: SavedFarmPlan, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(farm.id);
    setEditName(farm.name);
  };

  const handleSaveRename = (farmId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim()) {
      onRenameFarm(farmId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Saved Farms & Plans"
      subtitle="Select a farm to view its analytics, or set up a new agricultural parcel."
      maxWidth="2xl"
      footer={
        <div className="w-full flex items-center justify-between">
          <span className="text-xs text-[#A7C0CC] font-mono">
            {farms.length} {farms.length === 1 ? 'Farm' : 'Farms'} saved
          </span>

          <PrimaryButton
            size="sm"
            onClick={() => {
              onCreateNewFarm();
              onClose();
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Setup New Farm
          </PrimaryButton>
        </div>
      }
    >
      <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
        {farms.map((farm) => {
          const isActive = farm.id === activeFarmId;
          const topRotation = farm.analysis?.rotations?.[0];
          const updatedDate = new Date(farm.updatedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          return (
            <div
              key={farm.id}
              onClick={() => {
                if (editingId !== farm.id) {
                  onSelectFarm(farm.id);
                  onClose();
                }
              }}
              className={`p-4 rounded-xl text-left transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card ${
                isActive
                  ? 'border-[#27D7B2] shadow-lg shadow-[#27D7B2]/20 ring-1 ring-[#27D7B2]/40'
                  : 'glass-card-hover'
              }`}
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                {editingId === farm.id ? (
                  <form onSubmit={(e) => handleSaveRename(farm.id, e)} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                      className="px-2.5 py-1 text-sm bg-[#031923] border border-[#42D6AE] rounded-lg text-white font-semibold focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 text-xs bg-[#42D6AE] text-[#031923] rounded-lg font-bold"
                    >
                      Save
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-[#F0F7FA] truncate">{farm.name}</span>
                    {isActive && (
                      <StatusBadge label="Active Farm" variant="success" size="sm" pulse={false} />
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs text-[#A7C0CC]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#42D6AE]" />
                    {farm.locationName}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{farm.farmAnswers.soilTexture.replace('_', ' ')}</span>
                  <span aria-hidden="true">·</span>
                  <span>Updated {updatedDate}</span>
                </div>
              </div>

              {/* Score & Actions */}
              <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end">
                {topRotation ? (
                  <div className="flex flex-col items-end text-right">
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold font-mono text-[#F0F7FA] tabular-nums">
                        {topRotation.totalScore}
                      </span>
                      <span className="text-xs text-[#A7C0CC]">/100</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#42D6AE] font-medium">
                      {topRotation.cycleLengthSeasons}-Season Plan
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-[#718D9A] italic">No analysis run</span>
                )}

                <div className="flex items-center gap-1 pl-2 border-l border-[#49AABE]/25">
                  <button
                    type="button"
                    onClick={(e) => handleStartRename(farm, e)}
                    className="p-1.5 rounded-lg text-[#A7C0CC] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                    title="Rename Farm"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {farms.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFarm(farm.id);
                      }}
                      className="p-1.5 rounded-lg text-[#718D9A] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete Farm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
