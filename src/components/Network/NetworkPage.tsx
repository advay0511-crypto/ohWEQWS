import React, { useState } from 'react';
import {
  Globe,
  Lock,
  Users,
  MessageSquare,
  ShieldAlert,
  Search,
  MapPin,
  ExternalLink,
  ChevronRight,
  Info,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { SavedFarmPlan } from '../../types';

interface NetworkPageProps {
  farms: SavedFarmPlan[];
  onOpenFarmView: (farmId: string) => void;
}

export const NetworkPage: React.FC<NetworkPageProps> = ({
  farms,
  onOpenFarmView,
}) => {
  const [showDemoPreview, setShowDemoPreview] = useState(false);
  const [selectedDemoCity, setSelectedDemoCity] = useState<string | null>(null);

  // Illustrative Demo Cities (clearly tagged as DEMO)
  const demoCities = [
    {
      city: 'Ras Al Khaimah',
      country: 'United Arab Emirates',
      publishedFarmsCount: 6,
      conditionScore: 78,
      statusLabel: 'Good Condition',
      color: '#79B77A',
      dominantCrops: 'Date Palm, Winter Wheat, Alfalfa, Chickpea',
    },
    {
      city: 'Seville',
      country: 'Spain',
      publishedFarmsCount: 14,
      conditionScore: 62,
      statusLabel: 'Mixed / Moisture Watch',
      color: '#D7AC58',
      dominantCrops: 'Winter Wheat, Sunflower, Olive, Chickpea',
    },
    {
      city: 'Ludhiana',
      country: 'India',
      publishedFarmsCount: 22,
      conditionScore: 54,
      statusLabel: 'Water Stress Watch',
      color: '#D7AC58',
      dominantCrops: 'Wheat, Mustard, Lentil, Maize',
    },
    {
      city: 'Fresno',
      country: 'United States',
      publishedFarmsCount: 18,
      conditionScore: 48,
      statusLabel: 'Groundwater Restriction',
      color: '#D96C63',
      dominantCrops: 'Almond, Alfalfa, Processing Tomato',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0B1410] text-[#EDF3EC] px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-[#293B2E] pb-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[#819082]">
            <span>Field Shift</span>
            <span>/</span>
            <span className="text-[#89B96F]">Global Farming Network</span>
          </div>
          <h1 className="text-xl font-bold text-[#EDF3EC] flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-[#89B96F]" />
            Global Farming Network & Regional Intelligence
          </h1>
          <p className="text-xs text-[#B1BDB0]">
            Privacy-safe city-level agricultural benchmarks and peer farmer discovery.
          </p>
        </div>

        {/* Honest Local-Only Status Banner */}
        <div className="p-5 rounded-2xl bg-[#121F17] border border-[#D7AC58]/40 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-mono text-[#D7AC58] font-semibold">
            <Lock className="w-4 h-4" />
            <span>Shared Cloud Backend Required — Not Available in this Local-First Build</span>
          </div>
          <p className="text-xs text-[#EDF3EC] leading-relaxed">
            Field Shift runs in a strictly private, local-first environment on this device. All farm boundaries, crop records, and soil measurements remain entirely local to your browser.
          </p>
          <p className="text-xs text-[#819082]">
            Public cross-user publishing, live global chat, and multi-tenant aggregation require an authenticated shared server and database. To protect your data integrity, no synthetic user accounts or simulated live messages are displayed.
          </p>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowDemoPreview(!showDemoPreview)}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#89B96F]" />
              <span>{showDemoPreview ? 'Hide Architecture Preview' : 'Preview Network Architecture & City Scoring'}</span>
            </button>
          </div>
        </div>

        {/* Future Architecture Preview (Optional Toggle) */}
        {showDemoPreview && (
          <div className="space-y-6 p-6 rounded-2xl bg-[#121F17] border border-[#293B2E] shadow-xl">
            <div className="flex items-center justify-between border-b border-[#293B2E] pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#D7AC58] uppercase font-bold tracking-wider">
                  Illustrative Architecture Demonstration
                </span>
                <h3 className="text-base font-semibold text-[#EDF3EC]">City-Level Condition Index & Discovery</h3>
              </div>
              <span className="text-xs text-[#819082] font-mono">Simulated Regional Benchmark</span>
            </div>

            {/* Privacy Rule Card */}
            <div className="p-4 rounded-xl bg-[#19291F] border border-[#293B2E] text-xs space-y-1.5">
              <span className="font-semibold text-[#79B77A] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Mandatory Location Privacy Policy:
              </span>
              <p className="text-[#B1BDB0]">
                Participating farms appear <strong>strictly at the municipal city level</strong>. Exact GPS coordinates, perimeter polygons, and plot addresses are never serialized in public projections or transmitted to other users.
              </p>
            </div>

            {/* Simulated Regional City Matrix */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-[#EDF3EC] uppercase tracking-wider">
                Eligible Published Farm Condition Index by City
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {demoCities.map((c) => (
                  <div
                    key={c.city}
                    onClick={() => setSelectedDemoCity(c.city)}
                    className="p-4 rounded-xl bg-[#19291F] border border-[#293B2E] hover:border-[#89B96F] transition-all cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: c.color }}
                          />
                          <h5 className="text-sm font-semibold text-[#EDF3EC]">{c.city}</h5>
                        </div>
                        <p className="text-xs text-[#819082] mt-0.5">{c.country}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-mono font-bold text-[#EDF3EC]">{c.conditionScore}/100</div>
                        <span className="text-[10px] font-mono" style={{ color: c.color }}>
                          {c.statusLabel}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-[#B1BDB0] pt-2 border-t border-[#293B2E]/60 flex justify-between">
                      <span>{c.publishedFarmsCount} participating farms</span>
                      <span className="text-[#89B96F] text-[11px] flex items-center gap-0.5">
                        <span>Inspect Region</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
