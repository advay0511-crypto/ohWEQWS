import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Check,
  Calendar as CalendarIcon,
  Droplet,
  Sprout,
  Sparkles,
  Layers,
  ArrowRight,
  Clock,
  Download,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  Info,
  ExternalLink,
  ShieldAlert,
  Search,
  CheckCircle2,
  FlaskConical,
  Eye,
  Leaf,
  CalendarDays,
  ListOrdered,
  Grid3X3,
  X,
  FileDown,
  TrendingUp,
} from 'lucide-react';
import { SavedFarmPlan, AnalysisPayload, CalendarEvent, FarmTask } from '../../types';
import {
  loadCalendarEvents,
  saveCalendarEvent,
  deleteCalendarEvent,
  loadFarmTasks,
  saveFarmTask,
} from '../../store/farmStorage';
import { getCropImage } from '../../services/cropImages';

export interface CropCalendarViewProps {
  activeFarm?: SavedFarmPlan | null;
  allFarms?: SavedFarmPlan[];
  analysis?: AnalysisPayload | null;
  onNavigateTab?: (tab: string) => void;
  onOpenFarmDetail?: (farmId: string, initialSection?: 'tracker' | 'rotations' | 'settings', cropFilter?: string) => void;
  onOpenCropRotation?: (farmId: string, cropName?: string | null) => void;
  onOpenGuide?: () => void;
}

type CalendarViewMode = 'month' | 'agenda' | 'multi_field';
type EventCategoryFilter = 'all' | 'planting' | 'irrigation' | 'soil_test' | 'scouting' | 'fertilizer' | 'harvest' | 'rotation_transition' | 'analysis';
type CertaintyFilter = 'all' | 'planned' | 'observed' | 'modelled';

