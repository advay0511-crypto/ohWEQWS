import React from 'react';
import { Calendar, Layers, Clock, Info } from 'lucide-react';
import { LayerId, LayerMetadata } from './types';
import { MAP_LAYERS_CATALOG, HISTORICAL_OBSERVATION_DATES } from './mapDataCatalog';

interface MapLegendProps {
  activeLayers: Set<LayerId>;
  observationDate: string;
  onSelectObservationDate: (date: string) => void;
  isDrawing: boolean;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  activeLayers,
  observationDate,
  onSelectObservationDate,
  isDrawing,
}) => {
  // If in drawing mode, keep map clear of clutter
  if (isDrawing) return null;

  // Find the primary active raster layer to show in legend
  const primaryLayerId: LayerId | undefined = [
    'ndvi',
    'evi',
    'moisture',
    'precip',
    'et0',
  ].find((id) => activeLayers.has(id as LayerId)) as LayerId | undefined;

  const activeLayerMeta: LayerMetadata | undefined = primaryLayerId
    ? MAP_LAYERS_CATALOG.find((l) => l.id === primaryLayerId)
    : undefined;

  const hasTemporal = activeLayers.has('ndvi') || activeLayers.has('evi') || activeLayers.has('moisture');

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 max-w-[94vw] pointer-events-none">
      {/* TEMPORAL OBSERVATION TIMELINE STRIP */}
      {hasTemporal && (
        <div
          className="pointer-events-auto px-3.5 py-2 rounded-2xl glass-card border border-white/15 shadow-2xl flex items-center gap-2 sm:gap-3 text-xs"
        >
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] shrink-0">
            <Clock className="w-3.5 h-3.5 text-[#27D7B2]" />
            <span className="hidden sm:inline">Temporal Frame:</span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {HISTORICAL_OBSERVATION_DATES.map((d) => {
              const isSelected = d.id === observationDate;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onSelectObservationDate(d.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#27D7B2] text-slate-950 font-bold shadow-sm'
                      : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                  title={`${d.label} · ${d.season} (${d.quality})`}
                >
                  {d.label.split(' ')[0]} {d.label.split(' ')[1]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ACTIVE LAYER LEGEND & ATTRIBUTION */}
      <div
        className="pointer-events-auto px-3.5 py-2 rounded-2xl glass-card border border-white/15 shadow-2xl flex flex-wrap items-center gap-3 sm:gap-4 text-xs"
      >
        {/* Layer Symbology Bar */}
        {activeLayerMeta?.paletteEndpoints ? (
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-slate-300 font-semibold">{activeLayerMeta.name}:</span>
            <span className="text-slate-400 text-[10px]">{activeLayerMeta.paletteEndpoints.minLabel}</span>
            <div
              className="w-24 sm:w-32 h-2.5 rounded-full border border-white/10"
              style={{
                background: `linear-gradient(to right, ${activeLayerMeta.paletteEndpoints.min}, ${
                  activeLayerMeta.paletteEndpoints.mid || '#E8B75D'
                }, ${activeLayerMeta.paletteEndpoints.max})`,
              }}
            />
            <span className="text-[#27D7B2] font-bold text-[10px]">{activeLayerMeta.paletteEndpoints.maxLabel}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-[#27D7B2] bg-[#27D7B2]/20 inline-block" />
            <span>Selected Parcel (Solid Teal)</span>
            <span className="text-white/20">|</span>
            <span className="w-2.5 h-2.5 rounded-full border border-slate-400 bg-slate-400/10 inline-block" />
            <span className="text-slate-400">Other Parcels</span>
          </div>
        )}

        {/* Minimal Source Citation */}
        <div className="text-[10px] text-slate-400 font-mono hidden md:flex items-center gap-1 border-l border-white/10 pl-3">
          <span>Source: {activeLayerMeta?.source || 'Esri Earthstar / OpenStreetMap'}</span>
        </div>
      </div>
    </div>
  );
};
