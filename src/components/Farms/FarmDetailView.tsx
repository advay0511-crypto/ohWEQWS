import React, { useState, useEffect } from 'react';
import {
  MapPin,
  FileDown,
  LayoutDashboard,
  Sprout,
  Settings,
  Droplets,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  Save,
  Trash2,
  Thermometer,
  CloudRain,
  FlaskConical,
  Edit2,
  X,
  AlertOctagon,
  Calendar,
  Clock,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Activity,
  BarChart2,
  ShieldCheck,
  ClipboardList,
  Plus,
  Compass,
  FileText,
  Eye,
  History,
  Sun,
  Wind,
  ChevronDown,
  CheckSquare,
  Upload,
  ArrowUpRight,
  Gauge,
  Info,
} from 'lucide-react';
import {
  SavedFarmPlan,
  DailyStatusSnapshot,
  RotationResult,
  FieldBoundaryItem,
  PlanDecisionEvent,
  FarmerLogEntry,
  SoilTextureType,
  IrrigationMode,
} from '../../types';
import { computeDailyStatusSnapshot } from '../../services/dailySnapshot';
import { dismissAlert } from '../../services/nasaAlerts';
import {
  getFarmRegionImage,
  getFarmRegionFallbackImage,
  getCropImage,
} from '../../services/cropImages';
import { SwipeableAlertItem } from '../Common/SwipeableAlertItem';
import { WaterIntelligenceCard } from '../Home/WaterIntelligenceCard';
import { SoilIntelligenceCard } from '../Home/SoilIntelligenceCard';

export type FarmSection =
  | 'tracker'
  | 'fields'
  | 'rotations'
  | 'soil'
  | 'water'
  | 'weather'
  | 'vegetation'
  | 'journal'
  | 'reports'
  | 'settings';

interface FarmDetailViewProps {
  farm: SavedFarmPlan;
  allFarms?: SavedFarmPlan[];
  onBack: () => void;
  onRunSimulator: (farmId: string) => void;
  onEditFarm: (farm: SavedFarmPlan) => void;
  onReanalyzeFarm?: (farm: SavedFarmPlan) => void;
  onMakeActive: (farmId: string) => void;
  isActive: boolean;
  initialSection?: FarmSection | string;
  cropFilter?: string | null;
  onRenameFarm?: (farmId: string, newName: string) => void;
  onDeleteFarm?: (farmId: string) => void;
  onOpenGuide?: () => void;
  onDismissAlert?: (alertId: string) => void;
  onNavigateTab?: (tab: any) => void;
  onNavigateToRotations?: (farmId: string, cropName?: string | null) => void;
  onSectionChange?: (section: any) => void;
  onSelectFarm?: (farmId: string) => void;
  onSaveFarmerLog?: (farmId: string, log: any) => void;
  onSaveFields?: (farmId: string, fields: FieldBoundaryItem[]) => void;
  onSaveDecisionEvent?: (farmId: string, event: PlanDecisionEvent) => void;
  isAdvanced?: boolean;
}

