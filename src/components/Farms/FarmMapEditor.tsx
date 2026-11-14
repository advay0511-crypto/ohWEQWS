import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Layers,
  Plus,
  Trash2,
  Check,
  Undo2,
  Redo2,
  Info,
  Maximize2,
  Minimize2,
  Sparkles,
  Compass,
} from 'lucide-react';
import { FarmField, FieldBoundary, SavedFarmPlan } from '../../types';
import { undoManager } from '../../store/undoStore';

interface FarmMapEditorProps {
  farm: SavedFarmPlan;
  activeFieldId?: string;
  onSelectField?: (fieldId: string) => void;
  onUpdateFieldBoundary?: (fieldId: string, boundary: FieldBoundary) => void;
  onAddField?: (field: Omit<FarmField, 'id'>) => void;
  onDeleteField?: (fieldId: string) => void;
  isAdvanced?: boolean;
}

/**
 * Calculates geodesic surface area of a polygon on Earth (WGS84 spherical approximation)
 * R = 6,371,000 meters.
 * Returns { areaM2, areaHa, areaAcres }
 */
export function calculateGeodesicArea(coordinates: [number, number][]): {
  areaM2: number;
  areaHa: number;
  areaAcres: number;
} {
  if (!coordinates || coordinates.length < 3) {
    return { areaM2: 0, areaHa: 0, areaAcres: 0 };
  }

  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  let total = 0;
  const n = coordinates.length;

  for (let i = 0; i < n; i++) {
    const [lat1, lon1] = coordinates[i];
    const [lat2, lon2] = coordinates[(i + 1) % n];

    const dLon = toRad(lon2 - lon1);
    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);

    total += dLon * (2 + Math.sin(phi1) + Math.sin(phi2));
  }

  const areaM2 = Math.abs((total * R * R) / 2);
  const areaHa = Number((areaM2 / 10000).toFixed(2));
  const areaAcres = Number((areaM2 / 4046.8564).toFixed(2));

  return { areaM2, areaHa, areaAcres };
}

/**
 * Format latitude and longitude into honest hemisphere coordinates: e.g. 25.1234° N, 55.4567° E
 */
export function formatHemisphereCoords(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
}

const FIELD_COLORS = [
  { stroke: '#20DCC0', fill: '#20DCC0', label: 'Teal Emerald' },
  { stroke: '#38BDF8', fill: '#38BDF8', label: 'Sky Blue' },
  { stroke: '#F59E0B', fill: '#F59E0B', label: 'Amber Gold' },
  { stroke: '#A855F7', fill: '#A855F7', label: 'Purple Violet' },
  { stroke: '#10B981', fill: '#10B981', label: 'Forest Green' },
];