export const CropCalendarView: React.FC<CropCalendarViewProps> = ({
  activeFarm,
  allFarms = [],
  analysis,
  onNavigateTab,
  onOpenFarmDetail,
  onOpenCropRotation,
  onOpenGuide,
}) => {
  // Selected farm scope
  const [selectedFarmId, setSelectedFarmId] = useState<string>(activeFarm?.id || allFarms[0]?.id || 'farm_1');
  const currentFarm = useMemo(() => {
    return allFarms.find((f) => f.id === selectedFarmId) || activeFarm || allFarms[0];
  }, [allFarms, selectedFarmId, activeFarm]);

  // Selected field filter
  const [selectedFieldId, setSelectedFieldId] = useState<string>('all');

  // Calendar view mode
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<EventCategoryFilter>('all');
  const [certaintyFilter, setCertaintyFilter] = useState<CertaintyFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calendar month state
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 2, 1)); // Default to March 2026 active cycle
  const [selectedDay, setSelectedDay] = useState<number>(15);

  // Modals & Contextual drawer state
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRevisionAlert, setShowRevisionAlert] = useState(true);

  // Form State for Adding an Event
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(() => '2026-03-15');
  const [newEndDate, setNewEndDate] = useState('');
  const [newType, setNewType] = useState<string>('planting');
  const [newFieldName, setNewFieldName] = useState('North Parcel');
  const [newCropName, setNewCropName] = useState('Chickpea');
  const [newCertainty, setNewCertainty] = useState<'planned' | 'observed' | 'modelled'>('planned');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newNotes, setNewNotes] = useState('');

  // Calendar Events State initialized with realistic rotation events
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const loaded = loadCalendarEvents();
    if (loaded.length > 0) return loaded;

    const baseFarmId = currentFarm?.id || 'farm_1';
    const initialEvents: CalendarEvent[] = [
      {
        id: 'evt_1',
        farmId: baseFarmId,
        fieldId: 'field_north',
        fieldName: 'North Valley Field',
        cropName: 'Chickpea',
        title: 'Spring Chickpea Sowing Window',
        eventType: 'planting',
        date: '2026-03-10',
        endDate: '2026-03-24',
        isCompleted: false,
        source: 'plan',
        certaintyBasis: 'planned',
        priority: 'high',
        stage: 'Seeding / Germination',
        evidence: 'GDD model predicts 11.2°C base temperature envelope with 42mm soil water reserve.',
        notes: 'Target 4-5cm planting depth to leverage subsoil moisture from winter rainfall.',
        auditLog: [
          { action: 'Created from Rotation Plan', timestamp: '2026-02-15 09:00' }
        ]
      },
      {
        id: 'evt_2',
        farmId: baseFarmId,
        fieldId: 'field_center',
        fieldName: 'Central Pivot Parcel',
        cropName: 'Hard Red Winter Wheat',
        title: 'Stem Elongation (Zadoks 31) Scouting',
        eventType: 'scouting',
        date: '2026-03-15',
        isCompleted: true,
        completedAt: '2026-03-15 14:30',
        source: 'farmer_entry',
        certaintyBasis: 'observed',
        priority: 'medium',
        stage: 'Stem Elongation',
        evidence: 'Visual scout confirmed first node detectable. No stripe rust symptoms observed.',
        notes: 'Canopy closure reaching 72%. NDVI matching 90th percentile.',
        auditLog: [
          { action: 'Created from Routine Task', timestamp: '2026-03-01 08:30' },
          { action: 'Marked Complete by Farmer', timestamp: '2026-03-15 14:30' }
        ]
      },
      {
        id: 'evt_3',
        farmId: baseFarmId,
        fieldId: 'field_center',
        fieldName: 'Central Pivot Parcel',
        cropName: 'Hard Red Winter Wheat',
        title: 'Pre-Booting Supplemental Irrigation (25mm)',
        eventType: 'irrigation',
        date: '2026-03-18',
        isCompleted: false,
        source: 'plan',
        certaintyBasis: 'modelled',
        priority: 'high',
        stage: 'Booting / Flag Leaf',
        evidence: 'NASA SMAP shows 38th percentile root-zone moisture; ET forecast exceeds 4.5mm/day.',
        notes: 'Run irrigation during night hours to avoid wind drift and evaporative loss.',
        auditLog: [
          { action: 'Generated from Moisture Balance', timestamp: '2026-03-10 11:20' }
        ]
      },
      {
        id: 'evt_4',
        farmId: baseFarmId,
        fieldId: 'field_south',
        fieldName: 'South Terraces',
        cropName: 'Cover Crop Mix',
        title: 'Pre-Planting Soil Nitrate & Organic Carbon Test',
        eventType: 'soil_test',
        date: '2026-03-22',
        isCompleted: false,
        source: 'farmer_entry',
        certaintyBasis: 'planned',
        priority: 'medium',
        stage: 'Soil Preparation',
        evidence: 'Sample 0-30cm core to quantify nitrogen fixation credits before warm grain cycle.',
        notes: 'Kit sent to regional testing lab. Collect 12 composite cores.',
      },
      {
        id: 'evt_5',
        farmId: baseFarmId,
        fieldId: 'field_north',
        fieldName: 'North Valley Field',
        cropName: 'Chickpea',
        title: 'Rhizobium Inoculant & Starter Nutrition Top-Dress',
        eventType: 'fertilizer',
        date: '2026-03-27',
        isCompleted: false,
        source: 'plan',
        certaintyBasis: 'modelled',
        priority: 'low',
        stage: 'Early Vegetative (V2)',
        evidence: 'Inoculant ensures effective nodulation for 45 kg N/ha residual credit.',
        notes: 'Apply during calm morning conditions; ensure seed furrows are closed.',
      },
      {
        id: 'evt_6',
        farmId: baseFarmId,
        fieldId: 'field_center',
        fieldName: 'Central Pivot Parcel',
        cropName: 'Hard Red Winter Wheat',
        title: 'Winter Wheat Heading & Anthesis Assessment',
        eventType: 'scouting',
        date: '2026-04-05',
        isCompleted: false,
        source: 'plan',
        certaintyBasis: 'planned',
        priority: 'high',
        stage: 'Heading / Flowering',
        evidence: 'Critical period for Fusarium head blight risk based on air humidity trends.',
        notes: 'Check flowering stage across all quadrant zones.',
      },
      {
        id: 'evt_7',
        farmId: baseFarmId,
        fieldId: 'field_north',
        fieldName: 'North Valley Field',
        cropName: 'Chickpea',
        title: 'Pod Filling & Soil Moisture Check',
        eventType: 'scouting',
        date: '2026-04-18',
        isCompleted: false,
        source: 'plan',
        certaintyBasis: 'modelled',
        priority: 'medium',
        stage: 'Pod Formation',
        evidence: 'NASA POWER shows 28°C peak temperature forecast; assess heat stress buffer.',
      },
    ];

    initialEvents.forEach((ev) => saveCalendarEvent(ev));
    return initialEvents;
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonthName = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(now.getDate());
  };

  // Rotation sequence for visual cycle ribbon
  const activeRotation = currentFarm?.analysis?.rotations?.[0];
  const sequence = activeRotation?.sequence || [
    { cropName: 'Hard Red Winter Wheat', sowingMonth: 9, harvestMonth: 6, durationDays: 270, family: 'Poaceae (Grass)' },
    { cropName: 'Chickpea', sowingMonth: 3, harvestMonth: 8, durationDays: 130, family: 'Fabaceae (Legume)' },
    { cropName: 'Grain Sorghum', sowingMonth: 5, harvestMonth: 10, durationDays: 120, family: 'Poaceae (Cereal)' },
  ];

  // Distinct field list
  const availableFields = useMemo(() => {
    const fields = new Set<string>();
    events.forEach((e) => {
      if (e.fieldName) fields.add(e.fieldName);
    });
    return Array.from(fields);
  }, [events]);

  // Days in current month
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    return { totalDays, firstDayIndex };
  }, [currentDate]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (selectedFarmId !== 'all' && e.farmId && e.farmId !== selectedFarmId && currentFarm?.id && e.farmId !== currentFarm.id) {
        return false;
      }
      if (selectedFieldId !== 'all' && e.fieldName !== selectedFieldId) {
        return false;
      }
      if (categoryFilter !== 'all' && e.eventType !== categoryFilter) {
        return false;
      }
      if (certaintyFilter !== 'all' && e.certaintyBasis !== certaintyFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = e.title.toLowerCase().includes(q);
        const matchesCrop = e.cropName?.toLowerCase().includes(q);
        const matchesField = e.fieldName?.toLowerCase().includes(q);
        const matchesNotes = e.notes?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCrop && !matchesField && !matchesNotes) return false;
      }
      return true;
    });
  }, [events, selectedFarmId, currentFarm, selectedFieldId, categoryFilter, certaintyFilter, searchQuery]);

  // Events grouped by day for current month
  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    filteredEvents.forEach((ev) => {
      const parts = ev.date.split('-');
      if (parts.length === 3) {
        const evYear = parseInt(parts[0], 10);
        const evMonth = parseInt(parts[1], 10);
        const evDay = parseInt(parts[2], 10);

        if (evYear === year && evMonth === month) {
          const arr = map.get(evDay) || [];
          arr.push(ev);
          map.set(evDay, arr);
        }
      }
    });

    return map;
  }, [filteredEvents, currentDate]);

  // Workload density calculation for strip above month
  const weeklyDensity = useMemo(() => {
    const totalDays = daysInMonth.totalDays;
    const weeks = [0, 0, 0, 0, 0];
    for (let day = 1; day <= totalDays; day++) {
      const evCount = eventsByDay.get(day)?.length || 0;
      const weekIdx = Math.min(Math.floor((day - 1) / 7), 4);
      weeks[weekIdx] += evCount;
    }
    const maxVal = Math.max(...weeks, 1);
    return weeks.map((count) => ({
      count,
      pct: Math.min(100, Math.round((count / maxVal) * 100)),
    }));
  }, [daysInMonth, eventsByDay]);

  // Selected date events
  const selectedDayEvents = useMemo(() => {
    return eventsByDay.get(selectedDay) || [];
  }, [eventsByDay, selectedDay]);

  // Upcoming 14 days events for agenda view
  const upcomingEvents = useMemo(() => {
    const start = new Date(currentYear, currentDate.getMonth(), selectedDay || 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 14);

    return filteredEvents.filter((ev) => {
      const d = new Date(ev.date);
      return d >= start && d <= end;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredEvents, currentYear, currentDate, selectedDay]);

  // Multi-field overlay rows
  const multiFieldRows = useMemo(() => {
    const fieldMap = new Map<string, CalendarEvent[]>();
    filteredEvents.forEach((ev) => {
      const field = ev.fieldName || 'Main Field';
      const arr = fieldMap.get(field) || [];
      arr.push(ev);
      fieldMap.set(field, arr);
    });
    return Array.from(fieldMap.entries()).map(([fieldName, fieldEvents]) => ({
      fieldName,
      cropName: fieldEvents[0]?.cropName || 'Winter Wheat',
      events: fieldEvents,
      activeEvent: fieldEvents.find((e) => !e.isCompleted) || fieldEvents[0],
    }));
  }, [filteredEvents]);

  // Handlers for task mutations
  const handleToggleComplete = useCallback((event: CalendarEvent) => {
    const isNowCompleted = !event.isCompleted;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const updated: CalendarEvent = {
      ...event,
      isCompleted: isNowCompleted,
      completedAt: isNowCompleted ? nowStr : undefined,
      auditLog: [
        ...(event.auditLog || []),
        {
          action: isNowCompleted ? 'Marked complete by farmer' : 'Reopened by farmer',
          timestamp: nowStr,
        },
      ],
    };
    saveCalendarEvent(updated);
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    if (selectedEvent?.id === event.id) {
      setSelectedEvent(updated);
    }
  }, [selectedEvent]);

  const handleDeferEvent = useCallback((event: CalendarEvent, daysToAdd: number) => {
    const current = new Date(event.date);
    current.setDate(current.getDate() + daysToAdd);
    const pad = (n: number) => String(n).padStart(2, '0');
    const newDateStr = `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const updated: CalendarEvent = {
      ...event,
      date: newDateStr,
      auditLog: [
        ...(event.auditLog || []),
        {
          action: `Deferred by +${daysToAdd} days (New date: ${newDateStr})`,
          timestamp: nowStr,
        },
      ],
    };
    saveCalendarEvent(updated);
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    if (selectedEvent?.id === event.id) {
      setSelectedEvent(updated);
    }
  }, [selectedEvent]);

  const handleDeleteEvent = useCallback((eventId: string) => {
    deleteCalendarEvent(eventId);
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    if (selectedEvent?.id === eventId) {
      setSelectedEvent(null);
    }
  }, [selectedEvent]);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newEv: CalendarEvent = {
      id: `evt_${Date.now()}`,
      farmId: currentFarm?.id || 'farm_1',
      fieldName: newFieldName,
      cropName: newCropName,
      title: newTitle.trim(),
      eventType: newType,
      date: newDate,
      endDate: newEndDate || undefined,
      isCompleted: false,
      source: 'farmer_entry',
      certaintyBasis: newCertainty,
      priority: newPriority,
      notes: newNotes.trim() || undefined,
      auditLog: [
        {
          action: 'Manually logged by farmer',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        },
      ],
    };

    saveCalendarEvent(newEv);
    setEvents((prev) => [newEv, ...prev]);
    setShowAddModal(false);
    setNewTitle('');
    setNewNotes('');
  };

  // Export to standard .ics file
  const handleExportICS = useCallback(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const now = new Date();
    const dtStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

    const farmName = currentFarm?.name || 'My Farm';
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Field Shift//Agro Resource Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:Field Shift - ${farmName}`,
    ];

    filteredEvents.forEach((evt) => {
      const dateClean = evt.date.replace(/-/g, '');
      const uid = `${evt.id}@fieldshift.app`;
      icsLines.push('BEGIN:VEVENT');
      icsLines.push(`UID:${uid}`);
      icsLines.push(`DTSTAMP:${dtStamp}`);
      icsLines.push(`DTSTART;VALUE=DATE:${dateClean}`);
      if (evt.endDate) {
        const endClean = evt.endDate.replace(/-/g, '');
        icsLines.push(`DTEND;VALUE=DATE:${endClean}`);
      }
      icsLines.push(`SUMMARY:${evt.title.replace(/,/g, '\\,')}`);
      const desc = `${evt.cropName ? `Crop: ${evt.cropName} | ` : ''}${evt.stage ? `Stage: ${evt.stage} | ` : ''}${evt.notes || evt.evidence || 'Field Shift Agronomic Operation'}`;
      icsLines.push(`DESCRIPTION:${desc.replace(/\n/g, '\\n')}`);
      if (evt.fieldName) {
        icsLines.push(`LOCATION:${evt.fieldName}`);
      }
      icsLines.push(`STATUS:${evt.isCompleted ? 'COMPLETED' : 'CONFIRMED'}`);
      icsLines.push('END:VEVENT');
    });

    icsLines.push('END:VCALENDAR');
    const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `field-shift-calendar-${farmName.toLowerCase().replace(/\s+/g, '-')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [filteredEvents, currentFarm]);

  // Helper icon renderer for operation classes
  const renderEventIcon = (type: string, className = 'w-3.5 h-3.5') => {
    switch (type) {
      case 'planting':
        return <Sprout className={`${className} text-[#27D7B2]`} />;
      case 'irrigation':
        return <Droplet className={`${className} text-[#73CAD0]`} />;
      case 'soil_test':
        return <FlaskConical className={`${className} text-purple-400`} />;
      case 'scouting':
        return <Eye className={`${className} text-amber-400`} />;
      case 'fertilizer':
        return <Leaf className={`${className} text-emerald-400`} />;
      case 'harvest':
        return <Layers className={`${className} text-yellow-400`} />;
      case 'rotation_transition':
        return <Sparkles className={`${className} text-indigo-400`} />;
      default:
        return <CalendarIcon className={`${className} text-[#27D7B2]`} />;
    }
  };

  // Helper badge renderer for certainty basis
  const renderCertaintyBadge = (basis?: string) => {
    switch (basis) {
      case 'observed':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            Observed Actual
          </span>
        );
      case 'modelled':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#73CAD0]/20 text-[#73CAD0] border border-[#73CAD0]/30">
            <Sparkles className="w-2.5 h-2.5 text-[#73CAD0]" />
            Modelled Window
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-white/10 text-slate-300 border border-white/15">
            <Check className="w-2.5 h-2.5 text-slate-300" />
            Completed
          </span>
        );
      case 'planned':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#27D7B2]/15 text-[#27D7B2] border border-[#27D7B2]/30">
            <CalendarDays className="w-2.5 h-2.5 text-[#27D7B2]" />
            Planned Target
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. TOP CONTROL BAR: Farm Scope + Fixed 3-Part Month Navigator + Views + Actions */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-xl">
        {/* Left: Farm Scope Selector + Field Scope */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-semibold text-white">
            <Sprout className="w-4 h-4 text-[#27D7B2]" />
            <select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {allFarms.map((f) => (
                <option key={f.id} value={f.id} className="bg-[#04141A] text-white">
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-slate-300">
            <span className="text-[10px] uppercase font-mono text-[#27D7B2]">Field:</span>
            <select
              value={selectedFieldId}
              onChange={(e) => setSelectedFieldId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#04141A] text-white">All Fields</option>
              {availableFields.map((fld) => (
                <option key={fld} value={fld} className="bg-[#04141A] text-white">
                  {fld}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Fixed Three-Part Grid Navigation (< Month Year >) + Today Button */}
        <div className="flex items-center justify-center gap-2">
          <div className="grid grid-cols-[40px_1fr_40px] items-center w-[230px] sm:w-[260px] h-10 px-1 rounded-xl bg-[#020A10]/70 border border-white/15 shadow-inner">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-10 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center text-xs sm:text-sm font-bold font-mono text-white tracking-wide truncate">
              {currentMonthName} {currentYear}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-10 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleToday}
            className="h-10 px-3 rounded-xl glass-card text-xs font-bold text-[#27D7B2] hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            title="Return to current date"
          >
            <span>Today</span>
          </button>
        </div>

        {/* Right: View Modes + Add Operation CTA + ICS Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggles */}
          <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-[#27D7B2]/20 text-[#27D7B2] border border-[#27D7B2]/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Month</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-[#27D7B2]/20 text-[#27D7B2] border border-[#27D7B2]/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Agenda</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('multi_field')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'multi_field'
                  ? 'bg-[#27D7B2]/20 text-[#27D7B2] border border-[#27D7B2]/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Fields</span>
            </button>
          </div>

          {/* Add Operation CTA */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="h-10 px-3.5 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#12887A] text-[#020A10] font-bold text-xs shadow-md shadow-[#27D7B2]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Operation</span>
          </button>

          {/* Export to ICS */}
          <button
            type="button"
            onClick={handleExportICS}
            className="h-10 px-3 rounded-xl glass-card text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download standard RFC-5545 iCalendar (.ics) file"
          >
            <FileDown className="w-3.5 h-3.5 text-[#27D7B2]" />
            <span className="hidden xl:inline">Export ICS</span>
          </button>
        </div>
      </div>

      {/* 2. SCHEDULE ADJUSTMENT & CLIMATE NOTICE BANNER (Model vs Farmer plan transparency) */}
      {showRevisionAlert && (
        <div className="glass-card p-3.5 sm:p-4 rounded-2xl flex items-start justify-between gap-3 border-amber-500/30 bg-amber-500/5 shadow-md">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">
                  GDD Thermal Model Advisory: Suggested Chickpea Sowing Window Shift
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  Pending Farmer Approval
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                NASA POWER 10-day cold anomaly models delay threshold 10°C soil temperature emergence by 8 days.
                Recommended window shifted from <strong className="text-white">Mar 10–24</strong> to <strong className="text-[#27D7B2]">Mar 18–31</strong>.
                Field Shift never modifies confirmed plans without your consent.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const chickpeaEvt = events.find((e) => e.cropName === 'Chickpea' && e.eventType === 'planting');
                if (chickpeaEvt) {
                  const updated: CalendarEvent = {
                    ...chickpeaEvt,
                    date: '2026-03-18',
                    endDate: '2026-03-31',
                    certaintyBasis: 'modelled',
                    notes: 'Window revised to Mar 18–31 following farmer approval of GDD model recommendation.',
                  };
                  saveCalendarEvent(updated);
                  setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
                }
                setShowRevisionAlert(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              Approve Shift
            </button>
            <button
              type="button"
              onClick={() => setShowRevisionAlert(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. SEASONAL CROP ROTATION TIMELINE RIBBON */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sprout className="w-4 h-4 text-[#27D7B2]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Multi-Season Rotation Ribbon — {currentFarm?.name || 'Active Farm'}
            </span>
          </div>
          {onOpenCropRotation && (
            <button
              type="button"
              onClick={() => onOpenCropRotation(currentFarm?.id || 'farm_1')}
              className="text-xs font-semibold text-[#27D7B2] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View Full Sequence Blueprint</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sequence.map((crop, idx) => {
            const isCurrentWindow = idx === 1; // Spring Chickpea in March demo
            return (
              <div
                key={idx}
                onClick={() => {
                  if (onOpenCropRotation) onOpenCropRotation(currentFarm?.id || 'farm_1', crop.cropName);
                }}
                className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group glass-card ${
                  isCurrentWindow
                    ? 'border-[#27D7B2] ring-1 ring-[#27D7B2]/40 bg-[#27D7B2]/10'
                    : 'glass-card-hover'
                }`}
              >
                <img
                  src={getCropImage(crop.cropName)}
                  alt={crop.cropName}
                  className="w-12 h-12 rounded-lg object-cover border border-white/15 shrink-0 group-hover:scale-105 transition-transform"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white truncate group-hover:text-[#27D7B2] transition-colors">
                      {crop.cropName}
                    </span>
                    {isCurrentWindow && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#27D7B2] text-[#020A10] uppercase font-mono">
                        Active Stage
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-300 flex items-center gap-2 mt-0.5 font-mono">
                    <span className="text-[#27D7B2]">Season {idx + 1}</span>
                    <span>·</span>
                    <span>{crop.durationDays} Days</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. FILTER PILLS & SEARCH BAR STRIP */}
      <div className="glass-card p-3 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
        {/* Operation Class Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {[
            { id: 'all', label: 'All Operations' },
            { id: 'planting', label: 'Planting' },
            { id: 'irrigation', label: 'Irrigation' },
            { id: 'soil_test', label: 'Soil Testing' },
            { id: 'scouting', label: 'Scouting' },
            { id: 'fertilizer', label: 'Nutrition' },
            { id: 'harvest', label: 'Harvest' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id as any)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === cat.id
                  ? 'bg-[#27D7B2] text-[#020A10] font-bold shadow-md shadow-[#27D7B2]/20'
                  : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Certainty Filter & Search Box */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks, crops, fields..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-3 rounded-xl bg-[#020A10]/70 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#27D7B2] w-48 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* 5. MAIN 12-COLUMN QUANTIFIED CALENDAR BODY (8 Cols Calendar + 4 Cols Agenda Dock) */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Calendar Body (8 Columns) */}
          <div className="lg:col-span-8 glass-card p-5 rounded-2xl shadow-2xl space-y-4">
            {/* Workload Density Strip */}
            <div className="p-3 rounded-xl bg-[#020A10]/50 border border-white/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 shrink-0">
                <TrendingUp className="w-3.5 h-3.5 text-[#27D7B2]" />
                <span className="text-[11px] font-mono text-slate-300 font-bold uppercase tracking-wider">
                  Month Workload Density:
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2 flex-1 items-center">
                {weeklyDensity.map((w, wIdx) => (
                  <div key={wIdx} className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                      <span>W{wIdx + 1}</span>
                      <span className="text-white font-bold">{w.count} ops</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#27D7B2] to-[#73CAD0] rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(w.pct, 8)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 7-Day Column Headers (Sun to Sat) */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 uppercase tracking-wider font-mono py-1 border-b border-white/10">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Stable CSS Day Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {/* Empty padding days */}
              {Array.from({ length: daysInMonth.firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[88px] sm:min-h-[100px] rounded-xl bg-white/[0.01] border border-transparent" />
              ))}

              {/* Month Day Cells */}
              {Array.from({ length: daysInMonth.totalDays }).map((_, i) => {
                const day = i + 1;
                const isSelected = selectedDay === day;
                const dayEvents = eventsByDay.get(day) || [];
                const isToday =
                  day === today.getDate() &&
                  currentDate.getMonth() === today.getMonth() &&
                  currentDate.getFullYear() === today.getFullYear();

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedDay(day);
                      }
                    }}
                    className={`min-h-[88px] sm:min-h-[105px] p-2 rounded-xl text-left flex flex-col justify-between transition-all cursor-pointer glass-card ${
                      isSelected
                        ? 'border-[#27D7B2] ring-2 ring-[#27D7B2]/40 bg-[#27D7B2]/15 shadow-lg'
                        : isToday
                        ? 'border-white/30 bg-white/[0.08] hover:border-[#27D7B2]/50'
                        : 'glass-card-hover'
                    }`}
                  >
                    {/* Top Row: Day Number + Today indicator */}
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-mono font-bold ${
                          isSelected
                            ? 'text-[#27D7B2]'
                            : isToday
                            ? 'text-white'
                            : 'text-slate-300'
                        }`}
                      >
                        {day}
                      </span>
                      {isToday && (
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-[#27D7B2] text-[#020A10] uppercase">
                          Today
                        </span>
                      )}
                    </div>

                    {/* Operational Event Chips */}
                    <div className="space-y-1 my-1 flex-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(ev);
                          }}
                          className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium border truncate transition-all ${
                            ev.isCompleted
                              ? 'bg-white/5 border-white/10 text-slate-400 line-through'
                              : ev.certaintyBasis === 'observed'
                              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200'
                              : ev.certaintyBasis === 'modelled'
                              ? 'bg-[#73CAD0]/20 border-[#73CAD0]/30 text-[#73CAD0]'
                              : 'bg-[#27D7B2]/20 border-[#27D7B2]/40 text-[#27D7B2]'
                          }`}
                          title={`${ev.title} (${ev.fieldName || 'Field'})`}
                        >
                          {renderEventIcon(ev.eventType, 'w-3 h-3 shrink-0')}
                          <span className="truncate">{ev.cropName ? `${ev.cropName}: ` : ''}{ev.title}</span>
                        </div>
                      ))}

                      {dayEvents.length > 2 && (
                        <div className="text-[9px] font-mono text-slate-400 px-1 font-semibold">
                          +{dayEvents.length - 2} more operations
                        </div>
                      )}
                    </div>

                    {/* Bottom Status Dots */}
                    <div className="flex items-center gap-1">
                      {dayEvents.map((ev, evIdx) => (
                        <span
                          key={evIdx}
                          className={`w-1.5 h-1.5 rounded-full ${
                            ev.isCompleted
                              ? 'bg-slate-500'
                              : ev.priority === 'high'
                              ? 'bg-amber-400'
                              : 'bg-[#27D7B2]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected-Date Action Agenda Dock (4 Columns) */}
          <div className="lg:col-span-4 glass-card p-5 rounded-2xl shadow-2xl space-y-5">
            {/* Dock Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#27D7B2] block">
                  Selected Field Schedule
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {currentMonthName} {selectedDay}, {currentYear}
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                {selectedDayEvents.length} Operations
              </span>
            </div>

            {/* Quick Add Inline Form */}
            <form onSubmit={handleCreateEvent} className="p-3 rounded-xl bg-[#020A10]/60 border border-white/10 space-y-2.5">
              <span className="text-[11px] font-bold text-white flex items-center gap-1.5 font-mono uppercase">
                <Plus className="w-3.5 h-3.5 text-[#27D7B2]" />
                Schedule Field Operation
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Task title (e.g. Inoculant top-dress)..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="flex-1 h-8 px-2.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#27D7B2]"
                />
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="h-8 px-3 rounded-lg bg-[#27D7B2] hover:bg-[#52E2C3] disabled:opacity-40 text-[#020A10] font-bold text-xs transition-all shadow-md shadow-[#27D7B2]/20 cursor-pointer"
                >
                  Add
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="h-7 px-2 rounded-lg bg-black/40 border border-white/10 text-[11px] text-white focus:outline-none"
                >
                  <option value="planting">🌱 Planting</option>
                  <option value="irrigation">💧 Irrigation</option>
                  <option value="soil_test">🧪 Soil Test</option>
                  <option value="scouting">👁 Scouting</option>
                  <option value="fertilizer">🌿 Fertilizer</option>
                  <option value="harvest">🌾 Harvest</option>
                </select>
                <input
                  type="text"
                  placeholder="Field Name"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="h-7 px-2 rounded-lg bg-black/40 border border-white/10 text-[11px] text-white focus:outline-none"
                />
              </div>
            </form>

            {/* Day Events List */}
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {selectedDayEvents.length === 0 ? (
                <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 text-center space-y-2">
                  <CalendarDays className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">No scheduled operations for this day</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Click &quot;Add Operation&quot; or use the inline input above to log field tasks, soil tests, or irrigation routines.
                  </p>
                </div>
              ) : (
                selectedDayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 glass-card ${
                      ev.isCompleted
                        ? 'opacity-60 border-white/5'
                        : 'glass-card-hover border-white/15'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleComplete(ev);
                          }}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${
                            ev.isCompleted
                              ? 'bg-[#27D7B2] border-[#27D7B2] text-[#020A10]'
                              : 'border-white/30 bg-white/5 hover:border-[#27D7B2]'
                          }`}
                          title={ev.isCompleted ? 'Mark incomplete' : 'Mark completed'}
                        >
                          {ev.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {renderEventIcon(ev.eventType, 'w-3.5 h-3.5 shrink-0')}
                            <span
                              className={`text-xs font-bold truncate ${
                                ev.isCompleted ? 'line-through text-slate-400' : 'text-white'
                              }`}
                            >
                              {ev.title}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 font-mono">
                            <span>{ev.fieldName || 'Field 1'}</span>
                            {ev.cropName && (
                              <>
                                <span>·</span>
                                <span className="text-[#27D7B2]">{ev.cropName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEvent(ev.id);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete operation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
                      {renderCertaintyBadge(ev.certaintyBasis)}
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeferEvent(ev, 7);
                          }}
                          className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-mono cursor-pointer transition-colors"
                          title="Defer this task by +7 days"
                        >
                          +7d
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. UPCOMING AGENDA VIEW (Next 14 Days Ordered List) */}
      {viewMode === 'agenda' && (
        <div className="glass-card p-6 rounded-2xl shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Two-Week Operations Agenda
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Chronological timeline of upcoming tasks, sowing windows, and soil tests across all parcels.
              </p>
            </div>
            <span className="text-xs font-mono text-[#27D7B2] bg-[#27D7B2]/15 px-2.5 py-1 rounded-xl border border-[#27D7B2]/30">
              {upcomingEvents.length} Upcoming Tasks
            </span>
          </div>

          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#27D7B2] mx-auto opacity-70" />
                <p className="font-bold text-white">All Clear</p>
                <p>No operations scheduled in the two-week window for the selected filters.</p>
              </div>
            ) : (
              upcomingEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="glass-card p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#27D7B2]/50 transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleComplete(ev);
                      }}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${
                        ev.isCompleted
                          ? 'bg-[#27D7B2] border-[#27D7B2] text-[#020A10]'
                          : 'border-white/30 bg-white/5 hover:border-[#27D7B2]'
                      }`}
                    >
                      {ev.isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        {renderEventIcon(ev.eventType, 'w-4 h-4')}
                        <span className={`text-sm font-bold ${ev.isCompleted ? 'line-through text-slate-400' : 'text-white'}`}>
                          {ev.title}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                        <span>Due: {ev.date}</span>
                        <span>·</span>
                        <span>{ev.fieldName || 'Field Parcel'}</span>
                        {ev.cropName && (
                          <>
                            <span>·</span>
                            <span className="text-[#27D7B2]">{ev.cropName}</span>
                          </>
                        )}
                        {ev.stage && (
                          <>
                            <span>·</span>
                            <span className="text-slate-300">Stage: {ev.stage}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {renderCertaintyBadge(ev.certaintyBasis)}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeferEvent(ev, 7);
                      }}
                      className="px-2.5 py-1 rounded-lg glass-card text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      Defer +7d
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 7. MULTI-FIELD OVERLAY MATRIX VIEW */}
      {viewMode === 'multi_field' && (
        <div className="glass-card p-6 rounded-2xl shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Multi-Field Operational Matrix
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Simultaneous parcel status: crop stage, active work package, and scheduled interventions.
              </p>
            </div>
            <span className="text-xs font-mono text-[#27D7B2] bg-[#27D7B2]/15 px-2.5 py-1 rounded-xl border border-[#27D7B2]/30">
              {multiFieldRows.length} Active Parcels
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {multiFieldRows.map((row, idx) => (
              <div
                key={idx}
                className="glass-card p-4 rounded-xl border border-white/15 space-y-3 hover:border-[#27D7B2]/50 transition-all cursor-pointer"
                onClick={() => {
                  if (row.activeEvent) setSelectedEvent(row.activeEvent);
                }}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">{row.fieldName}</h3>
                    <span className="text-xs text-[#27D7B2] font-semibold">{row.cropName}</span>
                  </div>
                  <img
                    src={getCropImage(row.cropName)}
                    alt={row.cropName}
                    className="w-10 h-10 rounded-lg object-cover border border-white/10"
                  />
                </div>

                <div className="space-y-1.5 text-xs">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Upcoming Intervention:
                  </span>
                  {row.activeEvent ? (
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        {renderEventIcon(row.activeEvent.eventType)}
                        <span>{row.activeEvent.title}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>Window: {row.activeEvent.date}</span>
                        {renderCertaintyBadge(row.activeEvent.certaintyBasis)}
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No pending tasks for this parcel.</p>
                  )}
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{row.events.length} Total Milestones</span>
                  <span className="text-[#27D7B2] flex items-center gap-1 hover:underline">
                    <span>Inspect parcel</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. CONTEXTUAL EVENT & ACTION DETAIL MODAL (Gentle Backdrop Blur) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-[3px] transition-opacity"
            onClick={() => setSelectedEvent(null)}
          />
          <div className="relative w-full max-w-lg glass-modal rounded-3xl p-6 shadow-2xl border border-white/20 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#27D7B2]/20 border border-[#27D7B2]/40 flex items-center justify-center text-[#27D7B2]">
                  {renderEventIcon(selectedEvent.eventType, 'w-5 h-5')}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {selectedEvent.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5">
                    <span>{selectedEvent.fieldName || 'General Parcel'}</span>
                    {selectedEvent.cropName && (
                      <>
                        <span>·</span>
                        <span className="text-[#27D7B2] font-semibold">{selectedEvent.cropName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Operational Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl glass-card space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Scheduled Date / Window</span>
                <span className="text-sm font-bold text-white">
                  {selectedEvent.date}
                  {selectedEvent.endDate ? ` → ${selectedEvent.endDate}` : ''}
                </span>
              </div>
              <div className="p-3 rounded-xl glass-card space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Certainty & Provenance</span>
                <div>{renderCertaintyBadge(selectedEvent.certaintyBasis)}</div>
              </div>
            </div>

            {/* Agronomic Evidence & Rationale */}
            {selectedEvent.evidence && (
              <div className="p-3.5 rounded-xl glass-card space-y-1 border-emerald-500/30 bg-emerald-500/5">
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase font-mono">
                  <Sparkles className="w-3.5 h-3.5" />
                  Satellite & Biophysical Evidence Rationale
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {selectedEvent.evidence}
                </p>
              </div>
            )}

            {/* Farmer Notes */}
            {selectedEvent.notes && (
              <div className="p-3.5 rounded-xl glass-card space-y-1">
                <span className="text-[11px] font-bold text-white flex items-center gap-1.5 uppercase font-mono">
                  <Info className="w-3.5 h-3.5 text-[#27D7B2]" />
                  Operational Protocol Notes
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {selectedEvent.notes}
                </p>
              </div>
            )}

            {/* Audit History Log */}
            {selectedEvent.auditLog && selectedEvent.auditLog.length > 0 && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Action Audit Log
                </span>
                <div className="space-y-1 text-[11px] font-mono text-slate-400 max-h-24 overflow-y-auto">
                  {selectedEvent.auditLog.map((log, lIdx) => (
                    <div key={lIdx} className="flex items-center justify-between gap-2 border-b border-white/5 pb-0.5">
                      <span className="text-slate-300">{log.action}</span>
                      <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar (Complete, Defer, Delete) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleToggleComplete(selectedEvent)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                  selectedEvent.isCompleted
                    ? 'bg-slate-700 text-white hover:bg-slate-600'
                    : 'bg-[#27D7B2] text-[#020A10] hover:bg-[#52E2C3] shadow-[#27D7B2]/20'
                }`}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{selectedEvent.isCompleted ? 'Mark Incomplete' : 'Complete Operation'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDeferEvent(selectedEvent, 7)}
                  className="px-3 py-2 rounded-xl glass-card text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Defer +7d
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="p-2 rounded-xl glass-card text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Delete event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. ADD OPERATION MODAL (Gentle Backdrop Blur) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-[3px] transition-opacity"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative w-full max-w-lg glass-modal rounded-3xl p-6 shadow-2xl border border-white/20 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#27D7B2]/20 text-[#27D7B2] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Create Farm Operation / Milestone</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                  Operation Title <span className="text-[#27D7B2]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sowing depth verification, drip filter flush..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#020A10]/70 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-[#27D7B2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Operation Class
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#020A10]/70 border border-white/15 text-white focus:outline-none focus:border-[#27D7B2] cursor-pointer"
                  >
                    <option value="planting" className="bg-[#04141A]">🌱 Planting Window</option>
                    <option value="irrigation" className="bg-[#04141A]">💧 Irrigation Routine</option>
                    <option value="soil_test" className="bg-[#04141A]">🧪 Soil Testing</option>
                    <option value="scouting" className="bg-[#04141A]">👁 Crop Scouting</option>
                    <option value="fertilizer" className="bg-[#04141A]">🌿 Crop Nutrition</option>
                    <option value="harvest" className="bg-[#04141A]">🌾 Harvest Window</option>
                    <option value="rotation_transition" className="bg-[#04141A]">✨ Rotation Transition</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Certainty Basis
                  </label>
                  <select
                    value={newCertainty}
                    onChange={(e) => setNewCertainty(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl bg-[#020A10]/70 border border-white/15 text-white focus:outline-none focus:border-[#27D7B2] cursor-pointer"
                  >
                    <option value="planned" className="bg-[#04141A]">Planned Target</option>
                    <option value="observed" className="bg-[#04141A]">Observed Actual</option>
                    <option value="modelled" className="bg-[#04141A]">Modelled Window</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Target Date <span className="text-[#27D7B2]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#020A10]/70 border border-white/15 text-white focus:outline-none focus:border-[#27D7B2]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    End Window Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#020A10]/70 border border-white/15 text-white focus:outline-none focus:border-[#27D7B2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Field Parcel Name
                  </label>
                  <input
                    type="text"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#020A10]/70 border border-white/15 text-white focus:outline-none focus:border-[#27D7B2]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Associated Crop (Optional)
                  </label>
                  <input
                    type="text"
                    value={newCropName}
                    onChange={(e) => setNewCropName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#020A10]/70 border border-white/15 text-white focus:outline-none focus:border-[#27D7B2]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                  Agronomic Notes / Protocol
                </label>
                <textarea
                  rows={2}
                  placeholder="Details on depth, inputs, equipment, or scouting instructions..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#020A10]/70 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-[#27D7B2] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl glass-card text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#12887A] text-[#020A10] font-bold text-xs transition-all shadow-md shadow-[#27D7B2]/20 hover:scale-[1.02] cursor-pointer"
                >
                  Save Operation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
