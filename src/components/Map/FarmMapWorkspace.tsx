import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  Globe,
  Map as MapIcon,
  Layers,
  Crosshair,
  PenTool,
  Check,
  X,
  Undo2,
  Search,
  Maximize2,
  Minimize2,
  Sprout,
  Droplets,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { SavedFarmPlan, FieldEntity } from '../../types';
import { saveFarmPlan, loadSavedFarms } from '../../store/farmStorage';

interface FarmMapWorkspaceProps {
  farms: SavedFarmPlan[];
  activeFarmId: string;
  onSelectFarmId: (farmId: string) => void;
  onNavigateTab: (tab: any) => void;
  onOpenCropRotation: (farmId: string, fieldId?: string) => void;
  onOpenDeepAnalysis?: (farmId: string, fieldId?: string) => void;
  isAdvanced?: boolean;
}

// Spherical Shoelace Formula for geodesic area in Hectares
function calculatePolygonAreaHa(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  const R = 6378137;
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const lat1 = (coords[i][0] * Math.PI) / 180;
    const lat2 = (coords[j][0] * Math.PI) / 180;
    const lon1 = (coords[i][1] * Math.PI) / 180;
    const lon2 = (coords[j][1] * Math.PI) / 180;
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  area = Math.abs((area * R * R) / 2.0);
  return Number((area / 10000).toFixed(2));
}

function calculatePolygonCentroid(coords: [number, number][]): [number, number] {
  if (coords.length === 0) return [0, 0];
  let sumLat = 0;
  let sumLon = 0;
  coords.forEach(([lat, lon]) => {
    sumLat += lat;
    sumLon += lon;
  });
  return [sumLat / coords.length, sumLon / coords.length];
}

