import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Compass,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Sliders,
  ShieldCheck,
  Database,
  ArrowRight,
  BookOpen,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Droplet,
  Flame,
  Info,
} from 'lucide-react';
import { AppViewMode } from '../../types';

export interface PageGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage?: string; // 'home' | 'map' | 'farms' | 'analysis' | 'rotations' | 'simulator' | 'calendar' | 'data' | 'settings' | 'wizard'
  isAdvanced?: boolean;
  onNavigate?: (tab: string) => void;
  onOpenAiBot?: () => void;
}

export const PageGuideModal: React.FC<PageGuideModalProps> = ({
  isOpen,
  onClose,
  currentPage = 'home',
  isAdvanced = false,
  onNavigate,
  onOpenAiBot,
}) => {
  const [activeTab, setActiveTab] = useState<'purpose' | 'elements' | 'next_steps' | 'glossary' | 'methodology'>('purpose');
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap & escape key handler
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => closeButtonRef.current?.focus(), 50);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Contextual help data dynamically keyed by route and view mode
  const getRouteHelp = (route: string) => {
    if (isAdvanced) {
      switch (route) {
        case 'map':
          return {
            title: 'Maps & Geospatial Workspace',
            badge: 'Geodetic WGS-84 Ellipsoid',
            purpose: 'Geodetic polygon vector workspace executing Karney spherical geodesic integration to calculate exact ellipsoidal parcel surfaces without conformal projection distortion.',
            elements: [
              {
                term: 'Karney Spherical Geodesic Area',
                desc: 'Calculates true surface area across the WGS-84 reference ellipsoid in hectares and acres, preventing Mercator high-latitude area exaggeration.',
              },
              {
                term: 'Topological Exclusion Multi-Polygons',
                desc: 'Subtracts non-arable surface geometries (ravines, bedrock, farm structures) directly from hydraulic catchment and seed rate budgets.',
              },
              {
                term: 'Orbital Multimodal Overlay Stack',
                desc: 'Composite raster layers switching between high-resolution optical orthomosaics and coarse 0.5° NASA POWER climatology grids.',
              },
            ],
            steps: [
              'Click polygon tool to place GPS vertex nodes along parcel perimeters.',
              'Verify geodesic hectares and closed-ring orientation before committing boundaries.',
              'Assign specific soil texture classifications and irrigation modes per management unit.',
            ],
          };
        case 'analysis':
          return {
            title: 'Farm Intelligence & Deep Analysis',
            badge: 'Advanced Biophysical Diagnostics',
            purpose: 'Complete mathematical audit trace evaluating FAO-56 dual crop coefficient hydrology, 10-year NASA monthly climatology, and Theil-Sen decadal trend slopes.',
            elements: [
              {
                term: 'Confidence vs Data Coverage Orthogonality',
                desc: 'Cleanly separated: Recommendation Confidence measures ranking stability across Monte Carlo perturbations, while Data Coverage measures input completeness.',
              },
              {
                term: 'FAO-56 Dual Kc Root-Zone Mass Balance',
                desc: 'Explicit daily ledger separating basal transpiration (Kcb) from surface soil evaporation (Ke), tracking depletion Dr relative to readily available water (RAW).',
              },
              {
                term: 'Idempotent Execution Traces & Intermediate Math',
                desc: 'Full visibility into step-by-step calculation formulas, execution durations, quality flags, and sensor mission identifiers.',
              },
            ],
            steps: [
              'Inspect intermediate steps in the Execution Trace tab to audit exact equation values.',
              'Review Theil-Sen warming trends (Mann-Kendall p-values) to assess decadal thermal risk.',
              'Export PDF or full JSON audit telemetry for institutional and peer review.',
            ],
          };
        case 'rotations':
          return {
            title: 'Multi-Season Rotation Planner',
            badge: 'Constrained Sequence Optimization',
            purpose: 'Algorithmic multi-season sequence optimizer balancing water conservation, soil organic matter accumulation, Shannon botanical diversity, and nitrogen credits.',
            elements: [
              {
                term: 'Anti-Domination Clamped Priority Weights',
                desc: 'Farmer priority weights are mathematically clamped between 5% and 40% (softmax-normalized) to guarantee biophysical safety bounds.',
              },
              {
                term: 'Shannon Equitability Botanical Diversity Index',
                desc: 'Calculates H = -sum(p_i * ln(p_i)) over botanical families to enforce disease break effectiveness against soilborne fungal spores.',
              },
              {
                term: 'Biological Symbiotic N-Fixation Carryover',
                desc: 'Quantifies root-nodule atmospheric N2 fixed by pulse legumes available as biological fertilizer credits for following cereal grains.',
              },
            ],
            steps: [
              'Compare top 3 ranked rotation blueprints side-by-side.',
              'Click any crop in the timeline to view phenological window, water demand, and botanical family.',
              'Activate the preferred sequence to bind it to the live field operations calendar.',
            ],
          };
        default:
          break;
      }
    }

    // Standard farmer guidance
    switch (route) {
      case 'map':
        return {
          title: 'Maps & Geospatial Workspace',
          badge: 'Spatial Geometry',
          purpose: 'Draw exact field parcel boundaries on satellite imagery, compute spherical geodesic area, and segment multiple management zones.',
          elements: [
            {
              term: 'Geodesic Area Calculation',
              desc: 'Calculates real spherical polygon area on the WGS-84 ellipsoid in hectares and acres, preventing flat-projection area distortion.',
            },
            {
              term: 'Exclusion Zones',
              desc: 'Enables excluding rocky outcrops, ponds, or structures so that planting seed rates and water budgets are not artificially inflated.',
            },
            {
              term: 'Layer Switcher',
              desc: 'Toggle between high-resolution ESRI World Imagery, OpenStreetMap base, and NASA orbital overlays.',
            },
          ],
          steps: [
            'Click the polygon tool on the map to place vertex points around your parcel perimeter.',
            'Double-click or click the first vertex to complete and save your farm boundary.',
            'Switch to Farm Detail view to configure soil texture and historical crops.',
          ],
        };
      case 'farms':
        return {
          title: 'My Farms Portfolio & Field Detail',
          badge: 'Asset Ledger',
          purpose: 'Manage your portfolio of farm parcels, configure field-specific soil profiles, review management decision events, and record scouting observations.',
          elements: [
            {
              term: 'Daily Farm Tracker',
              desc: 'Summarizes topsoil moisture, root-zone depletion, and current vegetative stage against local 10-year NASA baselines.',
            },
            {
              term: 'Field Segmentation',
              desc: 'Divide large holdings into independent management parcels with distinct soil textures, irrigation modes, and crop assignments.',
            },
            {
              term: 'Scouting Journal & Decision Events',
              desc: 'Auditable log recording why plans were selected, modified, or delayed, creating an immutable farm history.',
            },
          ],
          steps: [
            'Select any farm from the portfolio list to open its comprehensive Detail Workspace.',
            'Use the "New Analysis" button to regenerate rotation recommendations when soil test results arrive.',
            'Log irrigation or scouting notes via the Journal tab.',
          ],
        };
      case 'analysis':
        return {
          title: 'Farm Intelligence & Deep Analysis',
          badge: 'Scientific Diagnostics',
          purpose: 'Audit mathematical models including 10-year NASA climatology, FAO-56 Penman-Monteith dual evapotranspiration, and multi-season crop suitability scores.',
          elements: [
            {
              term: 'Recommendation Confidence vs Data Coverage',
              desc: 'Cleanly separated: Recommendation Confidence measures ranking stability across simulations, while Data Coverage measures completeness of farmer inputs.',
            },
            {
              term: 'Moisture Balance & Depletion Curve',
              desc: 'Compares seasonal water demand (ETc) against effective precipitation and available water capacity (AWC) in the active root zone.',
            },
            {
              term: 'Execution Trace & Work Steps',
              desc: 'Inspect step-by-step intermediate calculation stages, formula names, and duration timestamps.',
            },
          ],
          steps: [
            'Toggle between Simple Mode and Advanced Mode to reveal deeper scientific formulas and raw telemetry.',
            'Scroll to the What-If Climate Simulator at the base of the page to stress-test your plan.',
            'Export PDF or JSON analysis reports for agronomic lenders or crop consultants.',
          ],
        };
      case 'rotations':
        return {
          title: 'Multi-Season Rotation Planner',
          badge: 'Sequence Optimization',
          purpose: 'Explore ranked multi-season crop sequences that balance water conservation, soil organic matter accumulation, pathogen break cycles, and farmer priorities.',
          elements: [
            {
              term: 'Anti-Domination Clamped Weights',
              desc: 'Strategic priority weights are mathematically clamped between 5% and 40% to prevent any single priority from compromising soil safety.',
            },
            {
              term: 'Botanical Family Rotation',
              desc: 'Sequences alternate diverse families (e.g. Poaceae cereals → Fabaceae legumes → Asteraceae oilseeds) to disrupt host-specific soil pests.',
            },
            {
              term: 'Biological Nitrogen Credits',
              desc: 'Estimates atmospheric nitrogen fixed by legume pulse phases available as fertilizer carryover for subsequent grain crops.',
            },
          ],
          steps: [
            'Compare the top 3 ranked rotation blueprints side-by-side.',
            'Click on any crop in the timeline to view planting window, water demand, and botanical characteristics.',
            'Click "Activate Plan" to assign this sequence to your active farm calendar.',
          ],
        };
      case 'simulator':
        return {
          title: 'What-If Climate Scenario Sandbox',
          badge: 'Stress Testing',
          purpose: 'Isolate and test how recommended rotations perform under severe droughts, heatwaves, or restricted water quotas without altering your real farm plan.',
          elements: [
            {
              term: 'Isolated Sandbox Boundary',
              desc: 'Simulations run in a sandboxed computational space; your baseline farm records are never mutated.',
            },
            {
              term: 'Rerank Sensitivity',
              desc: 'Reveals which resilient candidate crops rise to the #1 ranking when temperatures rise +3°C or rainfall drops 30%.',
            },
            {
              term: 'Feasibility Floors',
              desc: 'Flags when severe moisture stress drops candidate survival below the scientific safety threshold.',
            },
          ],
          steps: [
            'Adjust sliders for temperature anomaly, precipitation change, or irrigation quota restriction.',
            'Inspect the score delta and rank movement in the comparison table.',
            'Save interesting scenario branches for review.',
          ],
        };
      case 'calendar':
        return {
          title: 'Crop Planting Calendar & Field Operations',
          badge: 'Temporal Scheduling',
          purpose: 'Timeline view distinguishing Recommended proposals, Planned calendar windows, and Active in-ground crops with confirmed start dates.',
          elements: [
            {
              term: 'Four-State Crop Lifecycle',
              desc: 'Recommended (algorithm output) → Planned (scheduled on calendar) → Active (in field) → Completed (harvested).',
            },
            {
              term: 'Baskerville-Emin GDD Windows',
              desc: 'Planting and harvest windows are estimated from historical thermal degree-day accumulations rather than arbitrary calendar dates.',
            },
          ],
          steps: [
            'Click any event to log actual planting, irrigation application, or harvest dates.',
            'Filter by farm parcel or crop family.',
          ],
        };
      case 'data':
        return {
          title: 'Data & Trust Center',
          badge: 'Provenance & Integrity',
          purpose: 'Inspect remote satellite sensors, exact data ingestion pipelines, mathematical formulas, and scientific citations with zero obfuscation.',
          elements: [
            {
              term: 'Satellite Sensor Breakdown',
              desc: 'Direct disclosure of spatial resolution and revisit cadences for NASA POWER (50km), SMAP (9km), and Sentinel-2 (10m).',
            },
            {
              term: 'Algorithm Formulas',
              desc: 'Inspect exact formulas: Penman-Monteith FAO-56, Baier-Robertson soil moisture, and Shannon diversity index.',
            },
          ],
          steps: [
            'Review dataset freshness indicators.',
            'Verify quality flags and sensor orbital passes.',
          ],
        };
      case 'settings':
        return {
          title: 'Settings, Preferences & Data Sovereignty',
          badge: 'Governance & Privacy',
          purpose: 'Configure interface presentation mode, unit conversions, local automation scheduling, remote API connections, and offline data backups.',
          elements: [
            {
              term: 'Local-First Sovereignty',
              desc: 'All field polygons, scouting notes, and decision logs are stored locally in your browser storage. Zero data leaves your device without consent.',
            },
            {
              term: 'Display-Layer Unit Conversion',
              desc: 'Measurements convert between Metric and Imperial at render time while remaining canonical metric internally to prevent rounding divergence.',
            },
            {
              term: 'Safe Dangerous Operations',
              desc: 'Destructive wipes and export actions clearly state their exact scope, affected records, and recovery feasibility.',
            },
          ],
          steps: [
            'Toggle between Simple Farmer Mode and Advanced Agronomist Mode.',
            'Export a JSON backup of your farm portfolio before performing major device changes.',
          ],
        };
      default: // 'home'
        return {
          title: 'Field Shift Home & Daily Farm Tracker',
          badge: 'Operations Overview',
          purpose: 'Glanceable daily operational dashboard monitoring environmental risks, soil moisture, and active crop stages for your active parcel.',
          elements: [
            {
              term: 'Daily Status Indicator',
              desc: 'Summarizes overall parcel health (Healthy & Stable, Moisture Watch, or Nutrient Depleted) based on live and satellite data.',
            },
            {
              term: 'Water Buffer Countdown',
              desc: 'Estimates days of soil water remaining without rainfall before crops enter thermal stress.',
            },
            {
              term: 'Actionable Alerts Drawer',
              desc: 'Access in-app notices for sudden soil moisture deficits, high heat spikes, or rainfall drops.',
            },
          ],
          steps: [
            'Click "Switch Farm" at the top to change active parcels.',
            'Check current weather conditions and 7-day outlook.',
            'Click any alert to see actionable recommendations.',
          ],
        };
    }
  };

  const contextInfo = getRouteHelp(currentPage);

  // Common Technical Glossary Terms
  const glossaryTerms = [
    {
      term: 'ET0 (Reference Evapotranspiration)',
      desc: 'The rate of water loss from an extensive surface of green grass cover of uniform height (12 cm), actively growing, completely shading the ground and not short of water. Calculated via FAO-56 Penman-Monteith.',
    },
    {
      term: 'Kc (Crop Coefficient)',
      desc: 'Dimensionless ratio representing crop-specific water demand relative to ET0 across vegetative growth stages (Kc_ini, Kc_mid, Kc_end).',
    },
    {
      term: 'GDD (Growing Degree Days)',
      desc: 'Thermal heat units accumulated daily above a base temperature (T_base) that drive physiological crop development. Calculated via Baskerville-Emin sine wave method.',
    },
    {
      term: 'AWC (Available Water Capacity)',
      desc: 'The range of available water that can be stored in the root zone between Field Capacity (-33 kPa) and Permanent Wilting Point (-1500 kPa).',
    },
    {
      term: 'NDVI (Normalized Difference Vegetation Index)',
      desc: 'Spectral index (NIR - Red) / (NIR + Red) measuring chlorophyll absorption and canopy density from orbital multispectral sensors.',
    },
    {
      term: 'Biological N-Credit',
      desc: 'Nitrogen gas (N2) fixed into root nodules by symbiotic Rhizobium bacteria in pulse legumes, reducing synthetic nitrogen requirement for following crops.',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-2xl rounded-2xl glass-modal border border-white/20 shadow-2xl overflow-hidden flex flex-col text-[#F1F6EF] max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="guide-title"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-white/[0.03] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#27D7B2]/15 border border-[#27D7B2]/30 flex items-center justify-center text-[#27D7B2] shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="guide-title" className="text-base font-bold text-white tracking-tight">
                  {contextInfo.title}
                </h3>
                <span className="text-[10px] font-mono bg-[#27D7B2]/15 text-[#27D7B2] px-2 py-0.5 rounded border border-[#27D7B2]/30">
                  {contextInfo.badge}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  isAdvanced
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-semibold'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {isAdvanced ? 'Advanced Agronomist Mode' : 'Farmer Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAdvanced
                  ? 'Biophysical formulas, sensor telemetry & mathematical foundations'
                  : 'Curated contextual guide & practical farm operational reference'}
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close page guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 py-2 border-b border-white/10 bg-black/40 flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0 text-xs">
          {[
            { id: 'purpose', label: 'Page Purpose' },
            { id: 'elements', label: 'Key Metrics & Elements' },
            { id: 'next_steps', label: 'Recommended Steps' },
            { id: 'glossary', label: 'Technical Glossary' },
            { id: 'methodology', label: 'Data Limitations' },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#27D7B2] text-[#07130C] font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed">
          {/* TAB 1: PURPOSE */}
          {activeTab === 'purpose' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="text-xs uppercase tracking-wider font-bold text-[#27D7B2]">
                  Core Objective
                </div>
                <p className="text-white text-sm font-medium leading-relaxed">
                  {contextInfo.purpose}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2.5 text-xs text-slate-300">
                <div className="font-semibold text-white">How Field Shift Computes This:</div>
                <p>
                  Calculations use deterministic agronomic and physical mass-balance formulas (FAO-56, Baskerville-Emin GDD, Baier-Robertson hydrology). Raw data originates from 10+ years of continuous NASA Earth observation feeds, calibrated to your exact coordinates.
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-[#78C78B]">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Verified Deterministic Modeling • Zero Generative Hallucinations</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KEY ELEMENTS */}
          {activeTab === 'elements' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {contextInfo.elements.map((el, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1 hover:border-[#27D7B2]/40 transition-colors"
                >
                  <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <span className="text-[#27D7B2]">●</span>
                    <span>{el.term}</span>
                  </div>
                  <p className="text-xs text-slate-300 pl-3 leading-relaxed">
                    {el.desc}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: RECOMMENDED NEXT STEPS */}
          {activeTab === 'next_steps' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="text-xs uppercase font-bold text-slate-400">
                Suggested Actions on This Screen:
              </div>
              {contextInfo.steps.map((st, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-[#27D7B2]/20 text-[#27D7B2] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {st}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: GLOSSARY */}
          {activeTab === 'glossary' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="text-xs uppercase font-bold text-slate-400">
                Precision Agronomy Glossary:
              </div>
              {glossaryTerms.map((g, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1"
                >
                  <div className="text-xs font-bold font-mono text-[#27D7B2]">
                    {g.term}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {g.desc}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: METHODOLOGY & LIMITATIONS */}
          {activeTab === 'methodology' && (
            <div className="space-y-3 animate-in fade-in duration-150 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Spatial Resolution &amp; Limitations Notice</span>
                </div>
                <p>
                  Satellite observations are sampled at orbital resolutions (e.g. NASA POWER at 0.5° × 0.5° ~50km, SMAP radiometer at 9km). Microclimates inside ravines or sheltered valleys may deviate from coarse orbital baselines.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="font-semibold text-white">Local-First Privacy</div>
                <p>
                  All parcel geometries, scouting notes, and decision events remain local in this browser session. When requesting NASA data or Gemini AI explanations, only coordinates and agronomic parameters are transmitted; never personal identities or financial data.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-2">
            {onOpenAiBot && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAiBot();
                }}
                className="text-[#27D7B2] hover:underline flex items-center gap-1.5 cursor-pointer font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI Agronomist about this page</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#27D7B2] text-[#07130C] font-bold text-xs hover:bg-[#52E2C3] transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