export const FarmMapEditor: React.FC<FarmMapEditorProps> = ({
  farm,
  activeFieldId,
  onSelectField,
  onUpdateFieldBoundary,
  onAddField,
  onDeleteField,
  isAdvanced = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayersRef = useRef<Map<string, L.Polygon>>(new Map());
  const vertexMarkersRef = useRef<L.Marker[]>([]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>(
    activeFieldId || farm.fields?.[0]?.id || 'field_1'
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync selected field
  useEffect(() => {
    if (activeFieldId) {
      setSelectedFieldId(activeFieldId);
    }
  }, [activeFieldId]);

  const activeField = farm.fields?.find((f) => f.id === selectedFieldId) || farm.fields?.[0];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const worldBounds: L.LatLngBoundsExpression = [
      [-85.0511, -180],
      [85.0511, 180],
    ];

    const initialLat = farm.farmAnswers?.lat || 25.12;
    const initialLon = farm.farmAnswers?.lon || 55.45;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 15,
      minZoom: 3,
      maxZoom: 19,
      maxBounds: worldBounds,
      maxBoundsViscosity: 1.0,
      zoomControl: true,
      attributionControl: false,
    });

    // High quality OpenStreetMap tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      noWrap: true,
      maxZoom: 19,
      bounds: worldBounds,
    }).addTo(map);

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [farm.id]);

  // Handle Map Click while Drawing
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isDrawing) return;
      const newPoint: [number, number] = [
        Number(e.latlng.lat.toFixed(6)),
        Number(e.latlng.lng.toFixed(6)),
      ];
      setDrawingPoints((prev) => [...prev, newPoint]);
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isDrawing]);

  // Clear vertex markers
  const clearVertexMarkers = useCallback(() => {
    vertexMarkersRef.current.forEach((m) => m.remove());
    vertexMarkersRef.current = [];
  }, []);

  // Render Polygons and Edit Handles for Fields
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing polygon layers
    polygonLayersRef.current.forEach((layer) => layer.remove());
    polygonLayersRef.current.clear();
    clearVertexMarkers();

    const fields = farm.fields || [];
    const allBounds: L.LatLngExpression[] = [];

    fields.forEach((field, idx) => {
      const coords = Array.isArray(field.boundary) ? field.boundary : (field.boundary as any)?.coordinates;
      if (!coords || coords.length < 3) return;

      const isSelected = field.id === selectedFieldId;
      const colorScheme = FIELD_COLORS[idx % FIELD_COLORS.length];

      coords.forEach(([lat, lon]: [number, number]) => allBounds.push([lat, lon]));

      const polygon = L.polygon(coords, {
        color: isSelected ? '#20DCC0' : colorScheme.stroke,
        weight: isSelected ? 3 : 2,
        fillColor: colorScheme.fill,
        fillOpacity: isSelected ? 0.35 : 0.2,
      }).addTo(map);

      polygon.on('click', () => {
        setSelectedFieldId(field.id);
        if (onSelectField) onSelectField(field.id);
      });

      polygonLayersRef.current.set(field.id, polygon);

      // If active field and not currently in creation mode, attach vertex drag handles
      if (isSelected && !isDrawing) {
        coords.forEach((coord: [number, number], vIdx: number) => {
          const markerIcon = L.divIcon({
            className: 'vertex-drag-handle',
            html: `<div style="width: 12px; height: 12px; border-radius: 50%; background: #20DCC0; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.6); cursor: grab;"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          });

          const vertexMarker = L.marker(coord, {
            icon: markerIcon,
            draggable: true,
          }).addTo(map);

          vertexMarker.on('dragend', (e) => {
            const newPos = e.target.getLatLng();
            const updatedCoords = [...coords];
            const oldCoords = [...coords];

            updatedCoords[vIdx] = [
              Number(newPos.lat.toFixed(6)),
              Number(newPos.lng.toFixed(6)),
            ];

            const { areaHa, areaAcres } = calculateGeodesicArea(updatedCoords);
            const newBoundary: FieldBoundary = {
              type: 'Polygon',
              coordinates: updatedCoords,
              areaHa,
              areaAcres,
            };

            // Register Undo action
            undoManager.push({
              description: `Move vertex #${vIdx + 1} on ${field.name}`,
              undo: () => {
                const { areaHa: oldHa, areaAcres: oldAcres } = calculateGeodesicArea(oldCoords);
                if (onUpdateFieldBoundary) {
                  onUpdateFieldBoundary(field.id, {
                    type: 'Polygon',
                    coordinates: oldCoords,
                    areaHa: oldHa,
                    areaAcres: oldAcres,
                  });
                }
              },
              redo: () => {
                if (onUpdateFieldBoundary) {
                  onUpdateFieldBoundary(field.id, newBoundary);
                }
              },
            });

            if (onUpdateFieldBoundary) {
              onUpdateFieldBoundary(field.id, newBoundary);
            }
          });

          vertexMarkersRef.current.push(vertexMarker);
        });
      }
    });

    // Temporary drawing polygon
    if (drawingPoints.length > 0) {
      const drawPoly = L.polygon(drawingPoints, {
        color: '#F59E0B',
        weight: 2,
        dashArray: '4, 4',
        fillColor: '#F59E0B',
        fillOpacity: 0.25,
      }).addTo(map);

      polygonLayersRef.current.set('__drawing__', drawPoly);
    }

    if (allBounds.length > 0 && !isDrawing) {
      try {
        map.fitBounds(allBounds as any, { padding: [40, 40], maxZoom: 17 });
      } catch {
        // ignore bounds calculation error
      }
    }
  }, [farm.fields, selectedFieldId, isDrawing, drawingPoints, clearVertexMarkers, onSelectField, onUpdateFieldBoundary]);

  // Save Drawn Polygon
  const handleFinishDrawing = () => {
    if (drawingPoints.length < 3) {
      alert('A valid field polygon requires at least 3 boundary points.');
      return;
    }

    const { areaHa, areaAcres } = calculateGeodesicArea(drawingPoints);
    const newBoundary: FieldBoundary = {
      type: 'Polygon',
      coordinates: drawingPoints,
      areaHa,
      areaAcres,
    };

    if (activeField && onUpdateFieldBoundary) {
      const prevBoundary = activeField.boundary;
      undoManager.push({
        description: `Update boundary for ${activeField.name}`,
        undo: () => {
          if (prevBoundary) onUpdateFieldBoundary(activeField.id, prevBoundary);
        },
        redo: () => {
          onUpdateFieldBoundary(activeField.id, newBoundary);
        },
      });
      onUpdateFieldBoundary(activeField.id, newBoundary);
    }

    setDrawingPoints([]);
    setIsDrawing(false);
  };

  const handleCancelDrawing = () => {
    setDrawingPoints([]);
    setIsDrawing(false);
  };

  const activeBoundary = activeField?.boundary
    ? (Array.isArray(activeField.boundary) ? activeField.boundary : (activeField.boundary as any).coordinates)
    : undefined;

  const currentArea = activeBoundary && activeBoundary.length >= 3
    ? calculateGeodesicArea(activeBoundary)
    : { areaHa: activeField?.areaHa || 0, areaAcres: (activeField?.areaHa ? +(activeField.areaHa * 2.471).toFixed(1) : 0) };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-700/80 bg-[#06121C] shadow-lg flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[580px]'
      }`}
    >
      {/* Top Controls Toolbar */}
      <div className="px-4 py-2.5 bg-[#091824]/90 backdrop-blur-md border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Field Boundary &amp; Geometry Editor
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {farm.fields?.length || 0} Field Parcels
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isDrawing ? (
            <button
              type="button"
              onClick={() => {
                setDrawingPoints([]);
                setIsDrawing(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Draw Boundary</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-amber-400 font-semibold px-2">
                Click map to place points ({drawingPoints.length} set)
              </span>
              <button
                type="button"
                onClick={handleFinishDrawing}
                disabled={drawingPoints.length < 3}
                className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
              <button
                type="button"
                onClick={handleCancelDrawing}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative flex-1 w-full h-full">
        <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '380px' }} />

        {/* Floating Field Selector Pill Bar */}
        <div className="absolute top-3 left-3 z-[1000] flex flex-wrap gap-1.5 max-w-[calc(100%-24px)]">
          {(farm.fields || []).map((f, i) => {
            const isSel = f.id === selectedFieldId;
            const color = FIELD_COLORS[i % FIELD_COLORS.length];
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setSelectedFieldId(f.id);
                  if (onSelectField) onSelectField(f.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-md border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSel
                    ? 'bg-slate-900/95 text-cyan-300 border-cyan-400 shadow-md ring-1 ring-cyan-400/40'
                    : 'bg-slate-950/75 text-slate-300 border-slate-800 hover:bg-slate-900'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color.stroke }}
                />
                <span>{f.name}</span>
                <span className="text-[10px] opacity-75 font-mono">
                  ({(f.boundary as any)?.areaHa || f.areaHa} ha)
                </span>
              </button>
            );
          })}
        </div>

        {/* Floating Field Telemetry & Geodesic Area Badge */}
        {activeField && (
          <div className="absolute bottom-3 left-3 z-[1000] p-3 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-700/80 shadow-xl max-w-sm text-xs text-white space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-cyan-400">{activeField.name}</span>
              <span className="text-[10px] font-mono text-slate-400">
                {activeField.soilTexture?.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Geodesic Area</span>
                <span className="font-bold text-white">
                  {currentArea.areaHa} ha ({currentArea.areaAcres || (currentArea.areaHa * 2.471).toFixed(1)} ac)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Vertices</span>
                <span className="font-bold text-white">
                  {Array.isArray(activeField.boundary) ? activeField.boundary.length : ((activeField.boundary as any)?.coordinates?.length || 0)} points
                </span>
              </div>
            </div>
            <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800 flex items-center gap-1">
              <Compass className="w-3 h-3 text-cyan-400" />
              <span>
                Center:{' '}
                {formatHemisphereCoords(
                  farm.farmAnswers?.lat || 25.12,
                  farm.farmAnswers?.lon || 55.45
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