export const FarmDetailView: React.FC<FarmDetailViewProps> = ({
  farm,
  allFarms = [],
  onBack,
  onRunSimulator,
  onEditFarm,
  onReanalyzeFarm,
  onMakeActive,
  isActive,
  initialSection = 'tracker',
  cropFilter = null,
  onRenameFarm,
  onDeleteFarm,
  onOpenGuide,
  onDismissAlert,
  onNavigateTab,
  onNavigateToRotations,
  onSectionChange,
  onSelectFarm,
  onSaveFarmerLog,
  onSaveFields,
  onSaveDecisionEvent,
  isAdvanced = false,
}) => {
  // Canonical 10-section workspace state
  const [activeSection, setActiveSection] = useState<FarmSection>(() => {
    const validSections: FarmSection[] = [
      'tracker',
      'fields',
      'rotations',
      'soil',
      'water',
      'weather',
      'vegetation',
      'journal',
      'reports',
      'settings',
    ];
    if (initialSection && validSections.includes(initialSection as FarmSection)) {
      return initialSection as FarmSection;
    }
    return 'tracker';
  });

  // Synchronize when initialSection changes externally
  useEffect(() => {
    const validSections: FarmSection[] = [
      'tracker',
      'fields',
      'rotations',
      'soil',
      'water',
      'weather',
      'vegetation',
      'journal',
      'reports',
      'settings',
    ];
    if (initialSection && validSections.includes(initialSection as FarmSection)) {
      setActiveSection(initialSection as FarmSection);
    }
  }, [initialSection]);

  const handleSelectSection = (section: FarmSection) => {
    setActiveSection(section);
    if (onSectionChange) {
      onSectionChange(section);
    }
  };

  const handleOpenRotationsPage = (cropName?: string | null) => {
    if (onNavigateToRotations) {
      onNavigateToRotations(farm.id, cropName);
    } else if (onNavigateTab) {
      onNavigateTab('rotations');
    }
  };

  // Selected field scope for field-scoped panels
  const [selectedFieldId, setSelectedFieldId] = useState<string>('all');

  // Farm Settings state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editFarmName, setEditFarmName] = useState(farm.name || 'Al Marjan Farm');
  const [editFarmDesc, setEditFarmDesc] = useState('Primary commercial agricultural parcel');
  const [editFarmArea, setEditFarmArea] = useState(String(farm.farmAnswers?.fieldSizeHa || 32.5));
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Local alert dismissal state
  const [dismissedLocal, setDismissedLocal] = useState<Set<string>>(new Set());

  const snapshot: DailyStatusSnapshot = computeDailyStatusSnapshot(farm);

  const activeAlerts = (snapshot.activeAlerts || []).filter((a) => !dismissedLocal.has(a.id));
  const hasAlerts = activeAlerts.length > 0;
  const hasCriticalAlert = activeAlerts.some((a) => a.severity === 'critical');

  const handleDismissAlert = (alertId: string) => {
    dismissAlert(alertId);
    setDismissedLocal((prev) => new Set([...prev, alertId]));
    if (onDismissAlert) {
      onDismissAlert(alertId);
    }
  };

  // 10 Canonical sidebar items per Section 30.5 / Section 43 specification
  const sidebarNavItems: { id: FarmSection; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'tracker', label: 'Overview / Tracker', icon: LayoutDashboard },
    { id: 'fields', label: 'Fields & Map', icon: Layers },
    { id: 'rotations', label: 'Crop Rotation Plan', icon: Sprout },
    { id: 'soil', label: 'Soil & Land', icon: Layers },
    { id: 'water', label: 'Water Intelligence', icon: Droplets },
    { id: 'weather', label: 'Weather & Climate', icon: CloudRain },
    { id: 'vegetation', label: 'Vegetation & Satellite', icon: Activity },
    { id: 'journal', label: 'Actions & Journal', icon: ClipboardList },
    { id: 'reports', label: 'Past Analyses', icon: FileText },
    { id: 'settings', label: 'Farm Settings', icon: Settings },
  ];

  const handleSaveName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editFarmName.trim() && onRenameFarm) {
      onRenameFarm(farm.id, editFarmName.trim());
      setIsEditingName(false);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    }
  };

  const handleTriggerReanalyze = () => {
    if (onReanalyzeFarm) {
      onReanalyzeFarm(farm);
    } else {
      onEditFarm(farm);
    }
  };

  const handleDeleteConfirm = () => {
    if (onDeleteFarm) {
      onDeleteFarm(farm.id);
    }
  };

  const handleExport = () => {
    window.print();
  };

  // Sanitizer ensuring Fallow and Cover Crop are never combined and no slash remains
  const sanitizeCrop = (name: string): string => {
    if (!name) return '';
    if (/fallow.*cover|cover.*fallow/i.test(name)) {
      return farm?.farmAnswers?.irrigationMode === 'rain_only' ? 'Fallow' : 'Cover Crop';
    }
    if (name.includes(' / ')) return name.split(' / ')[0].trim();
    if (name.includes('/')) return name.split('/')[0].trim();
    return name.trim();
  };

  const rawSequenceCrops = farm?.analysis?.rotations?.[0]?.sequence?.map((s) => s.cropName) || [
    'Wheat',
    'Chickpea',
    'Lentil',
    'Grain Sorghum',
  ];
  const sequenceCrops = rawSequenceCrops.map(sanitizeCrop);
  const activeCropName = sanitizeCrop(snapshot.currentCrop.name || sequenceCrops[0] || 'Wheat');
  const daysUntilNext = snapshot.currentCrop.daysUntilNextTransition || 82;
  const nextCropName = sanitizeCrop(snapshot.currentCrop.nextCropName || sequenceCrops[1] || 'Chickpea');
  const stageLabel = snapshot.currentCrop.stageLabel || 'Season 1 of 4';
  const farmLocation = farm?.locationName || snapshot.locationName || 'Ras Al Khaimah, UAE';
  const fieldSize = farm?.farmAnswers?.fieldSizeHa || 32.5;

  const farmThumb = getFarmRegionImage(
    farmLocation,
    farm.name,
    farm?.farmAnswers?.lat,
    farm?.farmAnswers?.lon
  );

  // Status pill config strictly synchronized to snapshot.overallStatus
  const statusPill =
    snapshot.overallStatus === 'alert' || hasCriticalAlert
      ? {
          label: 'Alert',
          classes: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
          dot: 'bg-rose-400',
          reason: snapshot.overallStatusReason || 'Critical environmental alert or water deficit',
        }
      : snapshot.overallStatus === 'needs_attention' || hasAlerts
      ? {
          label: 'Needs Attention',
          classes: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-400',
          reason: snapshot.overallStatusReason || 'Moisture watch or seasonal advisory active',
        }
      : {
          label: 'Healthy & Stable',
          classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-400',
          reason: snapshot.overallStatusReason || 'All soil, thermal, and rotation indicators balanced',
        };

  // Fields State
  const [fields, setFields] = useState<FieldBoundaryItem[]>(() => {
    if (farm.fields && farm.fields.length > 0) return farm.fields;
    return [
      {
        id: `fld_${farm.id}_1`,
        name: `${farm.name} Parcel A`,
        areaHa: farm.farmAnswers?.fieldSizeHa || 32.5,
        polygon: farm.polygon || [
          [farm.farmAnswers?.lat || 25.6741, farm.farmAnswers?.lon || 55.9804],
          [(farm.farmAnswers?.lat || 25.6741) + 0.003, (farm.farmAnswers?.lon || 55.9804) + 0.002],
          [(farm.farmAnswers?.lat || 25.6741) + 0.002, (farm.farmAnswers?.lon || 55.9804) + 0.005],
          [(farm.farmAnswers?.lat || 25.6741) - 0.001, (farm.farmAnswers?.lon || 55.9804) + 0.003],
        ],
        currentCrop: snapshot.currentCrop.name || 'Winter Wheat',
        soilTexture: farm.farmAnswers?.soilTexture || 'sandy_loam',
        irrigationMode: farm.farmAnswers?.irrigationMode || 'rain_and_irrigation',
        notes: 'Primary production parcel',
      },
      {
        id: `fld_${farm.id}_2`,
        name: `${farm.name} Parcel B`,
        areaHa: 18.0,
        polygon: [
          [(farm.farmAnswers?.lat || 25.6741) + 0.005, (farm.farmAnswers?.lon || 55.9804) + 0.004],
          [(farm.farmAnswers?.lat || 25.6741) + 0.008, (farm.farmAnswers?.lon || 55.9804) + 0.006],
          [(farm.farmAnswers?.lat || 25.6741) + 0.007, (farm.farmAnswers?.lon || 55.9804) + 0.009],
          [(farm.farmAnswers?.lat || 25.6741) + 0.004, (farm.farmAnswers?.lon || 55.9804) + 0.007],
        ],
        currentCrop: 'Chickpea',
        soilTexture: 'sandy_loam',
        irrigationMode: 'rain_and_irrigation',
        notes: 'Secondary legume parcel',
      },
    ];
  });
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);
  const [selectedFieldForDetail, setSelectedFieldForDetail] = useState<FieldBoundaryItem | null>(null);
  const [fieldToDelete, setFieldToDelete] = useState<FieldBoundaryItem | null>(null);

  // New field form state
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldArea, setNewFieldArea] = useState('15.0');
  const [newFieldCrop, setNewFieldCrop] = useState('Winter Wheat');
  const [newFieldSoil, setNewFieldSoil] = useState<SoilTextureType>('sandy_loam');
  const [newFieldIrrigation, setNewFieldIrrigation] = useState<IrrigationMode>('rain_and_irrigation');
  const [newFieldNotes, setNewFieldNotes] = useState('');

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;
    const area = parseFloat(newFieldArea) || 10.0;
    const baseLat = farm.farmAnswers?.lat || 25.6741;
    const baseLon = farm.farmAnswers?.lon || 55.9804;
    const offset = fields.length * 0.004;
    const newField: FieldBoundaryItem = {
      id: `fld_${farm.id}_${Date.now()}`,
      name: newFieldName.trim(),
      areaHa: Math.round(area * 10) / 10,
      currentCrop: newFieldCrop,
      soilTexture: newFieldSoil,
      irrigationMode: newFieldIrrigation,
      notes: newFieldNotes.trim(),
      polygon: [
        [baseLat + offset, baseLon + offset],
        [baseLat + offset + 0.002, baseLon + offset + 0.001],
        [baseLat + offset + 0.0015, baseLon + offset + 0.004],
        [baseLat + offset - 0.0005, baseLon + offset + 0.0025],
      ],
    };
    const updated = [...fields, newField];
    setFields(updated);
    if (onSaveFields) {
      onSaveFields(farm.id, updated);
    }
    setNewFieldName('');
    setNewFieldNotes('');
    setIsAddFieldModalOpen(false);
  };

  const handleDeleteField = (fieldId: string) => {
    const updated = fields.filter((f) => f.id !== fieldId);
    setFields(updated);
    if (onSaveFields) {
      onSaveFields(farm.id, updated);
    }
    setFieldToDelete(null);
  };

  // Decision Journal State (Section 15.4 Contract)
  const [decisionEvents, setDecisionEvents] = useState<PlanDecisionEvent[]>(() => {
    return farm.decisionEvents && farm.decisionEvents.length > 0
      ? farm.decisionEvents
      : [
          {
            id: `dec_${farm.id}_1`,
            farmId: farm.id,
            timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
            action: 'selected',
            priorPlanName: 'Conventional Baseline Cereal',
            newPlanName: farm.analysis?.rotations?.[0]?.name || 'Water-Resilient Diversified Rotation',
            actor: 'Lead Agronomist',
            reason: 'water',
            reasonDetail: 'Legume integration reduces seasonal groundwater extraction by 28% while rebuilding soil organic nitrogen.',
          },
          {
            id: `dec_${farm.id}_2`,
            farmId: farm.id,
            timestamp: new Date(Date.now() - 86400000 * 21).toISOString(),
            action: 'replaced',
            priorPlanName: 'Single Crop Continuous Wheat',
            newPlanName: 'Baseline Cereal Rotation',
            actor: 'Regional Extension Officer',
            reason: 'management_preference',
            reasonDetail: 'Discontinued mono-cropping to mitigate fungal disease buildup in root-zone.',
          },
        ];
  });
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [selectedDecisionDiff, setSelectedDecisionDiff] = useState<PlanDecisionEvent | null>(null);

  // New decision form state
  const [newDecAction, setNewDecAction] = useState<'selected' | 'rejected' | 'deferred' | 'replaced'>('selected');
  const [newDecPriorPlan, setNewDecPriorPlan] = useState('Baseline Cereal Rotation');
  const [newDecNewPlan, setNewDecNewPlan] = useState(farm.analysis?.rotations?.[0]?.name || 'Water-Resilient Diversified Rotation');
  const [newDecActor, setNewDecActor] = useState('Lead Agronomist');
  const [newDecReason, setNewDecReason] = useState<'water' | 'cost' | 'equipment' | 'market' | 'management_preference' | 'other'>('water');
  const [newDecReasonDetail, setNewDecReasonDetail] = useState('');

  const handleAddDecisionEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const event: PlanDecisionEvent = {
      id: `dec_${Date.now()}`,
      farmId: farm.id,
      timestamp: new Date().toISOString(),
      action: newDecAction,
      priorPlanName: newDecPriorPlan.trim() || undefined,
      newPlanName: newDecNewPlan.trim() || undefined,
      actor: newDecActor.trim() || 'Agronomist',
      reason: newDecReason,
      reasonDetail: newDecReasonDetail.trim() || undefined,
    };
    const updated = [event, ...decisionEvents];
    setDecisionEvents(updated);
    if (onSaveDecisionEvent) {
      onSaveDecisionEvent(farm.id, event);
    }
    setNewDecReasonDetail('');
    setIsDecisionModalOpen(false);
  };

  // Journal View Controls
  const [journalSubTab, setJournalSubTab] = useState<'decisions' | 'observations'>('decisions');
  const [observationFilterCategory, setObservationFilterCategory] = useState<string>('all');
  const [observationFilterField, setObservationFilterField] = useState<string>('all');

  // Farmer observation logs state
  const [farmerLogs, setFarmerLogs] = useState<FarmerLogEntry[]>(farm.farmerLogs || [
    {
      id: 'log_seed_1',
      date: 'Oct 04, 2026',
      category: 'yield',
      title: 'Previous Winter Wheat Harvest',
      yieldAmount: '3.9 t/ha',
      fieldName: fields[0]?.name || 'Parcel A',
      note: 'Good protein test, minimal rust observed after timely fungicide application.',
    },
    {
      id: 'log_seed_2',
      date: 'Oct 08, 2026',
      category: 'irrigation',
      title: 'Irrigation Valve Inspection',
      fieldName: fields[0]?.name || 'Parcel A',
      note: 'South pivot pressure sensor recalibrated; moisture probes calibrated to 30cm root zone.',
    },
    {
      id: 'log_seed_3',
      date: 'Oct 14, 2026',
      category: 'observation',
      title: 'Canopy Emergence Check',
      fieldName: fields[0]?.name || 'Parcel A',
      note: 'Uniform germination across sandy loam zones; 94% emergence count.',
    },
  ]);
  const [isLoggingFormOpen, setIsLoggingFormOpen] = useState(false);
  const [newLogCategory, setNewLogCategory] = useState<'observation' | 'yield' | 'issue' | 'irrigation' | 'fertilizer' | 'management'>('observation');
  const [newLogFieldId, setNewLogFieldId] = useState<string>('all');
  const [newLogTitle, setNewLogTitle] = useState('');
  const [newLogNote, setNewLogNote] = useState('');
  const [newLogYield, setNewLogYield] = useState('');
  const [logSavedToast, setLogSavedToast] = useState(false);

  // Irrigation Event modal state
  const [isIrrigationModalOpen, setIsIrrigationModalOpen] = useState(false);
  const [irrigationDate, setIrrigationDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [irrigationFieldId, setIrrigationFieldId] = useState(fields[0]?.id || 'fld_1');
  const [irrigationAmountMm, setIrrigationAmountMm] = useState('25');
  const [irrigationMethod, setIrrigationMethod] = useState<'drip' | 'center_pivot' | 'sprinkler' | 'furrow'>('drip');
  const [irrigationDurationHours, setIrrigationDurationHours] = useState('4.5');
  const [irrigationLoggedToast, setIrrigationLoggedToast] = useState(false);

  // Soil Lab Test modal state
  const [isSoilModalOpen, setIsSoilModalOpen] = useState(false);
  const [soilLabPh, setSoilLabPh] = useState('7.4');
  const [soilLabSom, setSoilLabSom] = useState('1.9');
  const [soilLabCec, setSoilLabCec] = useState('18.5');
  const [soilLabSavedToast, setSoilLabSavedToast] = useState(false);

  const handleAddFarmerLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogTitle.trim()) return;
    const selectedField = fields.find((f) => f.id === newLogFieldId);
    const entry: FarmerLogEntry = {
      id: `log_${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      category: newLogCategory,
      title: newLogTitle.trim(),
      note: newLogNote.trim(),
      yieldAmount: newLogYield.trim() || undefined,
      fieldId: selectedField?.id,
      fieldName: selectedField?.name,
    };
    const updated = [entry, ...farmerLogs];
    setFarmerLogs(updated);
    if (onSaveFarmerLog) {
      onSaveFarmerLog(farm.id, updated);
    }
    setNewLogTitle('');
    setNewLogNote('');
    setNewLogYield('');
    setIsLoggingFormOpen(false);
    setLogSavedToast(true);
    setTimeout(() => setLogSavedToast(false), 2500);
  };

  const handleLogIrrigationEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedField = fields.find((f) => f.id === irrigationFieldId);
    const entry: FarmerLogEntry = {
      id: `irrig_${Date.now()}`,
      date: new Date(irrigationDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      category: 'irrigation',
      title: `Applied ${irrigationAmountMm} mm Irrigation (${irrigationMethod.replace('_', ' ')})`,
      note: `Recorded ${irrigationAmountMm} mm water delivery over ${irrigationDurationHours} hours via ${irrigationMethod.replace('_', ' ')}. Root-zone moisture replenished.`,
      fieldId: selectedField?.id,
      fieldName: selectedField?.name || 'All Parcels',
    };
    const updated = [entry, ...farmerLogs];
    setFarmerLogs(updated);
    if (onSaveFarmerLog) {
      onSaveFarmerLog(farm.id, updated);
    }
    setIsIrrigationModalOpen(false);
    setIrrigationLoggedToast(true);
    setTimeout(() => setIrrigationLoggedToast(false), 2500);
  };

  const totalFieldsAreaHa = fields.reduce((acc, f) => acc + (f.areaHa || 0), 0);
  const totalFieldsAreaAc = totalFieldsAreaHa * 2.47105;

  // Check if other farms in the portfolio need attention
  const otherFarmsNeedingAttention = (allFarms || [])
    .filter((f) => f.id !== farm.id)
    .map((f) => ({ farm: f, snapshot: computeDailyStatusSnapshot(f) }))
    .filter((item) => item.snapshot.overallStatus !== 'good');

  // Active rotation plan data
  const activeRotationPlan: any = farm?.analysis?.rotations?.[0] || {
    id: 'rot_primary_1',
    rank: 1,
    name: 'Water-Resilient Diversified Rotation',
    sequence: [
      {
        seasonIndex: 1,
        seasonName: 'Autumn/Winter',
        calendarYear: 2026,
        durationDays: 135,
        cropId: 'wheat',
        cropName: 'Winter Wheat',
        durationSeasons: 1,
        cropFamily: 'Poaceae',
        isLegume: false,
      },
      {
        seasonIndex: 2,
        seasonName: 'Spring/Summer',
        calendarYear: 2027,
        durationDays: 105,
        cropId: 'chickpea',
        cropName: 'Chickpea',
        durationSeasons: 1,
        cropFamily: 'Fabaceae',
        isLegume: true,
      },
      {
        seasonIndex: 3,
        seasonName: 'Autumn/Winter',
        calendarYear: 2027,
        durationDays: 120,
        cropId: 'lentil',
        cropName: 'Lentil',
        durationSeasons: 1,
        cropFamily: 'Fabaceae',
        isLegume: true,
      },
      {
        seasonIndex: 4,
        seasonName: 'Spring/Summer',
        calendarYear: 2028,
        durationDays: 110,
        cropId: 'sorghum',
        cropName: 'Grain Sorghum',
        durationSeasons: 1,
        cropFamily: 'Poaceae',
        isLegume: false,
      },
    ],
    cycleLengthSeasons: 4,
    cycleLengthYears: 2,
    reviewAfterSeason: 2,
    totalScore: 91,
    overallScore: 91,
    componentScores: {
      waterSaving: 3.6,
      soilHealth: 3.5,
      climateResilience: 3.7,
      cropSuitability: 3.8,
      productivity: 3.4,
    },
    confidence: 'High',
    isRecommended: true,
    explanationSummary:
      'Balanced crop rotation alternating high-value cereal grain with biological nitrogen-fixing pulse crops, reducing seasonal irrigation requirement by 28% while improving soil structure.',
    deepExplanation:
      'Incorporating Chickpea and Lentil breaks common fungal pathogen life cycles (Gaeumannomyces graminis) and provides an estimated +35 to +50 kg N/ha biological credit for subsequent cereal stages.',
    whyThisLength: 'Two-year, four-season sequence fits regional temperature windows and maximizes residue cover.',
    whyThisOrder:
      'Wheat follows grain sorghum to benefit from residual weed suppression, followed by deep-taproot pulse crops that loosen subsoil compaction.',
    riskshortfallWorst20Pct: 8.2,
    waterDemandAnnualMm: 385,
    nitrogenBalanceNetKgHa: 24,
    somChangeTrajectory: [1.8, 1.84, 1.89, 1.95],
    nitrogenTrajectory: [20, 58, 42, 70],
    uncertaintyP10: 84,
    uncertaintyP90: 95,
  };

  // Past reports list
  const pastReports = [
    {
      id: `rep_${farm.id}_001`,
      title: 'Full Farm Seasonal Assessment',
      date: 'Oct 28, 2026',
      overallScore: 91,
      waterScore: 88,
      soilScore: 85,
      status: 'Current Plan',
      engineVersion: 'FieldShift Engine v8.4.1',
      summary: 'Optimization completed with 4-crop sequence. Legume integration confirmed for water efficiency.',
    },
    {
      id: `rep_${farm.id}_002`,
      title: 'Preliminary Feasibility Run',
      date: 'Sep 15, 2026',
      overallScore: 84,
      waterScore: 76,
      soilScore: 80,
      status: 'Superceded',
      engineVersion: 'FieldShift Engine v8.2.0',
      summary: 'Initial baseline evaluation with single-crop cereal focus. Recommended pulse diversification.',
    },
  ];

  return (
    <div className="w-full min-h-screen text-[#F0F7FA] font-sans antialiased pb-20">
      <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        {/* ================================================================= */}
        {/* TOP HEADING REGION: BREADCRUMB, TITLE, BADGES, AND TOP ACTIONS    */}
        {/* ================================================================= */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 mb-5 border border-white/[0.14] shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              {/* Breadcrumb per Contract */}
              <div className="flex items-center gap-2 text-xs text-[#8EA3AF]">
                <button
                  type="button"
                  onClick={onBack}
                  className="hover:text-[#27D7B2] transition-colors cursor-pointer flex items-center gap-1 font-medium"
                >
                  <span>My Farms</span>
                </button>
                <span className="text-white/40">/</span>
                <span className="text-[#27D7B2] font-semibold">{farm.name}</span>
              </div>

              {/* Title & Primary Badges */}
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
                  {farm.name}
                </h1>
                {isActive ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#27D7B2]/15 text-[#27D7B2] border border-[#27D7B2]/40">
                    Primary Farm
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onMakeActive(farm.id)}
                    className="px-2.5 py-0.5 rounded-full text-xs text-[#8EA3AF] hover:text-white hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
                  >
                    Set as Primary
                  </button>
                )}

                {/* Status Badge */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border ${statusPill.classes}`}>
                  <span className={`w-2 h-2 rounded-full ${statusPill.dot} ${snapshot.overallStatus !== 'good' ? 'animate-pulse' : ''}`} />
                  <span>{statusPill.label}</span>
                </span>

                {/* Currency Badge */}
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
                  snapshot.isStale
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-[#27D7B2]/15 text-[#27D7B2] border border-[#27D7B2]/30'
                }`}>
                  {snapshot.isStale ? 'Analysis: Stale (21+ Days)' : 'Analysis: Current'}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-[#8EA3AF] pt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#27D7B2]" />
                  <span className="text-white font-medium">{farmLocation}</span>
                </span>
                <span>•</span>
                <span>
                  Mapped Area: <strong className="text-white font-mono">{fieldSize} ha</strong> ({Math.round(fieldSize * 2.471)} ac)
                </span>
                <span>•</span>
                <span>
                  Parcels: <strong className="text-white font-mono">{fields.length}</strong>
                </span>
              </div>
            </div>

            {/* Right Actions Menu per Section 43 */}
            <div className="flex items-center gap-2 flex-wrap">
              {onOpenGuide && (
                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="w-9 h-9 rounded-xl glass-pill hover:bg-white/[0.1] text-[#27D7B2] flex items-center justify-center text-xs font-bold font-mono transition-colors cursor-pointer border border-white/[0.1]"
                  title="Page Guide"
                >
                  ?
                </button>
              )}
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass-pill hover:bg-white/[0.1] text-xs text-[#E1EDF2] font-semibold transition-colors cursor-pointer border border-white/[0.12]"
              >
                <FileDown className="w-3.5 h-3.5 text-[#27D7B2]" />
                <span>Export</span>
              </button>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('map')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass-pill hover:bg-white/[0.1] text-xs text-[#E1EDF2] font-semibold transition-colors cursor-pointer border border-white/[0.12]"
                >
                  <Compass className="w-3.5 h-3.5 text-[#27D7B2]" />
                  <span>View on Map</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onRunSimulator(farm.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-pill hover:bg-white/[0.1] text-xs text-[#27D7B2] font-semibold transition-colors cursor-pointer border border-[#27D7B2]/30"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Simulator</span>
              </button>
              <button
                type="button"
                onClick={handleTriggerReanalyze}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB898] hover:from-[#38E5C1] hover:to-[#27D7B2] text-xs text-[#020A10] font-bold shadow-lg shadow-[#27D7B2]/20 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Run Deep Analysis</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RESPONSIVE SUB-NAV STRIP FOR TABLET/MOBILE (<=1024px)              */}
        {/* ================================================================= */}
        <div className="xl:hidden mb-4 overflow-x-auto pb-1 flex items-center gap-2 scrollbar-none">
          {sidebarNavItems.map((item) => {
            const Icon = item.icon;
            const isCurrent = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSection(item.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                  isCurrent
                    ? 'bg-[#27D7B2]/15 text-[#27D7B2] border-[#27D7B2]/40 shadow-sm'
                    : 'glass-pill text-[#8EA3AF] hover:text-white border-white/[0.08]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* ================================================================= */}
        {/* MASTER-DETAIL WORKSPACE: 240-260px Left Contextual Rail + Pane    */}
        {/* ================================================================= */}
        <div className="flex flex-col xl:flex-row items-start gap-6">
          {/* =============================================================== */}
          {/* LEFT CONTEXTUAL MASTER RAIL (240-260px at >=1280px)               */}
          {/* =============================================================== */}
          <aside className="hidden xl:flex flex-col w-64 shrink-0 space-y-4">
            {/* Farm Cover Image (16:9 crop, 120-150px) + Parcel Summary */}
            <div className="glass-card rounded-2xl p-3 border border-white/[0.14] shadow-lg space-y-3">
              <div className="w-full h-32 rounded-xl overflow-hidden border border-white/10 relative bg-[#020A10]">
                <img
                  src={farmThumb}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getFarmRegionFallbackImage(
                      farmLocation,
                      farm.name,
                      farm.farmAnswers?.lat,
                      farm.farmAnswers?.lon
                    );
                  }}
                  alt={farm.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-black/80 text-[#27D7B2] border border-[#27D7B2]/30">
                    Regional Aerial
                  </span>
                  <span className={`w-2 h-2 rounded-full ${statusPill.dot}`} />
                </div>
              </div>

              <div className="px-1 space-y-1">
                <div className="text-xs font-bold text-white truncate">{farm.name}</div>
                <div className="text-[11px] text-[#8EA3AF] truncate">{farmLocation}</div>
              </div>

              <div className="pt-2 border-t border-white/[0.08] space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#8EA3AF]">Arable Size:</span>
                  <span className="text-white font-mono font-bold">{fieldSize} ha</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#8EA3AF]">Soil Class:</span>
                  <span className="text-white capitalize">{farm.farmAnswers?.soilTexture?.replace('_', ' ') || 'Sandy Loam'}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#8EA3AF]">Strategy:</span>
                  <span className="text-[#27D7B2] font-semibold capitalize">
                    {farm.farmAnswers?.irrigationMode === 'rain_only' ? 'Rain-fed' : 'Irrigated'}
                  </span>
                </div>
              </div>
            </div>

            {/* Vertical Navigation List (40-44px row height, 3px accent edge) */}
            <nav className="glass-card rounded-2xl p-2 border border-white/[0.14] shadow-lg space-y-1">
              <div className="px-3 py-1.5 text-[10px] text-[#8EA3AF] uppercase tracking-wider font-bold border-b border-white/[0.06] mb-1">
                Farm Intelligence Sections
              </div>
              {sidebarNavItems.map((item) => {
                const Icon = item.icon;
                const isCurrent = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSection(item.id)}
                    className={`w-full h-11 flex items-center justify-between px-3 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                      isCurrent
                        ? 'border-l-[3px] border-[#27D7B2] bg-[#27D7B2]/[0.08] text-[#27D7B2] shadow-sm'
                        : 'text-[#8EA3AF] hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.id === 'rotations' && (
                      <span className="text-[10px] text-[#27D7B2] bg-[#27D7B2]/10 px-1.5 py-0.5 rounded font-mono">
                        Plan
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Field Scope Quick Selector if Multiple Fields */}
            {fields.length > 1 && (
              <div className="glass-card rounded-2xl p-3 border border-white/[0.12] space-y-2 text-xs">
                <span className="text-[10px] uppercase tracking-wider text-[#8EA3AF] font-bold block">
                  Active Field Filter
                </span>
                <select
                  value={selectedFieldId}
                  onChange={(e) => setSelectedFieldId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-[#27D7B2] cursor-pointer"
                >
                  <option value="all">All Parcels (Farm Roll-up)</option>
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.areaHa} ha)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </aside>

          {/* =============================================================== */}
          {/* MAIN CONTENT PANE (Fills remaining width, 12-col grid)           */}
          {/* =============================================================== */}
          <main className="flex-1 min-w-0 w-full space-y-6">
            {/* ============================================================= */}
            {/* 1. OVERVIEW / FARM TRACKER SECTION                            */}
            {/* ============================================================= */}
            {activeSection === 'tracker' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Cross-farm notice if another parcel has active alerts */}
                {otherFarmsNeedingAttention.length > 0 && (
                  <div className="p-3.5 rounded-2xl glass-card border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        Attention needed on another parcel: <strong>{otherFarmsNeedingAttention[0].farm.name}</strong> ({otherFarmsNeedingAttention[0].snapshot.overallStatusReason})
                      </span>
                    </div>
                    {onSelectFarm && (
                      <button
                        type="button"
                        onClick={() => onSelectFarm(otherFarmsNeedingAttention[0].farm.id)}
                        className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold cursor-pointer shrink-0 transition-colors"
                      >
                        Switch Parcel →
                      </button>
                    )}
                  </div>
                )}

                {/* Primary Daily Status Glass Card */}
                <div className="glass-card rounded-2xl p-5 sm:p-7 border border-white/[0.14] shadow-xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#27D7B2]/15 border border-[#27D7B2]/30 flex items-center justify-center text-[#27D7B2]">
                        <Sprout className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                          Farm Status &amp; Daily Tracker
                        </h2>
                        <p className="text-xs text-[#8EA3AF]">
                          Comprehensive real-time agronomic telemetry and seasonal growth state.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#8EA3AF]">
                        Updated:{' '}
                        <strong className="text-white font-mono">
                          {snapshot.computedAt
                            ? new Date(snapshot.computedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: '2-digit',
                                year: 'numeric',
                              })
                            : 'Today'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* What's Growing Now Card */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                    <div className="md:col-span-3 h-36 rounded-xl overflow-hidden relative border border-white/10 bg-black/40">
                      <img
                        src={getCropImage(activeCropName)}
                        alt={activeCropName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <span className="absolute bottom-2 left-2 text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-black/80 text-[#27D7B2] border border-[#27D7B2]/30">
                        Active Stage
                      </span>
                    </div>

                    <div className="md:col-span-9 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-[#27D7B2] font-bold">
                            Current Field Crop
                          </span>
                          <span className="text-xs font-mono font-semibold text-white/80">
                            {stageLabel}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                          {activeCropName}
                        </h3>
                        <p className="text-xs text-[#A7C0CC] mt-1 leading-relaxed">
                          Active vegetative development phase. Root-zone moisture balance and seasonal nitrogen accumulation are within optimum target parameters.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/[0.06] text-xs">
                        <div>
                          <span className="text-[10px] text-[#8EA3AF] block">Planting Window</span>
                          <span className="text-white font-semibold font-mono">Oct 15 – Nov 10</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#8EA3AF] block">Est. Harvest</span>
                          <span className="text-white font-semibold font-mono">Feb 20 – Mar 05</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#8EA3AF] block">Next Transition</span>
                          <span className="text-[#27D7B2] font-semibold font-mono">in {daysUntilNext} days</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#8EA3AF] block">Subsequent Crop</span>
                          <span className="text-white font-semibold">{nextCropName}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clean Non-extreme Soil & Water Gauges */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#8EA3AF] font-medium">Root Moisture</span>
                        <span className="text-[#27D7B2] font-bold font-mono">68%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#27D7B2] to-[#1FB898] rounded-full w-[68%]" />
                      </div>
                      <span className="text-[11px] text-[#8EA3AF] block">Balanced • No water stress</span>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#8EA3AF] font-medium">Soil Health Index</span>
                        <span className="text-emerald-400 font-bold font-mono">85 / 100</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full w-[85%]" />
                      </div>
                      <span className="text-[11px] text-[#8EA3AF] block">Optimal structure &amp; biology</span>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#8EA3AF] font-medium">Seasonal Resilience</span>
                        <span className="text-cyan-400 font-bold font-mono">89 / 100</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-cyan-400 rounded-full w-[89%]" />
                      </div>
                      <span className="text-[11px] text-[#8EA3AF] block">High climate adaptability</span>
                    </div>
                  </div>

                  {/* Dismissible Alerts */}
                  {activeAlerts.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <span>Active Environmental &amp; Weather Watches</span>
                        </div>
                        <span className="text-[11px] text-[#8EA3AF]">Swipe or click dismiss</span>
                      </div>
                      <div className="space-y-2">
                        {activeAlerts.map((alert) => (
                          <SwipeableAlertItem
                            key={alert.id}
                            alert={alert}
                            onDismiss={handleDismissAlert}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Operational Action Shortcuts */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.08] flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleSelectSection('rotations')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass-pill hover:bg-white/[0.08] text-xs sm:text-sm font-semibold text-[#27D7B2] border border-[#27D7B2]/30 cursor-pointer"
                    >
                      <Sprout className="w-4 h-4" />
                      <span>View Full Rotation Plan →</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSection('journal')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass-pill hover:bg-white/[0.08] text-xs sm:text-sm font-semibold text-white border border-white/[0.12] cursor-pointer"
                    >
                      <ClipboardList className="w-4 h-4 text-[#27D7B2]" />
                      <span>Log Observation / Decision</span>
                    </button>
                  </div>
                </div>

                {/* Advanced Mode Inline Engines */}
                {isAdvanced && (
                  <div className="space-y-6">
                    <WaterIntelligenceCard farm={farm} />
                    <SoilIntelligenceCard farm={farm} />
                  </div>
                )}
              </div>
            )}

            {/* ============================================================= */}
            {/* 2. FIELDS & MAP SECTION                                       */}
            {/* ============================================================= */}
            {activeSection === 'fields' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                  <div>
                    <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#27D7B2]">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Parcel Registry &amp; Boundaries</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Fields &amp; Boundary Intelligence
                    </h2>
                    <p className="text-xs text-[#8EA3AF]">
                      Manage parcel geometries, soil profiles, and satellite polygon envelopes for {farm.name}.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddFieldModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB898] hover:from-[#38E5C1] hover:to-[#27D7B2] text-[#020A10] text-xs font-bold transition-all shadow cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Add Field</span>
                    </button>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab('map')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-pill hover:bg-white/[0.1] text-xs text-white font-semibold transition-colors cursor-pointer border border-white/[0.12]"
                      >
                        <Compass className="w-4 h-4 text-[#27D7B2]" />
                        <span>Open Interactive Map</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl glass-card border border-white/[0.12]">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-[#8EA3AF]">Mapped Field Area</div>
                    <div className="text-xl font-bold font-mono text-white tabular-nums mt-0.5">
                      {totalFieldsAreaHa.toFixed(1)} <span className="text-xs text-[#27D7B2]">ha</span>
                    </div>
                    <div className="text-[11px] text-[#8EA3AF] font-mono">
                      ≈ {totalFieldsAreaAc.toFixed(1)} acres
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase text-[#8EA3AF]">Tracked Parcels</div>
                    <div className="text-xl font-bold font-mono text-white tabular-nums mt-0.5">
                      {fields.length} <span className="text-xs text-[#27D7B2]">{fields.length === 1 ? 'parcel' : 'parcels'}</span>
                    </div>
                    <div className="text-[11px] text-[#8EA3AF]">
                      Avg {(totalFieldsAreaHa / Math.max(1, fields.length)).toFixed(1)} ha / parcel
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase text-[#8EA3AF]">Dominant Soil Type</div>
                    <div className="text-base font-semibold text-white capitalize mt-1">
                      {farm.farmAnswers?.soilTexture?.replace('_', ' ') || 'Sandy Loam'}
                    </div>
                    <div className="text-[11px] text-[#8EA3AF]">
                      {farm.farmAnswers?.soilTextureConfirmed ? 'Field verified' : 'Regional profile'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase text-[#8EA3AF]">Water Strategy</div>
                    <div className="text-base font-semibold text-[#27D7B2] capitalize mt-1">
                      {farm.farmAnswers?.irrigationMode === 'rain_only' ? 'Rain-fed' : 'Irrigated'}
                    </div>
                    <div className="text-[11px] text-[#8EA3AF]">
                      {farm.farmAnswers?.irrigationType || 'Drip / Pivot'}
                    </div>
                  </div>
                </div>

                {/* Spatial Resolution Notice */}
                <div className="p-4 rounded-xl glass-card border border-white/[0.1] flex items-start gap-3">
                  <Compass className="w-4 h-4 text-[#27D7B2] shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>Earth Observation Spatial Resolution</span>
                      <span className="text-[10px] font-mono text-[#27D7B2] px-1.5 py-0.5 bg-[#27D7B2]/15 rounded">NASA / ESA</span>
                    </div>
                    <p className="text-[#A7C0CC] leading-relaxed">
                      NASA Landsat 8/9 provides 30m multispectral and 100m thermal data; ESA Sentinel-2 provides 10m VNIR bands.
                      Field boundaries smaller than 0.5 ha represent interpolated pixel envelopes rather than individual single-plant sensors.
                    </p>
                  </div>
                </div>

                {/* Interactive Schematic / Boundary Preview */}
                <div className="p-5 rounded-2xl glass-card border border-white/[0.12] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-white">
                      Geographic Parcel Outlines (Schematic)
                    </div>
                    <div className="text-[11px] font-mono text-[#27D7B2]">
                      {fields.reduce((acc, f) => acc + (f.polygon?.length || 4), 0)} boundary vertices
                    </div>
                  </div>

                  <div className="w-full h-64 rounded-xl bg-black/40 border border-white/10 relative overflow-hidden flex items-center justify-center p-4">
                    <svg viewBox="0 0 500 220" className="w-full h-full">
                      <defs>
                        <pattern id="field-grid-glass" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="500" height="220" fill="url(#field-grid-glass)" />

                      {fields.map((field, idx) => {
                        const baseX = 50 + idx * 210;
                        const baseY = 40 + (idx % 2) * 20;
                        const pts = `${baseX},${baseY} ${baseX + 160},${baseY + 15} ${baseX + 140},${baseY + 130} ${baseX + 20},${baseY + 110}`;
                        return (
                          <g key={field.id} className="cursor-pointer group" onClick={() => setSelectedFieldForDetail(field)}>
                            <polygon
                              points={pts}
                              fill="rgba(39, 215, 178, 0.16)"
                              stroke="#27D7B2"
                              strokeWidth="2"
                              className="transition-all group-hover:fill-[rgba(39,215,178,0.32)]"
                            />
                            <circle cx={baseX} cy={baseY} r="4" fill="#27D7B2" />
                            <circle cx={baseX + 160} cy={baseY + 15} r="4" fill="#27D7B2" />
                            <circle cx={baseX + 140} cy={baseY + 130} r="4" fill="#27D7B2" />
                            <circle cx={baseX + 20} cy={baseY + 110} r="4" fill="#27D7B2" />
                            <text
                              x={baseX + 80}
                              y={baseY + 60}
                              fill="#FFFFFF"
                              fontSize="12"
                              fontWeight="700"
                              textAnchor="middle"
                            >
                              {field.name}
                            </text>
                            <text
                              x={baseX + 80}
                              y={baseY + 80}
                              fill="#27D7B2"
                              fontSize="11"
                              fontFamily="monospace"
                              textAnchor="middle"
                            >
                              {field.areaHa} ha • {field.currentCrop || 'Active'}
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    <div className="absolute bottom-2 right-2 text-[10px] font-mono text-[#8EA3AF] bg-black/75 px-2.5 py-1 rounded border border-white/10">
                      Click parcel to inspect coordinates &amp; geometry
                    </div>
                  </div>
                </div>

                {/* Field Comparison Table */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-white">
                    Field Registry &amp; Comparison Table
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-white/[0.12] glass-card">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-[11px] font-mono uppercase text-[#8EA3AF] bg-white/[0.02]">
                          <th className="py-3 px-4">Field Name</th>
                          <th className="py-3 px-4 text-right">Mapped Area</th>
                          <th className="py-3 px-4">Current Crop</th>
                          <th className="py-3 px-4">Soil Texture</th>
                          <th className="py-3 px-4">Water Strategy</th>
                          <th className="py-3 px-4">Boundary Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06]">
                        {fields.map((field) => (
                          <tr key={field.id} className="hover:bg-white/[0.04] transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-white">
                              <div>{field.name}</div>
                              <div className="text-[10px] font-mono text-[#8EA3AF]">{field.id}</div>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                              <div className="font-semibold text-white">{field.areaHa} ha</div>
                              <div className="text-[10px] text-[#8EA3AF]">{(field.areaHa * 2.471).toFixed(1)} ac</div>
                            </td>
                            <td className="py-3.5 px-4 text-[#A7C0CC]">
                              {field.currentCrop || 'Winter Wheat'}
                            </td>
                            <td className="py-3.5 px-4 text-[#A7C0CC] capitalize">
                              {field.soilTexture?.replace('_', ' ') || 'Sandy Loam'}
                            </td>
                            <td className="py-3.5 px-4 text-[#27D7B2] capitalize">
                              {field.irrigationMode === 'rain_only' ? 'Rain-fed' : 'Irrigated'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono bg-[#27D7B2]/15 text-[#27D7B2] border border-[#27D7B2]/30">
                                <Check className="w-3 h-3" />
                                <span>{field.polygon?.length || 4} Vertices</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedFieldForDetail(field)}
                                  className="px-2.5 py-1 rounded-lg glass-pill hover:bg-white/[0.1] text-[11px] text-[#27D7B2] font-semibold cursor-pointer border border-[#27D7B2]/30"
                                >
                                  Inspect
                                </button>
                                {fields.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => setFieldToDelete(field)}
                                    className="p-1.5 rounded-lg text-[#8EA3AF] hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                                    title="Delete field"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 3. CROP ROTATION PLAN SECTION                                 */}
            {/* ============================================================= */}
            {activeSection === 'rotations' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                  <div>
                    <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#27D7B2]">
                      <Sprout className="w-3.5 h-3.5" />
                      <span>Multi-Year Agronomic Sequence</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Crop Rotation Plan
                    </h2>
                    <p className="text-xs text-[#8EA3AF]">
                      Canonical sequence, 6-component score matrix, and biological break logic for {farm.name}.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenRotationsPage(null)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB898] hover:from-[#38E5C1] hover:to-[#27D7B2] text-[#020A10] text-xs font-bold transition-all shadow cursor-pointer"
                    >
                      <span>Open Full Rotation Matrix</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Plan Overview & 6-Component Radar Matrix */}
                <div className="glass-card rounded-2xl p-5 sm:p-6 border border-white/[0.14] shadow-xl space-y-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-white">
                          {activeRotationPlan.name}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#27D7B2]/20 text-[#27D7B2] border border-[#27D7B2]/40">
                          Recommended Plan
                        </span>
                      </div>
                      <p className="text-xs text-[#A7C0CC] mt-1 max-w-2xl leading-relaxed">
                        {activeRotationPlan.explanationSummary}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 bg-white/[0.03] p-3 rounded-xl border border-white/[0.08] shrink-0">
                      <div className="text-center px-2">
                        <div className="text-[10px] uppercase text-[#8EA3AF] font-bold">Overall Score</div>
                        <div className="text-2xl font-black font-mono text-[#27D7B2]">
                          {activeRotationPlan.totalScore}
                          <span className="text-xs text-[#8EA3AF]">/100</span>
                        </div>
                      </div>
                      <div className="w-px h-8 bg-white/10" />
                      <div className="text-center px-2">
                        <div className="text-[10px] uppercase text-[#8EA3AF] font-bold">Cycle Length</div>
                        <div className="text-lg font-bold font-mono text-white">
                          {activeRotationPlan.cycleLengthYears} Years
                        </div>
                        <div className="text-[10px] text-[#8EA3AF] font-mono">
                          {activeRotationPlan.cycleLengthSeasons} Seasons
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 6 Component Score Bars (Section 40.4 Contract) */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-semibold text-white uppercase tracking-wider block">
                      Component Evaluation Drivers (0 – 100)
                    </span>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#8EA3AF]">Suitability</span>
                          <span className="text-white font-mono font-bold">91</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-[#27D7B2] rounded-full w-[91%]" />
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#8EA3AF]">Water Saving</span>
                          <span className="text-white font-mono font-bold">88</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-cyan-400 rounded-full w-[88%]" />
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#8EA3AF]">Soil Health</span>
                          <span className="text-white font-mono font-bold">85</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full w-[85%]" />
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#8EA3AF]">Resilience</span>
                          <span className="text-white font-mono font-bold">89</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-indigo-400 rounded-full w-[89%]" />
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#8EA3AF]">Productivity</span>
                          <span className="text-white font-mono font-bold">84</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full w-[84%]" />
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#8EA3AF]">Diversity</span>
                          <span className="text-white font-mono font-bold">92</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-teal-300 rounded-full w-[92%]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Season-by-Season Sequence Cards with Year and Season Separate */}
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-semibold text-white uppercase tracking-wider block">
                      Chronological Rotation Sequence
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {activeRotationPlan.sequence.map((stage: any, idx: number) => (
                        <div
                          key={stage.cropId + idx}
                          className="p-4 rounded-xl glass-card border border-white/[0.1] space-y-3 relative overflow-hidden"
                        >
                          <div className="w-full h-28 rounded-lg overflow-hidden relative border border-white/10 bg-black/40">
                            <img
                              src={getCropImage(stage.cropName)}
                              alt={stage.cropName}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/75 text-[#27D7B2] border border-[#27D7B2]/30">
                              Year {stage.calendarYear ? stage.calendarYear - 2025 : idx < 2 ? 1 : 2}
                            </div>
                            <div className="absolute bottom-2 left-2 text-[11px] font-bold text-white">
                              {stage.seasonName}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-white text-sm">{stage.cropName}</span>
                              {stage.isLegume && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  N-Fixer
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#8EA3AF] flex items-center justify-between pt-1">
                              <span>Duration: {stage.durationDays || 120} days</span>
                              <span>Family: {stage.cropFamily}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Why this was chosen Rationale */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-2 text-xs">
                    <div className="font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#27D7B2]" />
                      <span>Agronomic Rationale &amp; Optimization Drivers</span>
                    </div>
                    <p className="text-[#A7C0CC] leading-relaxed">
                      {activeRotationPlan.deepExplanation}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/[0.06] text-[11px]">
                      <div>
                        <strong className="text-white">Why This Length:</strong>{' '}
                        <span className="text-[#8EA3AF]">{activeRotationPlan.whyThisLength}</span>
                      </div>
                      <div>
                        <strong className="text-white">Why This Order:</strong>{' '}
                        <span className="text-[#8EA3AF]">{activeRotationPlan.whyThisOrder}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 4. SOIL & LAND SECTION                                        */}
            {/* ============================================================= */}
            {activeSection === 'soil' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                  <div>
                    <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#27D7B2]">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Pedological &amp; Topographic Profile</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Soil &amp; Land Intelligence
                    </h2>
                    <p className="text-xs text-[#8EA3AF]">
                      SoilGrids 250m global telemetry, horizons breakdown, and lab verified measurements for {farm.name}.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSoilModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB898] hover:from-[#38E5C1] hover:to-[#27D7B2] text-[#020A10] text-xs font-bold transition-all shadow cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Record Soil Lab Test</span>
                  </button>
                </div>

                {/* Soil Texture Fraction Bar & Triangle Verification */}
                <div className="glass-card rounded-2xl p-5 border border-white/[0.14] space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Soil Texture Composition &amp; Verification
                      </h3>
                      <p className="text-xs text-[#8EA3AF]">
                        USDA particle size distribution: Sand (0.05–2.0 mm), Silt (0.002–0.05 mm), Clay (&lt;0.002 mm).
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Fractions Sum = 100% (Verified)</span>
                    </span>
                  </div>

                  {/* Stacked Fraction Bar */}
                  <div className="space-y-1.5">
                    <div className="w-full h-5 rounded-xl bg-black/40 overflow-hidden flex border border-white/10">
                      <div className="bg-amber-400/80 h-full flex items-center justify-center text-[10px] font-bold text-[#020A10] font-mono" style={{ width: '62%' }}>
                        Sand 62%
                      </div>
                      <div className="bg-teal-400/80 h-full flex items-center justify-center text-[10px] font-bold text-[#020A10] font-mono" style={{ width: '24%' }}>
                        Silt 24%
                      </div>
                      <div className="bg-rose-400/80 h-full flex items-center justify-center text-[10px] font-bold text-[#020A10] font-mono" style={{ width: '14%' }}>
                        Clay 14%
                      </div>
                    </div>
                    <div className="flex justify-between text-[11px] text-[#8EA3AF] px-1 font-mono">
                      <span className="text-amber-300">Coarse particles (aeration &amp; drainage)</span>
                      <span className="text-teal-300">Medium loam matrix</span>
                      <span className="text-rose-300">Fine colloids (CEC &amp; nutrient retention)</span>
                    </div>
                  </div>
                </div>

                {/* Properties Table (Section 46 Contract) */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-white">
                    Pedological Properties &amp; Horizons Registry
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-white/[0.12] glass-card">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-[11px] font-mono uppercase text-[#8EA3AF] bg-white/[0.02]">
                          <th className="py-3 px-4">Soil Property</th>
                          <th className="py-3 px-4">Value</th>
                          <th className="py-3 px-4">Unit</th>
                          <th className="py-3 px-4">Depth</th>
                          <th className="py-3 px-4">Source</th>
                          <th className="py-3 px-4 text-right">Data Quality</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06]">
                        <tr className="hover:bg-white/[0.03]">
                          <td className="py-3 px-4 font-semibold text-white">Soil pH (H₂O)</td>
                          <td className="py-3 px-4 font-mono font-bold text-[#27D7B2]">7.4</td>
                          <td className="py-3 px-4 text-[#8EA3AF]">pH index</td>
                          <td className="py-3 px-4 font-mono text-white/80">0 – 30 cm</td>
                          <td className="py-3 px-4 text-[#8EA3AF]">ISRIC SoilGrids 250m</td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-400">High (±0.2)</td>
                        </tr>
                        <tr className="hover:bg-white/[0.03]">
                          <td className="py-3 px-4 font-semibold text-white">Soil Organic Matter (SOM)</td>
                          <td className="py-3 px-4 font-mono font-bold text-white">1.8%</td>
                          <td className="py-3 px-4 text-[#8EA3AF]">% mass</td>
                          <td className="py-3 px-4 font-mono text-white/80">0 – 30 cm</td>
                          <td className="py-3 px-4 text-[#8EA3AF]">ISRIC SoilGrids 250m</td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-400">High (±0.15)</td>
                        </tr>
                        <tr className="hover:bg-white/[0.03]">
                          <td className="py-3 px-4 font-semibold text-white">Cation Exchange Capacity (CEC)</td>
                          <td className="py-3 px-4 font-mono font-bold text-white">18.4</td>
                          <td className="py-3 px-4 text-[#8EA3AF]">cmol(+)/kg</td>
                          <td className="py-3 px-4 font-mono text-white/80">0 – 30 cm</td>
                          <td className="py-3 px-4 text-[#8EA3AF]">ISRIC SoilGrids 250m</td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-400">Moderate</td>
                        </tr>
                        <tr className="hover:bg-white/[0.03]">
                          <td className="py-3 px-4 font-semibold text-white">Bulk Density</td>
                          <td className="py-3 px-4 font-mono font-bold text-white">1.38</td>
                          <td className="py-3 px-4 text-[#8EA3AF]">g/cm³</td>
                          <td className="py-3 px-4 font-mono text-white/80">0 – 30 cm</td>
                          <td className="py-3 px-4 text-[#8EA3AF]">ISRIC SoilGrids 250m</td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-400">High</td>
                        </tr>
                        <tr className="hover:bg-white/[0.03]">
                          <td className="py-3 px-4 font-semibold text-white">Available Water Capacity (AWC)</td>
                          <td className="py-3 px-4 font-mono font-bold text-[#27D7B2]">14.2</td>
                          <td className="py-3 px-4 text-[#8EA3AF]">mm / 100mm</td>
                          <td className="py-3 px-4 font-mono text-white/80">0 – 100 cm</td>
                          <td className="py-3 px-4 text-[#8EA3AF]">FAO-56 Soil Model</td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-400">High</td>
                        </tr>
                        <tr className="hover:bg-white/[0.03]">
                          <td className="py-3 px-4 font-semibold text-white">Salinity / Electrical Conductivity</td>
                          <td className="py-3 px-4 font-mono font-bold text-white">1.2</td>
                          <td className="py-3 px-4 text-[#8EA3AF]">dS/m (ECe)</td>
                          <td className="py-3 px-4 font-mono text-white/80">0 – 60 cm</td>
                          <td className="py-3 px-4 text-[#8EA3AF]">NASA SMAP &amp; Local Test</td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-400">Non-saline</td>
                        </tr>
                        <tr className="hover:bg-white/[0.03]">
                          <td className="py-3 px-4 font-semibold text-white">Topographic Slope &amp; Erosion</td>
                          <td className="py-3 px-4 font-mono font-bold text-white">1.8%</td>
                          <td className="py-3 px-4 text-[#8EA3AF]">percent grade</td>
                          <td className="py-3 px-4 font-mono text-white/80">Surface</td>
                          <td className="py-3 px-4 text-[#8EA3AF]">NASA SRTM 30m DEM</td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-400">Low Risk</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Soil Horizons Depth Profile */}
                <div className="glass-card rounded-2xl p-5 border border-white/[0.12] space-y-3">
                  <div className="text-xs font-semibold text-white">
                    Root-Zone Soil Profile Horizons (0 – 100 cm)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">Horizon A (Topsoil)</span>
                        <span className="font-mono text-[#27D7B2] text-[11px]">0 – 30 cm</span>
                      </div>
                      <p className="text-[11px] text-[#8EA3AF] leading-relaxed">
                        Maximum biological activity, root mass density, and applied nutrient uptake. High infiltration rate (22 mm/hr).
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">Horizon B (Subsoil)</span>
                        <span className="font-mono text-cyan-400 text-[11px]">30 – 60 cm</span>
                      </div>
                      <p className="text-[11px] text-[#8EA3AF] leading-relaxed">
                        Nutrient buffering zone with increased clay fraction. Provides capillary moisture reserve during dry spells.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">Horizon C (Deep Substratum)</span>
                        <span className="font-mono text-indigo-400 text-[11px]">60 – 100 cm</span>
                      </div>
                      <p className="text-[11px] text-[#8EA3AF] leading-relaxed">
                        Coarse parent material with free drainage. Absence of impenetrable hardpan ensures healthy deep taproots.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 5. WATER INTELLIGENCE SECTION                                 */}
            {/* ============================================================= */}
            {activeSection === 'water' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                  <div>
                    <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#27D7B2]">
                      <Droplets className="w-3.5 h-3.5" />
                      <span>FAO-56 Evapotranspiration &amp; Mass Balance</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Water Intelligence Ledger
                    </h2>
                    <p className="text-xs text-[#8EA3AF]">
                      Dual crop evapotranspiration, rainfall contributions, and net daily root-zone balance for {farm.name}.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsIrrigationModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB898] hover:from-[#38E5C1] hover:to-[#27D7B2] text-[#020A10] text-xs font-bold transition-all shadow cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Log Irrigation Event</span>
                    </button>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl glass-card border border-white/[0.12]">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-[#8EA3AF]">Crop Demand (ETc)</div>
                    <div className="text-xl font-bold font-mono text-white tabular-nums mt-0.5">
                      4.2 <span className="text-xs text-[#27D7B2]">mm/day</span>
                    </div>
                    <div className="text-[11px] text-[#8EA3AF]">
                      Peak stage: Kc = 1.05
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase text-[#8EA3AF]">7-Day Rainfall Forecast</div>
                    <div className="text-xl font-bold font-mono text-white tabular-nums mt-0.5">
                      12.4 <span className="text-xs text-[#27D7B2]">mm</span>
                    </div>
                    <div className="text-[11px] text-[#8EA3AF]">
                      65% effective infiltration
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase text-[#8EA3AF]">Net Irrigation Need</div>
                    <div className="text-xl font-bold font-mono text-[#27D7B2] tabular-nums mt-0.5">
                      18.0 <span className="text-xs text-[#8EA3AF]">mm/wk</span>
                    </div>
                    <div className="text-[11px] text-[#8EA3AF]">
                      Planned next: in 3 days
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase text-[#8EA3AF]">Root Storage Level</div>
                    <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums mt-0.5">
                      68% <span className="text-xs text-[#8EA3AF]">AWC</span>
                    </div>
                    <div className="text-[11px] text-emerald-300">
                      Within optimum envelope
                    </div>
                  </div>
                </div>

                {/* Event vs Routine Notice (Section 47 Contract) */}
                <div className="p-4 rounded-xl glass-card border border-white/[0.1] flex items-start gap-3">
                  <Info className="w-4 h-4 text-[#27D7B2] shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <span className="font-semibold text-white">Event vs Routine Separation Contract</span>
                    <p className="text-[#A7C0CC] leading-relaxed">
                      A management routine defines expected scheduling (e.g., drip 2x/week); an event represents actual verified water delivery.
                      FieldShift never conflates assumed irrigation with measured meter telemetry.
                    </p>
                  </div>
                </div>

                {/* Daily Mass-Balance Ledger Table (14-Day Window) */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-white">
                    14-Day Daily Mass-Balance Ledger (Observed &amp; 7-Day Forecast)
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-white/[0.12] glass-card">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-[11px] font-mono uppercase text-[#8EA3AF] bg-white/[0.02]">
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4 text-right">ET₀ (mm)</th>
                          <th className="py-3 px-4 text-right">Kc</th>
                          <th className="py-3 px-4 text-right">ETc (mm)</th>
                          <th className="py-3 px-4 text-right">Rain (mm)</th>
                          <th className="py-3 px-4 text-right">Irrigation (mm)</th>
                          <th className="py-3 px-4 text-right">Daily Balance</th>
                          <th className="py-3 px-4 text-right">Root Storage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06] font-mono">
                        {[
                          { date: 'Oct 28 (Obs)', et0: '4.1', kc: '1.02', etc: '4.2', rain: '0.0', irrig: '20.0', bal: '+15.8', stor: '78%', type: 'observed' },
                          { date: 'Oct 29 (Obs)', et0: '4.2', kc: '1.02', etc: '4.3', rain: '0.0', irrig: '0.0', bal: '-4.3', stor: '74%', type: 'observed' },
                          { date: 'Oct 30 (Obs)', et0: '4.0', kc: '1.03', etc: '4.1', rain: '0.0', irrig: '0.0', bal: '-4.1', stor: '70%', type: 'observed' },
                          { date: 'Oct 31 (Obs)', et0: '3.9', kc: '1.03', etc: '4.0', rain: '1.2', irrig: '0.0', bal: '-2.8', stor: '68%', type: 'observed' },
                          { date: 'Nov 01 (Today)', et0: '4.1', kc: '1.04', etc: '4.3', rain: '0.0', irrig: '0.0', bal: '-4.3', stor: '65%', type: 'current' },
                          { date: 'Nov 02 (Fcst)', et0: '4.2', kc: '1.04', etc: '4.4', rain: '0.0', irrig: '18.0', bal: '+13.6', stor: '76%', type: 'forecast' },
                          { date: 'Nov 03 (Fcst)', et0: '4.0', kc: '1.05', etc: '4.2', rain: '6.4', irrig: '0.0', bal: '+2.2', stor: '78%', type: 'forecast' },
                          { date: 'Nov 04 (Fcst)', et0: '3.8', kc: '1.05', etc: '4.0', rain: '4.8', irrig: '0.0', bal: '+0.8', stor: '79%', type: 'forecast' },
                        ].map((row, ridx) => (
                          <tr key={ridx} className={`hover:bg-white/[0.04] transition-colors ${row.type === 'current' ? 'bg-[#27D7B2]/[0.06]' : ''}`}>
                            <td className="py-3 px-4 font-sans font-semibold text-white">
                              {row.date}
                            </td>
                            <td className="py-3 px-4 text-right text-[#8EA3AF]">{row.et0}</td>
                            <td className="py-3 px-4 text-right text-white/80">{row.kc}</td>
                            <td className="py-3 px-4 text-right text-white font-semibold">{row.etc}</td>
                            <td className="py-3 px-4 text-right text-cyan-300">{row.rain}</td>
                            <td className="py-3 px-4 text-right text-[#27D7B2] font-semibold">{row.irrig}</td>
                            <td className={`py-3 px-4 text-right font-bold ${row.bal.startsWith('+') ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {row.bal}
                            </td>
                            <td className="py-3 px-4 text-right text-white font-bold">{row.stor}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 6. WEATHER & CLIMATE SECTION                                  */}
            {/* ============================================================= */}
            {activeSection === 'weather' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                  <div>
                    <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#27D7B2]">
                      <CloudRain className="w-3.5 h-3.5" />
                      <span>NASA POWER &amp; ECMWF Reanalysis</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Weather &amp; Climate Telemetry
                    </h2>
                    <p className="text-xs text-[#8EA3AF]">
                      Atmospheric conditions, 5-day forecast, and 30-year NASA POWER climatology baseline for {farm.name}.
                    </p>
                  </div>

                  <span className="text-xs font-mono text-[#27D7B2] px-3 py-1.5 rounded-xl glass-pill border border-[#27D7B2]/30">
                    Live Station Telemetry Active
                  </span>
                </div>

                {/* Current Weather Banner */}
                <div className="glass-card rounded-2xl p-6 border border-white/[0.14] shadow-xl space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#27D7B2]/15 border border-[#27D7B2]/30 flex items-center justify-center text-[#27D7B2]">
                        <Sun className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-3xl font-extrabold font-mono text-white">28.4°C</span>
                          <span className="text-xs text-[#8EA3AF] font-mono">Feels like 29.1°C</span>
                        </div>
                        <p className="text-xs text-[#27D7B2] font-semibold mt-0.5">
                          Clear Sky • High Solar Irradiance
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-[#8EA3AF] block font-sans">Relative Humidity</span>
                        <span className="text-white font-bold">48%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8EA3AF] block font-sans">Wind Speed</span>
                        <span className="text-white font-bold">12.5 km/h NW</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8EA3AF] block font-sans">Solar Radiation</span>
                        <span className="text-[#27D7B2] font-bold">640 W/m²</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8EA3AF] block font-sans">Barometer</span>
                        <span className="text-white font-bold">1014 hPa</span>
                      </div>
                    </div>
                  </div>

                  {/* 5-Day Forecast Grid */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-white uppercase tracking-wider block">
                      5-Day Operational Forecast
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        { day: 'Wed (Today)', icon: Sun, high: '29°C', low: '18°C', rain: '0%', wind: '12 km/h' },
                        { day: 'Thu', icon: Sun, high: '30°C', low: '19°C', rain: '0%', wind: '14 km/h' },
                        { day: 'Fri', icon: CloudRain, high: '26°C', low: '17°C', rain: '45%', wind: '18 km/h' },
                        { day: 'Sat', icon: CloudRain, high: '25°C', low: '16°C', rain: '60%', wind: '20 km/h' },
                        { day: 'Sun', icon: Sun, high: '28°C', low: '18°C', rain: '10%', wind: '11 km/h' },
                      ].map((fc, fidx) => {
                        const Icon = fc.icon;
                        return (
                          <div key={fidx} className="p-3 rounded-xl glass-card border border-white/[0.08] text-center space-y-1.5">
                            <span className="text-xs font-bold text-white block">{fc.day}</span>
                            <div className="flex justify-center text-[#27D7B2] py-1">
                              <Icon className="w-6 h-6" />
                            </div>
                            <div className="text-xs font-mono font-bold text-white">
                              {fc.high} <span className="text-[#8EA3AF] font-normal">{fc.low}</span>
                            </div>
                            <div className="text-[10px] font-mono text-cyan-300">
                              Rain: {fc.rain}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 30-Year NASA POWER Climatology Baseline Comparison */}
                <div className="glass-card rounded-2xl p-5 border border-white/[0.12] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-white">
                      30-Year NASA POWER Climatology Baseline (1991–2020)
                    </div>
                    <span className="text-[10px] font-mono text-[#27D7B2]">NASA POWER MERRA-2</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                      <span className="text-[#8EA3AF]">Growing Degree Days (GDD)</span>
                      <div className="text-lg font-bold font-mono text-white">
                        1,420 <span className="text-xs text-emerald-400 font-normal">(+4.2% vs historical)</span>
                      </div>
                      <p className="text-[11px] text-[#8EA3AF]">Optimal thermal accumulation for winter cereal tillering.</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                      <span className="text-[#8EA3AF]">Precipitation Anomaly</span>
                      <div className="text-lg font-bold font-mono text-cyan-300">
                        +14 mm <span className="text-xs text-white/80 font-normal">above seasonal median</span>
                      </div>
                      <p className="text-[11px] text-[#8EA3AF]">Beneficial early recharge of subsoil moisture reserves.</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                      <span className="text-[#8EA3AF]">Extreme Heat Risk (&gt;35°C)</span>
                      <div className="text-lg font-bold font-mono text-emerald-400">
                        Low Risk <span className="text-xs text-white/80 font-normal">through flowering</span>
                      </div>
                      <p className="text-[11px] text-[#8EA3AF]">No thermal stress anticipated during grain pollination.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 7. VEGETATION & SATELLITE SECTION                              */}
            {/* ============================================================= */}
            {activeSection === 'vegetation' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                  <div>
                    <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#27D7B2]">
                      <Activity className="w-3.5 h-3.5" />
                      <span>Copernicus Sentinel-2 10m VNIR</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Vegetation &amp; Satellite Telemetry
                    </h2>
                    <p className="text-xs text-[#8EA3AF]">
                      Normalized Difference Vegetation Index (NDVI) and temporal vegetative vigor curve for {farm.name}.
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <Check className="w-3 h-3" />
                    <span>Cloud Cover &lt; 3% (Screened)</span>
                  </span>
                </div>

                {/* Satellite Scene Metadata Card */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl glass-card border border-white/[0.12]">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-[#8EA3AF]">Sensor Platform</div>
                    <div className="text-base font-bold text-white mt-0.5">
                      Sentinel-2 MSI
                    </div>
                    <div className="text-[11px] text-[#8EA3AF]">
                      10m Spatial Resolution
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase text-[#8EA3AF]">Acquisition Date</div>
                    <div className="text-base font-bold font-mono text-white mt-0.5">
                      Oct 29, 2026
                    </div>
                    <div className="text-[11px] text-[#27D7B2]">
                      Fresh scene (3 days old)
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase text-[#8EA3AF]">Mean NDVI Index</div>
                    <div className="text-xl font-black font-mono text-[#27D7B2] mt-0.5">
                      0.68
                    </div>
                    <div className="text-[11px] text-[#8EA3AF]">
                      Dense vegetative canopy
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase text-[#8EA3AF]">In-Field Uniformity</div>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">
                      92.8% CV
                    </div>
                    <div className="text-[11px] text-[#8EA3AF]">
                      Minimal dry-spot variance
                    </div>
                  </div>
                </div>

                {/* Temporal Vegetative Vigor Curve */}
                <div className="glass-card rounded-2xl p-6 border border-white/[0.14] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Temporal Vegetative Vigor Trajectory (NDVI Curve)
                      </h3>
                      <p className="text-xs text-[#8EA3AF]">
                        Tracking chlorophyll absorption and biomass accumulation across current crop stage.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#27D7B2]">
                      Current Stage: Peak Vegetative (0.68)
                    </span>
                  </div>

                  {/* Visual SVG Vigor Curve */}
                  <div className="w-full h-48 rounded-xl bg-black/40 border border-white/10 p-4 relative overflow-hidden flex items-end">
                    <svg viewBox="0 0 500 120" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#27D7B2" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#27D7B2" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Area under curve */}
                      <path
                        d="M 20 100 Q 120 80, 200 40 T 320 30 T 480 95 L 480 120 L 20 120 Z"
                        fill="url(#ndviGrad)"
                      />

                      {/* Curve line */}
                      <path
                        d="M 20 100 Q 120 80, 200 40 T 320 30 T 480 95"
                        fill="none"
                        stroke="#27D7B2"
                        strokeWidth="3"
                      />

                      {/* Key stage markers */}
                      <circle cx="20" cy="100" r="4" fill="#8EA3AF" />
                      <circle cx="200" cy="40" r="4" fill="#27D7B2" />
                      <circle cx="320" cy="30" r="6" fill="#27D7B2" stroke="#FFFFFF" strokeWidth="2" />
                      <circle cx="480" cy="95" r="4" fill="#8EA3AF" />

                      <text x="20" y="118" fill="#8EA3AF" fontSize="10" textAnchor="start">Emergence (0.22)</text>
                      <text x="200" y="25" fill="#8EA3AF" fontSize="10" textAnchor="middle">Tillering (0.45)</text>
                      <text x="320" y="15" fill="#27D7B2" fontSize="11" fontWeight="700" textAnchor="middle">Current (0.68)</text>
                      <text x="480" y="118" fill="#8EA3AF" fontSize="10" textAnchor="end">Senescence (0.28)</text>
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 8. ACTIONS & JOURNAL SECTION (Section 15.4 / 49 Contract)      */}
            {/* ============================================================= */}
            {activeSection === 'journal' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                  <div>
                    <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#27D7B2]">
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>Audit Trail &amp; Scouting Records</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Decision Journal &amp; Field Log
                    </h2>
                    <p className="text-xs text-[#8EA3AF]">
                      Append-only change log of rotation decisions and empirical scouting observations for {farm.name}.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {journalSubTab === 'decisions' ? (
                      <button
                        type="button"
                        onClick={() => setIsDecisionModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB898] hover:from-[#38E5C1] hover:to-[#27D7B2] text-[#020A10] text-xs font-bold transition-all shadow cursor-pointer"
                      >
                        <History className="w-4 h-4 stroke-[2.5]" />
                        <span>Record Plan Decision</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsLoggingFormOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB898] hover:from-[#38E5C1] hover:to-[#27D7B2] text-[#020A10] text-xs font-bold transition-all shadow cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Log Field Observation</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Subtab Switcher */}
                <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setJournalSubTab('decisions')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-2 ${
                      journalSubTab === 'decisions'
                        ? 'bg-[#27D7B2]/15 text-[#27D7B2] border border-[#27D7B2]/40 font-bold'
                        : 'text-[#8EA3AF] hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <span>Plan Decision Log (Section 15.4 Audit)</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#27D7B2]/20 text-[#27D7B2]">
                      {decisionEvents.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setJournalSubTab('observations')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-2 ${
                      journalSubTab === 'observations'
                        ? 'bg-[#27D7B2]/15 text-[#27D7B2] border border-[#27D7B2]/40 font-bold'
                        : 'text-[#8EA3AF] hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <span>Field Scouting &amp; Management Observations</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-cyan-400/20 text-cyan-300">
                      {farmerLogs.length}
                    </span>
                  </button>
                </div>

                {/* SUBTAB 1: PLAN DECISION LOG (Section 15.4 Contract) */}
                {journalSubTab === 'decisions' && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl glass-card border border-white/[0.1] text-xs text-[#A7C0CC]">
                      <span className="font-semibold text-[#27D7B2]">Audit Event Contract:</span> Decision events are append-only.
                      Whenever a plan is selected, deferred, or replaced, the actor, timestamp, prior plan version, and optional farmer reason
                      are retained without rewriting historical model scores.
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-white/[0.12] glass-card">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/[0.08] text-[11px] font-mono uppercase text-[#8EA3AF] bg-white/[0.02]">
                            <th className="py-3 px-4">Date &amp; Time</th>
                            <th className="py-3 px-4">Decision Action</th>
                            <th className="py-3 px-4">Prior Plan</th>
                            <th className="py-3 px-4">New Plan / Target</th>
                            <th className="py-3 px-4">Actor</th>
                            <th className="py-3 px-4">Decision Reason</th>
                            <th className="py-3 px-4 text-right">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.06]">
                          {decisionEvents.map((dec) => {
                            const actionBadge =
                              dec.action === 'selected'
                                ? { bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40', label: 'Selected' }
                                : dec.action === 'rejected'
                                ? { bg: 'bg-rose-500/15 text-rose-300 border-rose-500/40', label: 'Rejected' }
                                : dec.action === 'replaced'
                                ? { bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40', label: 'Replaced' }
                                : { bg: 'bg-amber-500/15 text-amber-300 border-amber-500/40', label: 'Deferred' };

                            return (
                              <tr key={dec.id} className="hover:bg-white/[0.03] transition-colors">
                                <td className="py-3 px-4 font-mono text-[#8EA3AF] whitespace-nowrap">
                                  {new Date(dec.timestamp).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: '2-digit',
                                    year: 'numeric',
                                  })}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${actionBadge.bg}`}>
                                    {actionBadge.label}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-[#8EA3AF] truncate max-w-[140px]">
                                  {dec.priorPlanName || '—'}
                                </td>
                                <td className="py-3 px-4 font-medium text-white truncate max-w-[180px]">
                                  {dec.newPlanName || '—'}
                                </td>
                                <td className="py-3 px-4 text-[#8EA3AF]">{dec.actor}</td>
                                <td className="py-3 px-4 text-white capitalize">{dec.reason || 'General'}</td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedDecisionDiff(dec)}
                                    className="px-2.5 py-1 rounded-lg glass-pill hover:bg-white/[0.08] text-[11px] text-[#27D7B2] font-semibold cursor-pointer border border-[#27D7B2]/30"
                                  >
                                    View Note
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUBTAB 2: FIELD SCOUTING & OBSERVATIONS (7-col / 5-col Contract) */}
                {journalSubTab === 'observations' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* 7-Col List on Desktop */}
                    <div className="lg:col-span-7 space-y-3">
                      <div className="flex items-center justify-between text-xs pb-1">
                        <span className="font-semibold text-white">Scouting &amp; Field Records ({farmerLogs.length})</span>
                        <div className="flex items-center gap-2">
                          <select
                            value={observationFilterCategory}
                            onChange={(e) => setObservationFilterCategory(e.target.value)}
                            className="px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-white text-[11px]"
                          >
                            <option value="all">All Categories</option>
                            <option value="observation">Observations</option>
                            <option value="yield">Yields</option>
                            <option value="irrigation">Irrigation</option>
                            <option value="fertilizer">Fertilizer</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {farmerLogs
                          .filter((l) => observationFilterCategory === 'all' || l.category === observationFilterCategory)
                          .map((log) => (
                            <div
                              key={log.id}
                              className="p-4 rounded-xl glass-card border border-white/[0.1] space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#27D7B2]/15 text-[#27D7B2] border border-[#27D7B2]/30">
                                    {log.category}
                                  </span>
                                  <h4 className="font-bold text-white text-xs sm:text-sm">{log.title}</h4>
                                </div>
                                <span className="text-[11px] font-mono text-[#8EA3AF]">{log.date}</span>
                              </div>

                              <p className="text-xs text-[#A7C0CC] leading-relaxed">
                                {log.note}
                              </p>

                              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/[0.06] text-[#8EA3AF]">
                                <span>Parcel: <strong className="text-white">{log.fieldName || 'Parcel A'}</strong></span>
                                {log.yieldAmount && (
                                  <span className="text-emerald-400 font-mono font-bold">Yield: {log.yieldAmount}</span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* 5-Col Quick Log Form on Desktop (Noticeable Transparent Glass) */}
                    <div className="lg:col-span-5 p-5 rounded-2xl glass-card backdrop-blur-xl border border-white/[0.14] shadow-xl space-y-4">
                      <div className="border-b border-white/[0.08] pb-2">
                        <h4 className="text-sm font-bold text-white">Log New Observation</h4>
                        <p className="text-[11px] text-[#8EA3AF]">Add scouting telemetry directly to the field record.</p>
                      </div>

                      <form onSubmit={handleAddFarmerLog} className="space-y-3 text-xs">
                        <div>
                          <label className="block text-[11px] text-[#8EA3AF] mb-1 font-medium">Category</label>
                          <select
                            value={newLogCategory}
                            onChange={(e) => setNewLogCategory(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-medium focus:outline-none focus:border-[#27D7B2]"
                          >
                            <option value="observation">Canopy / Scouting Observation</option>
                            <option value="irrigation">Irrigation Event</option>
                            <option value="yield">Yield Harvest</option>
                            <option value="fertilizer">Fertilizer Application</option>
                            <option value="issue">Pest / Disease Sighting</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] text-[#8EA3AF] mb-1 font-medium">Title</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Mid-season root probe check"
                            value={newLogTitle}
                            onChange={(e) => setNewLogTitle(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[#27D7B2]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-[#8EA3AF] mb-1 font-medium">Observations / Notes</label>
                          <textarea
                            rows={3}
                            required
                            placeholder="Enter specific field notes, moisture readings, or canopy observations..."
                            value={newLogNote}
                            onChange={(e) => setNewLogNote(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[#27D7B2]"
                          />
                        </div>

                        {newLogCategory === 'yield' && (
                          <div>
                            <label className="block text-[11px] text-[#8EA3AF] mb-1 font-medium">Yield Measured (t/ha)</label>
                            <input
                              type="text"
                              placeholder="e.g. 4.2 t/ha"
                              value={newLogYield}
                              onChange={(e) => setNewLogYield(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[#27D7B2]"
                            />
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB898] hover:from-[#38E5C1] hover:to-[#27D7B2] text-[#020A10] font-bold text-xs shadow-md transition-all cursor-pointer"
                        >
                          Save Field Entry
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================= */}
            {/* 9. PAST ANALYSES / REPORTS SECTION                            */}
            {/* ============================================================= */}
            {activeSection === 'reports' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                  <div>
                    <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#27D7B2]">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Historical Agronomic Audits</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Past Analyses &amp; Reports
                    </h2>
                    <p className="text-xs text-[#8EA3AF]">
                      Dated optimization runs, model versions, and recommendation comparisons for {farm.name}.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleTriggerReanalyze}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB898] hover:from-[#38E5C1] hover:to-[#27D7B2] text-[#020A10] text-xs font-bold transition-all shadow cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Run Deep Analysis Now</span>
                  </button>
                </div>

                {/* Reports List */}
                <div className="space-y-4">
                  {pastReports.map((rep) => (
                    <div
                      key={rep.id}
                      className="glass-card rounded-2xl p-5 border border-white/[0.12] space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <h3 className="text-base font-bold text-white">{rep.title}</h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#27D7B2]/15 text-[#27D7B2] border border-[#27D7B2]/30">
                              {rep.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#8EA3AF] font-mono">
                            ID: {rep.id} • Date: {rep.date} • {rep.engineVersion}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-[10px] text-[#8EA3AF] uppercase block">Suitability Score</span>
                            <span className="text-xl font-black font-mono text-[#27D7B2]">{rep.overallScore}/100</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleExport}
                            className="px-3 py-1.5 rounded-xl glass-pill hover:bg-white/[0.1] text-xs font-semibold text-white border border-white/[0.12] cursor-pointer"
                          >
                            Print Summary
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-[#A7C0CC] leading-relaxed">
                        {rep.summary}
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                          <span className="text-[10px] text-[#8EA3AF] block">Water Efficiency</span>
                          <span className="text-white font-bold font-mono">{rep.waterScore} / 100</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                          <span className="text-[10px] text-[#8EA3AF] block">Soil Rebuilding</span>
                          <span className="text-white font-bold font-mono">{rep.soilScore} / 100</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                          <span className="text-[10px] text-[#8EA3AF] block">Arable Basis</span>
                          <span className="text-white font-bold font-mono">{fieldSize} ha</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                          <span className="text-[10px] text-[#8EA3AF] block">Recommendation</span>
                          <span className="text-[#27D7B2] font-semibold">Diversified Pulse</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 10. FARM SETTINGS SECTION                                     */}
            {/* ============================================================= */}
            {activeSection === 'settings' && (
              <div className="space-y-6 animate-in fade-in duration-200 max-w-2xl">
                {/* Header */}
                <div className="pb-3 border-b border-white/[0.08]">
                  <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#27D7B2]">
                    <Settings className="w-3.5 h-3.5" />
                    <span>Configuration &amp; Data Control</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Farm Settings
                  </h2>
                  <p className="text-xs text-[#8EA3AF]">
                    Manage parcel identity, agronomic defaults, unit systems, and deletion safeguards for {farm.name}.
                  </p>
                </div>

                {/* 1. Farm Identity Card */}
                <div className="glass-card rounded-2xl p-5 border border-white/[0.14] space-y-4">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Farm Profile &amp; Location
                  </div>

                  {!isEditingName ? (
                    <div
                      onClick={() => setIsEditingName(true)}
                      className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 flex items-center justify-between cursor-pointer transition-colors group"
                    >
                      <div>
                        <span className="text-sm sm:text-base font-semibold text-white group-hover:text-[#27D7B2] transition-colors block">
                          {farm.name}
                        </span>
                        <span className="text-xs text-[#8EA3AF]">{farmLocation} • {fieldSize} ha</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#8EA3AF] group-hover:text-[#27D7B2]">
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveName} className="space-y-3">
                      <div>
                        <label className="block text-[11px] text-[#8EA3AF] mb-1">Farm Name</label>
                        <input
                          type="text"
                          value={editFarmName}
                          onChange={(e) => setEditFarmName(e.target.value)}
                          autoFocus
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-[#27D7B2] text-sm text-white font-medium focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB898] hover:from-[#38E5C1] hover:to-[#27D7B2] text-[#020A10] text-xs font-bold transition-all shadow cursor-pointer"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditFarmName(farm.name);
                            setIsEditingName(false);
                          }}
                          className="px-3 py-2 rounded-xl glass-pill hover:bg-white/10 text-white text-xs font-medium transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {settingsSaved && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <Check className="w-3.5 h-3.5" />
                      <span>Farm profile updated</span>
                    </span>
                  )}
                </div>

                {/* 2. Re-analyse Button */}
                <div className="glass-card rounded-2xl p-5 border border-white/[0.14] space-y-3">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Re-run Analysis Engine
                  </div>
                  <p className="text-xs text-[#8EA3AF]">
                    Re-open the guided wizard to adjust soil textures, water quotas, or priority weights.
                  </p>
                  <button
                    type="button"
                    onClick={handleTriggerReanalyze}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl glass-pill hover:bg-white/[0.1] border border-[#27D7B2]/40 text-[#27D7B2] text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Re-analyse Farm (Edit Questions)</span>
                  </button>
                </div>

                {/* 3. Delete Farm Safeguard */}
                <div className="glass-card rounded-2xl p-5 border border-rose-500/25 space-y-3">
                  <div className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                    Delete Parcel Safeguard
                  </div>

                  {!showDeleteConfirm ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Farm Parcel</span>
                      </button>
                      <p className="text-[11px] text-rose-300/70 mt-1.5">
                        Permanent action: All parcel boundaries, scouting logs, and decision events will be purged.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-3">
                      <p className="text-xs sm:text-sm font-semibold text-white">
                        Are you certain you want to permanently delete {farm.name}?
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleDeleteConfirm}
                          className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          Yes, Delete Farm
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-4 py-2 rounded-xl glass-pill hover:bg-white/10 text-white text-xs font-medium transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODALS & DRAWERS: FIELDS, INSPECTION, IRRIGATION, DECISIONS         */}
      {/* =================================================================== */}

      {/* 1. Add Field Boundary Modal */}
      {isAddFieldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl glass-card border border-white/[0.2] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.1]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#27D7B2]" />
                <h3 className="text-base font-semibold text-white">Add Field Boundary</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddFieldModalOpen(false)}
                className="p-1 rounded-lg text-[#8EA3AF] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddField} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-mono uppercase text-[#8EA3AF] mb-1">
                  Field / Parcel Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Parcel 02"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[#27D7B2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#8EA3AF] mb-1">
                    Area (Hectares)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    value={newFieldArea}
                    onChange={(e) => setNewFieldArea(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-[#27D7B2]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#8EA3AF] mb-1">
                    Current Crop
                  </label>
                  <input
                    type="text"
                    value={newFieldCrop}
                    onChange={(e) => setNewFieldCrop(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[#27D7B2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#8EA3AF] mb-1">
                    Soil Texture
                  </label>
                  <select
                    value={newFieldSoil}
                    onChange={(e) => setNewFieldSoil(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[#27D7B2]"
                  >
                    <option value="sandy">Sandy</option>
                    <option value="sandy_loam">Sandy Loam</option>
                    <option value="loam">Loam</option>
                    <option value="silt_loam">Silt Loam</option>
                    <option value="clay">Clay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#8EA3AF] mb-1">
                    Water Strategy
                  </label>
                  <select
                    value={newFieldIrrigation}
                    onChange={(e) => setNewFieldIrrigation(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[#27D7B2]"
                  >
                    <option value="rain_and_irrigation">Irrigated</option>
                    <option value="rain_only">Rain-fed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[#8EA3AF] mb-1">
                  Parcel Description / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional notes on soil variability, irrigation infrastructure..."
                  value={newFieldNotes}
                  onChange={(e) => setNewFieldNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[#27D7B2]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB898] hover:from-[#38E5C1] hover:to-[#27D7B2] text-[#020A10] font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Save Field Parcel
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddFieldModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl glass-pill hover:bg-white/10 text-white font-medium text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Field Detail Inspector Modal */}
      {selectedFieldForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl glass-card border border-white/[0.2] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.1]">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#27D7B2]" />
                <h3 className="text-base font-semibold text-white">
                  {selectedFieldForDetail.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFieldForDetail(null)}
                className="p-1 rounded-lg text-[#8EA3AF] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <div>
                  <span className="text-[#8EA3AF] block">Mapped Area</span>
                  <span className="text-white font-bold font-mono text-sm">
                    {selectedFieldForDetail.areaHa} ha ({((selectedFieldForDetail.areaHa || 10) * 2.471).toFixed(1)} ac)
                  </span>
                </div>
                <div>
                  <span className="text-[#8EA3AF] block">Active Crop</span>
                  <span className="text-white font-semibold">
                    {selectedFieldForDetail.currentCrop || 'Winter Wheat'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-mono uppercase text-[#8EA3AF] block mb-1">
                  Boundary Vertices (WGS84 Lat / Lon Coordinates)
                </span>
                <div className="p-3 rounded-xl bg-black/50 border border-white/10 font-mono text-[11px] text-[#27D7B2] max-h-36 overflow-y-auto space-y-1">
                  {(selectedFieldForDetail.polygon || [
                    [25.6741, 55.9804],
                    [25.6771, 55.9824],
                    [25.6761, 55.9854],
                    [25.6731, 55.9834],
                  ]).map((pt, pidx) => (
                    <div key={pidx} className="flex justify-between border-b border-white/5 pb-0.5">
                      <span className="text-white/60">Vertex {pidx + 1}:</span>
                      <span>{pt[0].toFixed(5)}, {pt[1].toFixed(5)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedFieldForDetail(null)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB898] text-[#020A10] font-bold text-xs cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Log Irrigation Event Modal */}
      {isIrrigationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl glass-card border border-white/[0.2] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.1]">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-[#27D7B2]" />
                <h3 className="text-base font-semibold text-white">Log Irrigation Event</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsIrrigationModalOpen(false)}
                className="p-1 rounded-lg text-[#8EA3AF] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogIrrigationEvent} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-[#8EA3AF] mb-1 font-medium">Target Field</label>
                <select
                  value={irrigationFieldId}
                  onChange={(e) => setIrrigationFieldId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                >
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.areaHa} ha)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#8EA3AF] mb-1 font-medium">Date Applied</label>
                  <input
                    type="date"
                    required
                    value={irrigationDate}
                    onChange={(e) => setIrrigationDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#8EA3AF] mb-1 font-medium">Amount (mm)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={irrigationAmountMm}
                    onChange={(e) => setIrrigationAmountMm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#8EA3AF] mb-1 font-medium">Application Method</label>
                  <select
                    value={irrigationMethod}
                    onChange={(e) => setIrrigationMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                  >
                    <option value="drip">Drip Irrigation</option>
                    <option value="center_pivot">Center Pivot</option>
                    <option value="sprinkler">Solid Set Sprinkler</option>
                    <option value="furrow">Furrow / Surface</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-[#8EA3AF] mb-1 font-medium">Duration (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={irrigationDurationHours}
                    onChange={(e) => setIrrigationDurationHours(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB898] hover:from-[#38E5C1] hover:to-[#27D7B2] text-[#020A10] font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Record Irrigation Event
                </button>
                <button
                  type="button"
                  onClick={() => setIsIrrigationModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl glass-pill hover:bg-white/10 text-white font-medium text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Plan Decision Audit Modal (Section 15.4 Contract) */}
      {isDecisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl glass-card border border-white/[0.2] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.1]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#27D7B2]" />
                <h3 className="text-base font-semibold text-white">Record Plan Decision Event</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDecisionModalOpen(false)}
                className="p-1 rounded-lg text-[#8EA3AF] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDecisionEvent} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-[#8EA3AF] mb-1 font-medium">Decision Action</label>
                <select
                  value={newDecAction}
                  onChange={(e) => setNewDecAction(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                >
                  <option value="selected">Selected New Active Plan</option>
                  <option value="replaced">Replaced Existing Plan</option>
                  <option value="deferred">Deferred Decision</option>
                  <option value="rejected">Rejected Proposed Plan</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#8EA3AF] mb-1 font-medium">Actor / Role</label>
                <input
                  type="text"
                  value={newDecActor}
                  onChange={(e) => setNewDecActor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#8EA3AF] mb-1 font-medium">Primary Reason Category</label>
                <select
                  value={newDecReason}
                  onChange={(e) => setNewDecReason(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                >
                  <option value="water">Water Conservation / Quota Limit</option>
                  <option value="cost">Input Cost / Seed Price</option>
                  <option value="equipment">Machinery &amp; Equipment Availability</option>
                  <option value="market">Market Price &amp; Offtake Contract</option>
                  <option value="management_preference">Management &amp; Soil Health Goal</option>
                  <option value="other">Other Local Condition</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#8EA3AF] mb-1 font-medium">Agronomic Justification / Detail</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Record specific rationale for this management event..."
                  value={newDecReasonDetail}
                  onChange={(e) => setNewDecReasonDetail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[#27D7B2]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB898] hover:from-[#38E5C1] hover:to-[#27D7B2] text-[#020A10] font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Commit Decision Event
                </button>
                <button
                  type="button"
                  onClick={() => setIsDecisionModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl glass-pill hover:bg-white/10 text-white font-medium text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. View Decision Note Modal */}
      {selectedDecisionDiff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl glass-card border border-white/[0.2] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.1]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#27D7B2]" />
                <h3 className="text-base font-semibold text-white">Decision Audit Record</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDecisionDiff(null)}
                className="p-1 rounded-lg text-[#8EA3AF] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                <div className="text-[10px] font-mono text-[#8EA3AF] uppercase">Target Plan</div>
                <div className="text-white font-bold">{selectedDecisionDiff.newPlanName || '—'}</div>
                <div className="text-[11px] text-[#8EA3AF]">Prior Plan: {selectedDecisionDiff.priorPlanName || '—'}</div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#8EA3AF] uppercase block mb-1">
                  Agronomic Justification
                </span>
                <p className="p-3 rounded-xl bg-black/40 border border-white/10 text-white leading-relaxed">
                  {selectedDecisionDiff.reasonDetail || 'No detailed narrative provided.'}
                </p>
              </div>

              <div className="flex justify-between items-center text-[11px] text-[#8EA3AF] pt-1">
                <span>Actor: <strong className="text-white">{selectedDecisionDiff.actor}</strong></span>
                <span className="font-mono">{new Date(selectedDecisionDiff.timestamp).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedDecisionDiff(null)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB898] text-[#020A10] font-bold text-xs cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Field Confirmation Modal */}
      {fieldToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl glass-card border border-rose-500/30 shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">
              Delete Parcel {fieldToDelete.name}?
            </h3>
            <p className="text-xs text-[#8EA3AF]">
              Are you sure you want to remove this parcel boundary? This action cannot be reversed.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleDeleteField(fieldToDelete.id)}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Delete Field
              </button>
              <button
                type="button"
                onClick={() => setFieldToDelete(null)}
                className="px-3 py-2 rounded-xl glass-pill hover:bg-white/10 text-white text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
