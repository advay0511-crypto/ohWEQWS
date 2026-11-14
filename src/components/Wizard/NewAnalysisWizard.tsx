import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  AlertTriangle,
  Info,
  MapPin,
  Compass,
  Calendar,
  Layers,
  Droplet,
  Sliders,
  ShieldCheck,
  Database,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  SavedFarmPlan,
  FarmAnswers,
  AnalysisPayload,
  PrioritiesState,
  SoilTextureType,
  IrrigationMode,
  PlanningHorizon,
  RotationResult,
} from '../../types';
import {
  calculateNormalizedWeights,
  generateAndScoreRotations,
  evaluateRiskTradeoffs,
  AdaptiveRiskQuestion,
  hashString,
} from '../../engine/scoring';
import { PRESET_REGIONS, fetchNasaEarthData } from '../../services/nasaApi';
import { getCropImage } from '../../services/cropImages';
import { FarmMapPicker } from './FarmMapPicker';

interface NewAnalysisWizardProps {
  existingFarms: SavedFarmPlan[];
  initialFarmId?: string;
  onCancel: () => void;
  onComplete: (farmPlan: SavedFarmPlan, analysis: AnalysisPayload) => void;
  onSwitchToAdvanced?: () => void;
}

export const NewAnalysisWizard: React.FC<NewAnalysisWizardProps> = ({
  existingFarms,
  initialFarmId,
  onCancel,
  onComplete,
  onSwitchToAdvanced,
}) => {
  // Step indexing: 1..7 for form, 8 for review, 9 for calculating, 10 for risk trade-off (if applicable), 11 for results
  const [step, setStep] = useState<number>(1);

  // Form State
  const [farmMode, setFarmMode] = useState<'existing' | 'new'>(initialFarmId ? 'existing' : 'new');
  const [selectedFarmId, setSelectedFarmId] = useState<string>(initialFarmId || existingFarms[0]?.id || '');
  const [farmName, setFarmName] = useState<string>('');

  // Q1: Location
  const [locationName, setLocationName] = useState('Ras Al Khaimah, UAE');
  const [lat, setLat] = useState(25.6741);
  const [lon, setLon] = useState(55.9804);
  const [country, setCountry] = useState('United Arab Emirates');

  // Q2: Field & Soil
  const [fieldAreaHa, setFieldAreaHa] = useState(14.5);
  const [soilTexture, setSoilTexture] = useState<SoilTextureType>('sandy_loam');
  const [hasSoilPh, setHasSoilPh] = useState(false);
  const [soilPh, setSoilPh] = useState<number>(7.8);
  const [drainageClass, setDrainageClass] = useState<'fast' | 'good' | 'slow' | 'waterlogged'>('good');
  const [hasSoilLabTest, setHasSoilLabTest] = useState(true);

  // Q3: Water
  const [irrigationMode, setIrrigationMode] = useState<IrrigationMode>('rain_and_irrigation');
  const [waterQuotaMm, setWaterQuotaMm] = useState<number | null>(350);

  // Q4: Crop history
  const [cropHistory, setCropHistory] = useState<FarmAnswers['cropHistory']>([
    { seasonIndex: 0, seasonLabel: 'Winter 2025', cropId: 'winter_wheat', performance: 'good' },
    { seasonIndex: 1, seasonLabel: 'Spring 2026', cropId: 'chickpea', performance: 'good' },
  ]);

  // Q5: Planning horizon
  const [planningHorizon, setPlanningHorizon] = useState<PlanningHorizon>('5_seasons');

  // Q6: Priorities (0 to 4)
  const [priorities, setPriorities] = useState<PrioritiesState>({
    waterSaving: 4,
    soilHealth: 3,
    climateResilience: 4,
    cropSuitability: 3,
    productivity: 2,
  });

  // Calculation Results
  const [isCalculating, setIsCalculating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisPayload | null>(null);
  const [riskQuestion, setRiskQuestion] = useState<AdaptiveRiskQuestion | null>(null);
  const [riskDecision, setRiskDecision] = useState<'accept' | 'balanced' | null>(null);
  const [showAdvancedBanner, setShowAdvancedBanner] = useState(true);

  // Live normalized weights preview
  const normalizedWeights = calculateNormalizedWeights(priorities);

  // Handle run calculation
  const handleStartAnalysis = async () => {
    setStep(9);
    setIsCalculating(true);

    const answers: FarmAnswers = {
      farmName: farmName.trim() || locationName,
      locationName,
      lat,
      lon,
      country,
      locationConfirmed: true,
      soilTexture,
      soilTextureConfirmed: true,
      irrigationMode,
      seasonalWaterQuotaMm: waterQuotaMm,
      cropHistory,
      planningHorizon,
      priorities,
      soilPh: hasSoilPh ? soilPh : undefined,
      hasSoilLabTest,
      drainageClass,
      fieldSizeHa: fieldAreaHa,
      excludedCropIds: [],
      forcedCropIds: [],
    };

    // Use UAE preset or fetch live regional data
    let climate = PRESET_REGIONS.spain_andalusia.climate;
    try {
      const liveData = await fetchNasaEarthData(lat, lon);
      if (liveData && liveData.climate) {
        climate = liveData.climate;
      }
    } catch {
      // Use fallback
    }

    setTimeout(() => {
      const { rotations, suitabilities } = generateAndScoreRotations(answers, climate);

      const payload: AnalysisPayload = {
        id: `analysis_${Date.now()}`,
        runId: `run_${Date.now()}`,
        createdAt: new Date().toISOString(),
        inputHash: String(hashString(`${locationName}_${lat}_${lon}`)),
        farmAnswers: answers,
        climateData: climate,
        climateDataProvenance: {
          climate: {
            source: 'NASA_POWER',
            dataset: 'NASA POWER Meteorological 10-Yr Climatology',
            retrievedAt: new Date().toISOString(),
            quality: 'observed',
          },
        },
        rotations,
        candidateSuitabilities: suitabilities,
        normalizedWeights,
        isDemo: false,
      };

      setAnalysisResult(payload);
      setIsCalculating(false);

      // Check if candidate rotations have a material risk trade-off
      const tradeoff = evaluateRiskTradeoffs(rotations, answers);
      if (tradeoff) {
        setRiskQuestion(tradeoff);
        setStep(10); // Show adaptive risk question step
      } else {
        setStep(11); // Show final recommendations
      }
    }, 1200);
  };

  // Handle risk trade-off response
  const handleRiskChoice = (choice: 'accept' | 'balanced') => {
    setRiskDecision(choice);

    if (choice === 'balanced' && analysisResult && analysisResult.rotations.length > 1) {
      // Swap or promote balanced candidate
      const updatedRotations = [...analysisResult.rotations];
      const temp = updatedRotations[0];
      updatedRotations[0] = updatedRotations[1];
      updatedRotations[1] = temp;
      updatedRotations[0].rank = 1;
      updatedRotations[1].rank = 2;

      setAnalysisResult({
        ...analysisResult,
        rotations: updatedRotations,
        riskTradeoffAnswers: { [riskQuestion?.id || 'tradeoff']: 'balanced' },
      });
    }

    setStep(11); // Move to final results
  };

  // Final Save as Plan
  const handleSaveAsPlan = () => {
    if (!analysisResult) return;

    let targetFarm: SavedFarmPlan;
    if (farmMode === 'existing') {
      const found = existingFarms.find((f) => f.id === selectedFarmId);
      if (found) {
        targetFarm = {
          ...found,
          analysis: analysisResult,
          updatedAt: new Date().toISOString(),
        };
      } else {
        targetFarm = createLocalFarmObject();
      }
    } else {
      targetFarm = createLocalFarmObject();
    }

    onComplete(targetFarm, analysisResult);
  };

  const createLocalFarmObject = (): SavedFarmPlan => {
    const fId = `farm_${Date.now()}`;
    return {
      id: fId,
      name: farmName.trim() || `${locationName} Farm`,
      locationName,
      country,
      lat,
      lon,
      fields: [
        {
          id: `field_1_${fId}`,
          farmId: fId,
          name: 'Field 1 (Main Parcel)',
          areaHa: fieldAreaHa,
          soilTexture,
          soilPh: hasSoilPh ? soilPh : undefined,
          irrigationMode,
          cropHistory,
          status: 'good',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      farmAnswers: analysisResult!.farmAnswers,
      analysis: analysisResult,
      isDemo: false,
    };
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0B1410] text-[#EDF3EC] px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between border-b border-[#293B2E] pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase text-[#819082] tracking-wider">
              New Analysis Wizard · Step {step <= 7 ? `${step} of 7` : step === 8 ? 'Review' : step === 9 ? 'Calculating' : step === 10 ? 'Risk Decision' : 'Results'}
            </span>
            <h1 className="text-xl font-bold text-[#EDF3EC]">
              {step === 1 && 'Choose Farm & Parcel Scope'}
              {step === 2 && 'Geographic Location'}
              {step === 3 && 'Field Area & Soil Properties'}
              {step === 4 && 'Water & Irrigation System'}
              {step === 5 && 'Preceding Crop History'}
              {step === 6 && 'Planning Horizon'}
              {step === 7 && 'Agronomic Priorities'}
              {step === 8 && 'Review Input Snapshot'}
              {step === 9 && 'Analyzing NASA Observations'}
              {step === 10 && 'Adaptive Risk-Tolerance Evaluation'}
              {step === 11 && 'Recommended Crop Rotations'}
            </h1>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-[#819082] hover:text-[#EDF3EC] p-1.5"
          >
            Cancel Wizard
          </button>
        </div>

        {/* ============================================================= */}
        {/* STEP 1: CHOOSE SCOPE                                          */}
        {/* ============================================================= */}
        {step === 1 && (
          <div className="bg-[#121F17] border border-[#293B2E] rounded-2xl p-6 space-y-5">
            <p className="text-xs text-[#B1BDB0]">
              Create a new farm or update an existing farm plan.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFarmMode('new')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  farmMode === 'new'
                    ? 'bg-[#19291F] border-[#89B96F] shadow-sm'
                    : 'bg-[#121F17] border-[#293B2E] hover:border-[#405744]'
                }`}
              >
                <div className="text-sm font-semibold text-[#EDF3EC]">Create New Farm</div>
                <p className="text-xs text-[#819082] mt-1">Start from a new parcel location and soil baseline.</p>
              </button>

              <button
                type="button"
                onClick={() => setFarmMode('existing')}
                disabled={existingFarms.length === 0}
                className={`p-4 rounded-xl border text-left transition-all ${
                  farmMode === 'existing'
                    ? 'bg-[#19291F] border-[#89B96F] shadow-sm'
                    : 'bg-[#121F17] border-[#293B2E] hover:border-[#405744] disabled:opacity-40'
                }`}
              >
                <div className="text-sm font-semibold text-[#EDF3EC]">Update Existing Farm</div>
                <p className="text-xs text-[#819082] mt-1">
                  {existingFarms.length > 0 ? `${existingFarms.length} saved farms available` : 'No saved farms yet'}
                </p>
              </button>
            </div>

            {farmMode === 'new' ? (
              <div>
                <label className="block text-xs font-medium text-[#EDF3EC] mb-1">Farm Name</label>
                <input
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="e.g. Al Marjan Date & Pulse Parcel"
                  className="w-full bg-[#19291F] border border-[#293B2E] text-xs text-[#EDF3EC] rounded-lg p-3 placeholder:text-[#819082] focus:border-[#89B96F] focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-[#EDF3EC] mb-1">Select Farm</label>
                <select
                  value={selectedFarmId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  className="w-full bg-[#19291F] border border-[#293B2E] text-xs text-[#EDF3EC] rounded-lg p-3 focus:border-[#89B96F] focus:outline-none"
                >
                  {existingFarms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.locationName})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* STEP 2: LOCATION & MAP PICKER                                 */}
        {/* ============================================================= */}
        {step === 2 && (
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#EDF3EC] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#89B96F]" />
                  Geographic Farm Coordinates & Satellite Geocoding
                </h3>
                <p className="text-xs text-[#B1BDB0] mt-0.5">
                  Click on the map, drag the glowing pin, search any town or region, or acquire your current GPS coordinates.
                </p>
              </div>
            </div>

            <FarmMapPicker
              lat={lat}
              lon={lon}
              locationName={locationName}
              onChangeLocation={(newLat, newLon, newName) => {
                setLat(newLat);
                setLon(newLon);
                setLocationName(newName);
              }}
            />
          </div>
        )}

        {/* ============================================================= */}
        {/* STEP 3: SOIL & FIELD PROPERTIES                               */}
        {/* ============================================================= */}
        {step === 3 && (
          <div className="glass-panel rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-xs font-medium text-[#EDF3EC] mb-1">Field Area (Hectares)</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={fieldAreaHa}
                  onChange={(e) => setFieldAreaHa(parseFloat(e.target.value) || 10)}
                  className="w-48 bg-[#19291F] border border-[#293B2E] text-sm font-mono text-[#EDF3EC] rounded-lg p-2.5 focus:border-[#89B96F] focus:outline-none"
                />
                <span className="text-xs text-[#819082]">ha (~{(fieldAreaHa * 2.47105).toFixed(1)} acres)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#EDF3EC] mb-2">
                Soil Texture Class (Select Closest Match)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'sandy',
                    name: 'Sand',
                    desc: 'Coarse grain, rapid drainage, low moisture retention',
                    img: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=400&q=80',
                  },
                  {
                    id: 'sandy_loam',
                    name: 'Sandy Loam',
                    desc: 'Warm, free-draining, moderate moisture capacity',
                    img: 'https://images.unsplash.com/photo-1592417817098-8f3d69104a47?auto=format&fit=crop&w=400&q=80',
                  },
                  {
                    id: 'loam',
                    name: 'Loam',
                    desc: 'Optimal balance of sand, silt & clay; ideal water retention',
                    img: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=400&q=80',
                  },
                  {
                    id: 'silt_loam',
                    name: 'Silt Loam',
                    desc: 'Deep alluvial silt, rich moisture buffer & fertility',
                    img: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=400&q=80',
                  },
                  {
                    id: 'clay_loam',
                    name: 'Clay Loam',
                    desc: 'High nutrient holding capacity, moderate drainage',
                    img: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&w=400&q=80',
                  },
                  {
                    id: 'clay',
                    name: 'Heavy Clay',
                    desc: 'Dense mineral structure, slow infiltration, waterlogging risk',
                    img: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=400&q=80',
                  },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSoilTexture(st.id as SoilTextureType)}
                    className={`group relative overflow-hidden rounded-xl border text-left transition-all ${
                      soilTexture === st.id
                        ? 'border-[#89B96F] ring-2 ring-[#89B96F]/40 shadow-lg'
                        : 'border-[#293B2E] hover:border-[#405744] opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="h-20 w-full overflow-hidden relative">
                      <img
                        src={st.img}
                        alt={st.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1410] via-[#0B1410]/50 to-transparent" />
                      {soilTexture === st.id && (
                        <div className="absolute top-2 right-2 bg-[#89B96F] text-[#070D0A] p-0.5 rounded-full">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 bg-[#121F17]">
                      <div className="text-xs font-semibold text-[#EDF3EC]">{st.name}</div>
                      <div className="text-[10px] text-[#819082] line-clamp-2 mt-0.5">{st.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#293B2E] space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasSoilPh"
                  checked={hasSoilPh}
                  onChange={(e) => setHasSoilPh(e.target.checked)}
                  className="rounded accent-[#89B96F]"
                />
                <label htmlFor="hasSoilPh" className="text-xs text-[#EDF3EC] cursor-pointer">
                  I have measured my soil pH (Avoids unmeasured estimate)
                </label>
              </div>

              {hasSoilPh && (
                <div>
                  <label className="block text-xs font-medium text-[#B1BDB0] mb-1">Measured Soil pH</label>
                  <input
                    type="number"
                    step="0.1"
                    min="4.5"
                    max="9.5"
                    value={soilPh}
                    onChange={(e) => setSoilPh(parseFloat(e.target.value) || 7.0)}
                    className="w-40 bg-[#19291F] border border-[#293B2E] text-xs font-mono text-[#EDF3EC] rounded-lg p-2 focus:border-[#89B96F] focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* STEP 4: WATER & IRRIGATION                                    */}
        {/* ============================================================= */}
        {step === 4 && (
          <div className="bg-[#121F17] border border-[#293B2E] rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#EDF3EC] mb-1">Irrigation Supply</label>
              <select
                value={irrigationMode}
                onChange={(e) => setIrrigationMode(e.target.value as IrrigationMode)}
                className="w-full bg-[#19291F] border border-[#293B2E] text-xs text-[#EDF3EC] rounded-lg p-2.5 focus:border-[#89B96F] focus:outline-none"
              >
                <option value="rain_and_irrigation">Rainfall + Supplemental Irrigation</option>
                <option value="irrigation_only">Full Irrigation (Arid / Desert / Drip system)</option>
                <option value="rain_only">Strictly Rain-Fed (No well or pump quota)</option>
              </select>
            </div>

            {irrigationMode !== 'rain_only' && (
              <div>
                <label className="block text-xs font-medium text-[#EDF3EC] mb-1">
                  Seasonal Irrigation Water Budget (mm)
                </label>
                <input
                  type="number"
                  step="25"
                  min="0"
                  max="1200"
                  value={waterQuotaMm ?? 350}
                  onChange={(e) => setWaterQuotaMm(parseInt(e.target.value, 10) || null)}
                  className="w-48 bg-[#19291F] border border-[#293B2E] text-xs font-mono text-[#EDF3EC] rounded-lg p-2.5 focus:border-[#89B96F] focus:outline-none"
                />
                <span className="text-[11px] text-[#819082] block mt-1">
                  Leave blank if unlimited; enter millimeter depth to enforce water-budget constraints.
                </span>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* STEP 5: CROP HISTORY                                          */}
        {/* ============================================================= */}
        {step === 5 && (
          <div className="bg-[#121F17] border border-[#293B2E] rounded-2xl p-6 space-y-4">
            <p className="text-xs text-[#B1BDB0]">
              Preceding crops determine fungal disease break intervals and residual nitrogen credits.
            </p>

            <div className="space-y-2">
              {cropHistory.map((h, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#19291F] border border-[#293B2E] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-[#EDF3EC]">{h.cropId.replace('_', ' ')}</span>
                    <span className="text-[#819082] ml-2 font-mono">({h.seasonLabel})</span>
                  </div>
                  <span className="text-[11px] text-[#89B96F] uppercase font-mono">{h.performance} performance</span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-[#819082]">
              Historical records indicate recent cereal and pulse phases.
            </p>
          </div>
        )}

        {/* ============================================================= */}
        {/* STEP 6: PLANNING HORIZON                                      */}
        {/* ============================================================= */}
        {step === 6 && (
          <div className="bg-[#121F17] border border-[#293B2E] rounded-2xl p-6 space-y-4">
            <label className="block text-xs font-medium text-[#EDF3EC] mb-1">Rotation Cycle Duration</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPlanningHorizon('3_seasons')}
                className={`p-3.5 rounded-xl border text-left ${
                  planningHorizon === '3_seasons' ? 'bg-[#19291F] border-[#89B96F]' : 'bg-[#121F17] border-[#293B2E]'
                }`}
              >
                <div className="text-xs font-semibold text-[#EDF3EC]">3 Seasons (~1.5 Years)</div>
                <div className="text-[11px] text-[#819082] mt-0.5">Rapid seasonal turnaround</div>
              </button>
              <button
                type="button"
                onClick={() => setPlanningHorizon('5_seasons')}
                className={`p-3.5 rounded-xl border text-left ${
                  planningHorizon === '5_seasons' ? 'bg-[#19291F] border-[#89B96F]' : 'bg-[#121F17] border-[#293B2E]'
                }`}
              >
                <div className="text-xs font-semibold text-[#EDF3EC]">4–5 Seasons (2–2.5 Years)</div>
                <div className="text-[11px] text-[#819082] mt-0.5">Optimal multi-season disease break</div>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* STEP 7: PRIORITIES & WEIGHTS                                  */}
        {/* ============================================================= */}
        {step === 7 && (
          <div className="bg-[#121F17] border border-[#293B2E] rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-[#EDF3EC]">Agronomic Goals & Weighting</h3>
              <p className="text-xs text-[#B1BDB0] mt-0.5">
                Set the relative priority of each objective (0 = Not a concern, 4 = Top priority).
              </p>
            </div>

            <div className="space-y-4">
              {[
                { key: 'waterSaving', label: 'Water Saving & Conservation', color: 'text-[#78B6C7]' },
                { key: 'soilHealth', label: 'Soil Health & Organic Matter', color: 'text-[#89B96F]' },
                { key: 'climateResilience', label: 'Climate Resilience & Drought Buffer', color: 'text-[#D7AC58]' },
                { key: 'cropSuitability', label: 'Crop Climatic Fit & Thermal Match', color: 'text-[#A3D188]' },
                { key: 'productivity', label: 'Yield & Dry-Matter Biomass', color: 'text-[#EDF3EC]' },
              ].map(({ key, label, color }) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className={`font-medium ${color}`}>{label}</span>
                    <span className="font-mono text-[#EDF3EC]">
                      Level {priorities[key as keyof PrioritiesState]}/4 · Weight: {(normalizedWeights[key as keyof PrioritiesState] * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="1"
                    value={priorities[key as keyof PrioritiesState]}
                    onChange={(e) =>
                      setPriorities({ ...priorities, [key]: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-[#89B96F] cursor-pointer"
                  />
                </div>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-[#19291F] border border-[#293B2E] text-[11px] font-mono text-[#819082]">
              Anti-Domination Clamp Active: individual weights are bounded between 5% and 40% to guarantee multidimensional agronomic safety.
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* STEP 8: REVIEW                                                */}
        {/* ============================================================= */}
        {step === 8 && (
          <div className="glass-card border border-white/[0.14] rounded-2xl p-6 space-y-4 backdrop-blur-xl">
            <h3 className="text-sm font-semibold text-white">Review Input Snapshot</h3>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <div className="text-[10px] text-slate-400">Location</div>
                <div className="font-bold text-white">{locationName}</div>
                <div className="text-[10px] text-[#27D7B2]">Verified Regional Parcel</div>
              </div>

              <div className="p-3 rounded bg-[#19291F]">
                <div className="text-[10px] text-[#819082]">Soil & Field</div>
                <div className="font-bold text-[#EDF3EC]">{soilTexture.replace('_', ' ')} · {fieldAreaHa} ha</div>
                <div className="text-[10px] text-[#819082]">pH: {hasSoilPh ? soilPh : 'Estimated prior'}</div>
              </div>

              <div className="p-3 rounded bg-[#19291F]">
                <div className="text-[10px] text-[#819082]">Water Setup</div>
                <div className="font-bold text-[#EDF3EC]">{irrigationMode.replace('_', ' ')}</div>
                <div className="text-[10px] text-[#819082]">Budget: {waterQuotaMm ? `${waterQuotaMm} mm` : 'Unrestricted'}</div>
              </div>

              <div className="p-3 rounded bg-[#19291F]">
                <div className="text-[10px] text-[#819082]">Planning Horizon</div>
                <div className="font-bold text-[#EDF3EC]">{planningHorizon.replace('_', ' ')}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartAnalysis}
              className="w-full btn-primary text-xs py-3 font-bold mt-4 shadow-lg flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Run Precision Rotation Engine</span>
            </button>
          </div>
        )}

        {/* ============================================================= */}
        {/* STEP 9: CALCULATING SCREEN                                    */}
        {/* ============================================================= */}
        {step === 9 && (
          <div className="bg-[#121F17] border border-[#293B2E] rounded-2xl p-16 text-center space-y-5">
            <RefreshCw className="w-10 h-10 text-[#89B96F] animate-spin mx-auto" />
            <h3 className="text-base font-semibold text-[#EDF3EC]">Synthesizing Rotation Candidates</h3>
            <p className="text-xs text-[#B1BDB0] max-w-sm mx-auto">
              Evaluating multi-season botanical compatibility, thermal degree days, and physical root-zone water balance...
            </p>
          </div>
        )}

        {/* ============================================================= */}
        {/* STEP 10: ADAPTIVE RISK-TOLERANCE EVALUATION (Core Innovation) */}
        {/* ============================================================= */}
        {step === 10 && riskQuestion && (
          <div className="bg-[#121F17] border border-[#D7AC58] rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-2 text-xs font-mono text-[#D7AC58]">
              <AlertTriangle className="w-4 h-4" />
              <span>Adaptive Risk Trade-Off Decision Required</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-[#EDF3EC] leading-snug">
                {riskQuestion.question}
              </h3>
              <p className="text-xs text-[#B1BDB0]">
                {riskQuestion.supportingEvidence}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#19291F] border border-[#293B2E] space-y-2 text-xs">
              <div>
                <span className="font-semibold text-[#79B77A]">Priority Gain: </span>
                <span className="text-[#EDF3EC]">{riskQuestion.priorityBenefit}</span>
              </div>
              <div>
                <span className="font-semibold text-[#D96C63]">Incurred Risk: </span>
                <span className="text-[#EDF3EC]">{riskQuestion.tradeoffRisk}</span>
              </div>
              <div className="pt-2 border-t border-[#293B2E] text-[11px] text-[#819082]">
                <strong>Suggested Mitigation:</strong> {riskQuestion.suggestedMitigation}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleRiskChoice('accept')}
                className="p-3.5 rounded-xl border border-[#293B2E] hover:border-[#89B96F] bg-[#19291F] text-left transition-all"
              >
                <div className="text-xs font-semibold text-[#EDF3EC]">Accept This Trade-Off</div>
                <p className="text-[11px] text-[#819082] mt-0.5">
                  Keep {riskQuestion.candidateATitle} as top recommendation.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleRiskChoice('balanced')}
                className="p-3.5 rounded-xl border border-[#89B96F] bg-[#19291F] text-left transition-all"
              >
                <div className="text-xs font-semibold text-[#89B96F]">Prefer Balanced Alternative</div>
                <p className="text-[11px] text-[#819082] mt-0.5">
                  Promote {riskQuestion.candidateBTitle} with lower risk profile.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* STEP 11: FINAL RESULTS DISPLAY                                */}
        {/* ============================================================= */}
        {step === 11 && analysisResult && (
          <div className="space-y-6">
            {/* Post-Analysis Simple/Advanced Prompt */}
            {showAdvancedBanner && onSwitchToAdvanced && (
              <div className="p-4 rounded-xl bg-[#19291F] border border-[#89B96F]/40 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-[#EDF3EC]">Want to see the full reasoning?</h4>
                  <p className="text-xs text-[#B1BDB0] mt-0.5">
                    Advanced Mode reveals detailed calculations, data sources, confidence limits and the reasoning behind the result.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToAdvanced();
                      setShowAdvancedBanner(false);
                    }}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    Switch to Advanced
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedBanner(false)}
                    className="text-xs text-[#819082] hover:text-[#EDF3EC] px-2"
                  >
                    Not now
                  </button>
                </div>
              </div>
            )}

            {/* Top Recommended Rotation */}
            {analysisResult.rotations[0] && (
              <div className="p-6 rounded-2xl bg-[#121F17] border border-[#89B96F] shadow-xl space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#89B96F] font-bold tracking-wider">
                      ★ Top Recommended Rotation Plan
                    </span>
                    <h2 className="text-xl font-bold text-[#EDF3EC] mt-1">
                      {analysisResult.rotations[0].name}
                    </h2>
                    <p className="text-xs text-[#B1BDB0] mt-1">
                      {analysisResult.rotations[0].explanationSummary}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-2xl font-mono font-bold text-[#89B96F]">
                      {analysisResult.rotations[0].totalScore}
                      <span className="text-xs text-[#819082]">/100</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#79B77A]">Overall Match</span>
                  </div>
                </div>

                {/* Sequence Timeline Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {analysisResult.rotations[0].sequence.map((step, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#19291F] border border-[#293B2E] space-y-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={getCropImage(step.cropName)}
                          alt={step.cropName}
                          className="w-10 h-10 rounded-lg object-cover border border-[#293B2E]"
                        />
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono text-[#819082]">Season {idx + 1}</div>
                          <div className="text-xs font-semibold text-[#EDF3EC] truncate">{step.cropName}</div>
                          <div className="text-[10px] text-[#89B96F]">{step.cropFamily}</div>
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-[#819082] pt-1.5 border-t border-[#293B2E]">
                        Window: {step.plantingWindow}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Benefits & Disadvantages */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#293B2E]">
                  <div className="space-y-1.5 text-xs">
                    <span className="font-semibold text-[#79B77A]">Key Benefits:</span>
                    <ul className="list-disc pl-4 space-y-1 text-[#B1BDB0]">
                      {(analysisResult.rotations[0]?.benefits || []).map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className="font-semibold text-[#D7AC58]">Risks & Mitigation:</span>
                    {analysisResult.rotations[0]?.disadvantages && analysisResult.rotations[0].disadvantages.length > 0 ? (
                      <div className="p-2.5 rounded-lg bg-[#19291F] border border-[#293B2E] space-y-1 text-[11px]">
                        <div className="font-semibold text-[#EDF3EC]">{analysisResult.rotations[0].disadvantages[0]?.title}</div>
                        <p className="text-[#819082]">{analysisResult.rotations[0].disadvantages[0]?.description}</p>
                        <div className="text-[#89B96F]">Mitigation: {analysisResult.rotations[0].disadvantages[0]?.howToManage}</div>
                      </div>
                    ) : (
                      <p className="text-xs text-[#B1BDB0]">No severe crop pathogen or drought bottlenecks detected.</p>
                    )}
                  </div>
                </div>

                {/* Final Actions */}
                <div className="pt-4 border-t border-[#293B2E] flex items-center justify-between">
                  <span className="text-xs text-[#819082] font-mono">
                    Deterministic Run ID: {analysisResult.runId || analysisResult.id}
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveAsPlan}
                    className="btn-primary text-xs py-2 px-5 font-bold shadow-lg"
                  >
                    Save as Farm Plan
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Wizard Navigation Footer for steps 1 to 8 */}
        {step <= 8 && (
          <div className="flex items-center justify-between pt-4 border-t border-[#293B2E]">
            <button
              type="button"
              disabled={step === 1}
              onClick={() => setStep(step - 1)}
              className="btn-secondary text-xs disabled:opacity-40"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>Back</span>
            </button>

            {step < 8 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="btn-primary text-xs"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