export const FarmMapWorkspace: React.FC<FarmMapWorkspaceProps> = ({
  farms,
  activeFarmId,
  onSelectFarmId,
  onNavigateTab,
  onOpenCropRotation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const activeTileLayerRef = useRef<L.TileLayer | null>(null);

  const activeFarm = farms.find((f) => f.id === activeFarmId) || farms[0];
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeBaseLayer, setActiveBaseLayer] = useState<'satellite' | 'streets' | 'terrain'>('satellite');
  const [isDrawing, setIsDrawing] = useState(false);
  const [draftVertices, setDraftVertices] = useState<[number, number][]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Guarantee fields format
  const fields: FieldEntity[] = useMemo(() => {
    const lat = activeFarm?.farmAnswers?.lat || 38.8403;
    const lon = activeFarm?.farmAnswers?.lon || -97.6114;
    const delta = 0.003;

    if (activeFarm?.fields && activeFarm.fields.length > 0) {
      return activeFarm.fields.map((f, idx) => ({
        id: f.id,
        farmId: f.farmId,
        name: f.name,
        boundary: (f.boundary && f.boundary.length >= 3 ? f.boundary : [
          [lat + delta * 0.2 + idx * delta, lon - delta * 0.8],
          [lat + delta * 1.0 + idx * delta, lon - delta * 0.8],
          [lat + delta * 1.0 + idx * delta, lon + delta * 0.4],
          [lat + delta * 0.2 + idx * delta, lon + delta * 0.4],
        ]) as [number, number][],
        areaHa: f.areaHa || 12.5,
        areaAcres: f.areaAcres || (f.areaHa ? +(f.areaHa * 2.471).toFixed(1) : 30.9),
        geometryVersion: f.geometryVersion || 1,
        soilTexture: f.soilTexture,
        currentCrop: f.currentCrop,
        status: f.status || 'good',
      }));
    }

    return [
      {
        id: `${activeFarm?.id || 'farm'}_field_1`,
        farmId: activeFarm?.id || 'farm',
        name: 'Field 01 (North Parcel)',
        boundary: [
          [lat + delta * 0.2, lon - delta * 0.8],
          [lat + delta * 1.0, lon - delta * 0.8],
          [lat + delta * 1.0, lon + delta * 0.4],
          [lat + delta * 0.2, lon + delta * 0.4],
        ],
        areaHa: 14.2,
        areaAcres: 35.1,
        geometryVersion: 1,
        soilTexture: 'loam',
        currentCrop: { cropId: 'winter_wheat', name: 'Winter Wheat', stage: 'Tillering' },
        status: 'good',
      },
    ];
  }, [activeFarm]);

  const selectedField = fields.find((f) => f.id === selectedFieldId) || fields[0];

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const lat = activeFarm?.farmAnswers?.lat || 38.8403;
    const lon = activeFarm?.farmAnswers?.lon || -97.6114;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lon],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    const tile = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19 }
    ).addTo(map);

    activeTileLayerRef.current = tile;
    layerGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Layer Tile
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (activeTileLayerRef.current) {
      map.removeLayer(activeTileLayerRef.current);
    }

    let url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    let maxZoom = 19;

    if (activeBaseLayer === 'streets') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      maxZoom = 19;
    } else if (activeBaseLayer === 'terrain') {
      url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      maxZoom = 19;
    }

    const tile = L.tileLayer(url, { maxZoom }).addTo(map);
    activeTileLayerRef.current = tile;
  }, [activeBaseLayer]);

  // Click handler for drawing
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (!isDrawing) return;
      const point: [number, number] = [
        Number(e.latlng.lat.toFixed(6)),
        Number(e.latlng.lng.toFixed(6)),
      ];
      setDraftVertices((prev) => [...prev, point]);
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [isDrawing]);

  // Render Polygons on map
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;
    const group = layerGroupRef.current;
    group.clearLayers();

    fields.forEach((f) => {
      if (!f.boundary || f.boundary.length < 3) return;
      const isSelected = f.id === selectedField?.id;

      const polygon = L.polygon(f.boundary, {
        color: isSelected ? '#27D7B2' : '#94A3B8',
        weight: isSelected ? 3 : 1.8,
        fillColor: isSelected ? '#27D7B2' : '#38BDF8',
        fillOpacity: isSelected ? 0.3 : 0.15,
      });

      polygon.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedFieldId(f.id);
      });

      group.addLayer(polygon);

      const center = calculatePolygonCentroid(f.boundary);
      const labelIcon = L.divIcon({
        className: 'field-map-label',
        html: `<div class="px-2 py-0.5 rounded text-[10px] font-bold bg-black/80 text-white border border-[#27D7B2]/40 shadow-lg backdrop-blur-sm whitespace-nowrap -translate-x-1/2 -translate-y-1/2">
          ${f.name} · ${f.areaHa} ha
        </div>`,
        iconSize: [0, 0],
      });
      L.marker(center, { icon: labelIcon, interactive: false }).addTo(group);
    });

    // Render Draft Boundary
    if (draftVertices.length > 0) {
      if (draftVertices.length > 2) {
        L.polygon(draftVertices, {
          color: '#E8B75D',
          weight: 2.5,
          dashArray: '5, 5',
          fillColor: '#E8B75D',
          fillOpacity: 0.25,
        }).addTo(group);
      } else {
        L.polyline(draftVertices, {
          color: '#E8B75D',
          weight: 2.5,
          dashArray: '5, 5',
        }).addTo(group);
      }

      draftVertices.forEach((v, idx) => {
        const handle = L.circleMarker(v, {
          radius: idx === 0 ? 6 : 4,
          color: idx === 0 ? '#27D7B2' : '#E8B75D',
          fillColor: '#031826',
          fillOpacity: 1,
          weight: 2,
        });
        group.addLayer(handle);
      });
    }
  }, [fields, selectedField, draftVertices]);

  // Center on field
  const handleFitField = (field: FieldEntity) => {
    setSelectedFieldId(field.id);
    if (mapInstanceRef.current && field.boundary && field.boundary.length > 2) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(field.boundary), {
        padding: [50, 50],
        maxZoom: 17,
      });
    }
  };

  const handleFitAll = () => {
    if (!mapInstanceRef.current || fields.length === 0) return;
    const allCoords: [number, number][] = [];
    fields.forEach((f) => {
      if (f.boundary) allCoords.push(...f.boundary);
    });
    if (allCoords.length > 0) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(allCoords), {
        padding: [50, 50],
        maxZoom: 16,
      });
    }
  };

  // Finish Drawing
  const handleSaveDrawing = () => {
    if (draftVertices.length < 3) return;
    const area = calculatePolygonAreaHa(draftVertices);
    const newField: FieldEntity = {
      id: `${activeFarm.id}_field_${Date.now()}`,
      farmId: activeFarm.id,
      name: `Field 0${fields.length + 1}`,
      boundary: draftVertices,
      areaHa: area,
      areaAcres: Number((area * 2.47105).toFixed(2)),
      geometryVersion: 1,
      soilTexture: activeFarm?.farmAnswers?.soilTexture || 'loam',
      currentCrop: { cropId: 'winter_wheat', name: 'Winter Wheat', stage: 'Planned' },
      status: 'good',
    };

    const updated = {
      ...activeFarm,
      fields: [...(activeFarm.fields || []), newField as any],
    };
    saveFarmPlan(updated);
    setIsDrawing(false);
    setDraftVertices([]);
    setSelectedFieldId(newField.id);
    setNotification(`New ${area} ha boundary registered.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const draftAreaHa = useMemo(() => calculatePolygonAreaHa(draftVertices), [draftVertices]);

  return (
    <div className="relative w-full h-[calc(100vh-56px)] bg-[#031520] overflow-hidden">
      {/* Toast */}
      {notification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-[#27D7B2] text-white text-xs font-semibold shadow-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-[#27D7B2]" />
          <span>{notification}</span>
        </div>
      )}

      {/* MAP CANVAS */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* USER'S EXACT PRINCIPLE: CONNECTED TOOLBAR JOINED ON TOP-RIGHT OF MAP */}
      <div className="absolute top-4 right-4 z-[500] flex items-center gap-2">
        {/* Connected Card: Satellite, Streets, Terrain Layer Switchers (ICONS ONLY) */}
        <div className="flex items-center bg-[#031520]/85 backdrop-blur-md border border-white/15 rounded-xl p-1 shadow-2xl">
          <button
            type="button"
            onClick={() => setActiveBaseLayer('satellite')}
            title="Satellite Imagery"
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeBaseLayer === 'satellite'
                ? 'bg-[#27D7B2] text-[#020A10] font-bold shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Globe className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setActiveBaseLayer('streets')}
            title="Street & Road Map"
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeBaseLayer === 'streets'
                ? 'bg-[#27D7B2] text-[#020A10] font-bold shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <MapIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setActiveBaseLayer('terrain')}
            title="Analytical Dark Terrain"
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeBaseLayer === 'terrain'
                ? 'bg-[#27D7B2] text-[#020A10] font-bold shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>

        {/* Connected Card: Field Tools (Draw Polygon, Center, Search) */}
        <div className="flex items-center bg-[#031520]/85 backdrop-blur-md border border-white/15 rounded-xl p-1 shadow-2xl">
          {!isDrawing ? (
            <button
              type="button"
              onClick={() => {
                setIsDrawing(true);
                setDraftVertices([]);
              }}
              title="Draw Field Boundary"
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <PenTool className="w-4 h-4 text-[#27D7B2]" />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <span className="px-2 text-xs font-mono text-[#E8B75D]">
                {draftVertices.length} pts ({draftAreaHa} ha)
              </span>
              <button
                type="button"
                onClick={() => setDraftVertices((prev) => prev.slice(0, -1))}
                disabled={draftVertices.length === 0}
                title="Undo point"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDrawing(false);
                  setDraftVertices([]);
                }}
                title="Cancel Drawing"
                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleSaveDrawing}
                disabled={draftVertices.length < 3}
                title="Save Boundary"
                className="p-1.5 rounded-lg bg-[#27D7B2] text-[#020A10] disabled:opacity-30 cursor-pointer"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleFitAll}
            title="Center Farm"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TOP-LEFT: CONNECTED COMPACT PARCEL BADGE (NO SPAM CARDS) */}
      <div className="absolute top-4 left-4 z-[500] flex items-center gap-2">
        <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#031520]/85 backdrop-blur-md border border-white/15 shadow-2xl text-white">
          <div className="w-7 h-7 rounded-lg bg-[#27D7B2]/20 border border-[#27D7B2]/40 flex items-center justify-center text-[#27D7B2]">
            <Sprout className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold leading-none flex items-center gap-1.5">
              <span>{selectedField.name}</span>
              <span className={`w-2 h-2 rounded-full ${selectedField.status === 'good' ? 'bg-[#57C58D]' : 'bg-[#EC7771]'}`} />
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
              <span>{selectedField.areaHa} ha ({selectedField.areaAcres} ac)</span>
              <span>·</span>
              <span className="text-[#27D7B2]">
                {typeof selectedField.currentCrop === 'object'
                  ? selectedField.currentCrop?.name
                  : selectedField.currentCrop || 'Active Parcel'}
              </span>
            </div>
          </div>
        </div>

        {/* Parcel Quick Selector Pills */}
        <div className="hidden md:flex items-center bg-[#031520]/85 backdrop-blur-md border border-white/15 rounded-xl p-1 gap-1">
          {fields.map((f) => {
            const isSel = f.id === selectedField.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => handleFitField(f)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  isSel
                    ? 'bg-[#27D7B2] text-[#020A10]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {f.name.replace(/.*—\s*/, '')}
              </button>
            );
          })}
        </div>
      </div>

      {/* BOTTOM-LEFT: QUICK ACTION TO ROTATIONS */}
      <div className="absolute bottom-4 left-4 z-[500]">
        <button
          type="button"
          onClick={() => onOpenCropRotation(activeFarm.id, selectedField.id)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#27D7B2] hover:bg-[#20C09E] text-[#020A10] font-bold text-xs shadow-2xl shadow-[#27D7B2]/30 transition-all cursor-pointer active:scale-95"
        >
          <span>Plan Rotation for {selectedField.name}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
