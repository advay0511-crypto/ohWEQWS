import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Clock,
  Droplet,
  Layers,
  Sparkles,
  MapPin,
  X,
} from 'lucide-react';
import { SavedFarmPlan, CalendarEvent, AppUnits } from '../../types';
import { loadCalendarEvents, saveCalendarEvent } from '../../store/farmStorage';

interface CropCalendarPageProps {
  farms: SavedFarmPlan[];
  activeFarmId: string;
  units: AppUnits;
  onOpenFarm: (farmId: string) => void;
}

export const CropCalendarPage: React.FC<CropCalendarPageProps> = ({
  farms,
  activeFarmId,
  units,
  onOpenFarm,
}) => {
  const selectedFarm = farms.find((f) => f.id === activeFarmId) || farms[0];
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const loaded = loadCalendarEvents();
    if (loaded.length > 0) return loaded;

    // Seed default crop cycle milestones if empty
    return [
      {
        id: 'evt_1',
        farmId: selectedFarm?.id || 'farm_1',
        title: 'Winter Wheat Sowing Window Opens',
        eventType: 'planting',
        date: '2026-10-28',
        endDate: '2026-11-15',
        isCompleted: false,
        source: 'plan',
        notes: 'Optimal soil temperature envelope for winter cereal emergence.',
      },
      {
        id: 'evt_2',
        farmId: selectedFarm?.id || 'farm_1',
        title: 'Pre-Planting Soil Nitrate & Moisture Test',
        eventType: 'soil_test',
        date: '2026-10-25',
        isCompleted: true,
        source: 'farmer_entry',
        notes: 'Verified residual nitrogen carryover from pulse break.',
      },
      {
        id: 'evt_3',
        farmId: selectedFarm?.id || 'farm_1',
        title: 'Early Emergence Supplemental Drip Irrigation (25mm)',
        eventType: 'irrigation',
        date: '2026-11-04',
        isCompleted: false,
        source: 'plan',
        notes: 'Target rhizosphere moisture recharge during early root establishment.',
      },
      {
        id: 'evt_4',
        farmId: selectedFarm?.id || 'farm_1',
        title: 'Winter Wheat Physiological Harvest Window',
        eventType: 'harvest',
        date: '2027-02-15',
        endDate: '2027-02-28',
        isCompleted: false,
        source: 'plan',
        notes: 'Estimated harvest window based on GDD accumulation.',
      },
    ];
  });

  const [currentMonth, setCurrentMonth] = useState<number>(9); // 0-indexed (9 = Oct)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('2026-10-30');
  const [newType, setNewType] = useState<CalendarEvent['eventType']>('irrigation');
  const [newNotes, setNewNotes] = useState('');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newEvt: CalendarEvent = {
      id: `evt_${Date.now()}`,
      farmId: selectedFarm?.id || 'farm_1',
      title: newTitle.trim(),
      eventType: newType,
      date: newDate,
      isCompleted: false,
      notes: newNotes,
      source: 'farmer_entry',
    };

    saveCalendarEvent(newEvt);
    setEvents([newEvt, ...events]);
    setNewTitle('');
    setNewNotes('');
    setShowAddModal(false);
  };

  const toggleComplete = (id: string) => {
    const updated = events.map((ev) => ev.id === id ? { ...ev, isCompleted: !ev.isCompleted } : ev);
    setEvents(updated);
    const target = updated.find((ev) => ev.id === id);
    if (target) saveCalendarEvent(target);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0B1410] text-[#EDF3EC] px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Hero Banner with Atmospheric Agricultural Imagery */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80"
              alt="Farm field sunrise"
              className="w-full h-full object-cover object-center filter brightness-50"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#070D0A] via-[#070D0A]/85 to-transparent" />
          </div>

          <div className="relative z-10 p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#89B96F] mb-1.5">
                <span>{selectedFarm?.name || 'Farm'}</span>
                <span>/</span>
                <span className="text-[#EDF3EC]">Crop Cycle Calendar</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#EDF3EC] flex items-center gap-3">
                <CalendarIcon className="w-7 h-7 text-[#89B96F]" />
                Field Milestones & Operational Schedule
              </h1>
              <p className="text-xs sm:text-sm text-[#B1BDB0] mt-1 max-w-xl">
                Track phenological stages, scheduled irrigation cycles, soil tests, and optimal planting windows.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Add Event</span>
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Month Navigation */}
        <div className="p-4 rounded-xl glass-panel flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-lg hover:bg-white/10 text-[#B1BDB0] hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base font-semibold text-[#EDF3EC] font-mono">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-lg hover:bg-white/10 text-[#B1BDB0] hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-xs font-mono text-[#89B96F] bg-[#89B96F]/10 px-3 py-1 rounded-full border border-[#89B96F]/30">
            Synchronized with Crop Lifecycle Engine
          </span>
        </div>

        {/* Scheduled Milestones Timeline View */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold text-[#819082] uppercase tracking-wider">
            Crop-Cycle Milestones & Field Tasks
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((evt) => {
              return (
                <div
                  key={evt.id}
                  className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    evt.isCompleted
                      ? 'bg-[#121F17]/80 border-white/5 opacity-75 backdrop-blur-sm'
                      : 'glass-panel border-white/10 hover:border-[#89B96F]/50 shadow-lg'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleComplete(evt.id)}
                        className={`mt-0.5 p-1 rounded transition-colors ${
                          evt.isCompleted ? 'text-[#79B77A]' : 'text-[#819082] hover:text-[#EDF3EC]'
                        }`}
                        title={evt.isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                            evt.eventType === 'planting'
                              ? 'bg-[#79B77A]/20 text-[#79B77A] border border-[#79B77A]/30'
                              : evt.eventType === 'irrigation'
                              ? 'bg-[#78B6C7]/20 text-[#78B6C7] border border-[#78B6C7]/30'
                              : evt.eventType === 'harvest'
                              ? 'bg-[#D7AC58]/20 text-[#D7AC58] border border-[#D7AC58]/30'
                              : 'bg-white/10 text-[#EDF3EC]'
                          }`}>
                            {evt.eventType}
                          </span>
                          <span className="text-sm font-semibold text-[#EDF3EC] truncate">{evt.title}</span>
                        </div>
                        {evt.notes && <p className="text-xs text-[#B1BDB0] mt-1.5">{evt.notes}</p>}
                      </div>
                    </div>

                    <div className="text-right shrink-0 text-xs font-mono font-bold text-[#89B96F]">
                      {evt.date}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#819082]">
                    <span>Source: {evt.source === 'plan' ? 'Recommended Plan' : 'Operator Log'}</span>
                    <span className={evt.isCompleted ? 'text-[#79B77A] font-semibold' : 'text-[#D7AC58]'}>
                      ● {evt.isCompleted ? 'Completed' : 'Upcoming'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[3px] p-4">
          <form onSubmit={handleCreateEvent} className="w-full max-w-md glass-modal border border-white/[0.16] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#293B2E] pb-3">
              <h3 className="text-base font-semibold text-[#EDF3EC]">Schedule Field Event</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#819082] hover:text-[#EDF3EC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#B1BDB0] mb-1">Event Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-[#19291F] border border-[#293B2E] text-xs text-[#EDF3EC] rounded-lg p-2.5 focus:border-[#89B96F] focus:outline-none"
                >
                  <option value="planting">Planting / Sowing</option>
                  <option value="irrigation">Irrigation Cycle</option>
                  <option value="soil_test">Soil Sampling / Testing</option>
                  <option value="harvest">Harvest</option>
                  <option value="inspection">Scouting / Inspection</option>
                  <option value="note">General Note</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#B1BDB0] mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Schedule drip line maintenance"
                  required
                  className="w-full bg-[#19291F] border border-[#293B2E] text-xs text-[#EDF3EC] rounded-lg p-2.5 placeholder:text-[#819082] focus:border-[#89B96F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#B1BDB0] mb-1">Target Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-[#19291F] border border-[#293B2E] text-xs text-[#EDF3EC] rounded-lg p-2.5 focus:border-[#89B96F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#B1BDB0] mb-1">Notes</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Agronomic purpose..."
                  rows={2}
                  className="w-full bg-[#19291F] border border-[#293B2E] text-xs text-[#EDF3EC] rounded-lg p-2.5 placeholder:text-[#819082] focus:border-[#89B96F] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs">
                Save Event
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
