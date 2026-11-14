import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Search, MapPin, Compass, AlertCircle, PenTool, RotateCcw, Trash2, CheckCircle2 } from 'lucide-react';
import { PRESET_REGIONS } from '../../services/nasaApi';

interface FarmMapPickerProps {
  lat: number;
  lon: number;
  locationName: string;
  onChangeLocation: (lat: number, lon: number, name: string) => void;
  boundary?: [number, number][];
  onChangeBoundary?: (boundary: [number, number][], areaHa: number) => void;
  showBoundaryTool?: boolean;
}

/**
 * Calculates geodesic area of a polygon on Earth sphere in hectares
 */
function computePolygonAreaHa(coords: [number, number][]): number {
  if (!coords || coords.length < 3) return 0;
  const radius = 6378137; // meters
  let area = 0;
  const len = coords.length;
  for (let i = 0; i < len; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % len];
    const lat1 = (p1[0] * Math.PI) / 180;
    const lat2 = (p2[0] * Math.PI) / 180;
    const lon1 = (p1[1] * Math.PI) / 180;
    const lon2 = (p2[1] * Math.PI) / 180;
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  area = (Math.abs(area) * radius * radius) / 2;
  return Number((area / 10000).toFixed(2));
}

export const FarmMapPicker: React.FC<FarmMapPickerProps> = ({
  lat,
  lon,
  locationName,
  onChangeLocation,
  boundary = [],
  onChangeBoundary,
  showBoundaryTool = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const vertexMarkersRef = useRef<L.CircleMarker[]>([]);

  const [activeTool, setActiveTool] = useState<'pin' | 'boundary'>('pin');
  const [currentBoundary, setCurrentBoundary] = useState<[number, number][]>(boundary);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualLat, setManualLat] = useState(lat.toString());
  const [manualLon, setManualLon] = useState(lon.toString());
  const [tileError, setTileError] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const calculatedAreaHa = computePolygonAreaHa(currentBoundary);

  // Initialize Leaflet map
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

    const map = L.map(mapContainerRef.current, {
      center: [lat, lon],
      zoom: 6,
      minZoom: 2,
      maxZoom: 18,
      maxBounds: worldBounds,
      maxBoundsViscosity: 1.0,
      worldCopyJump: false,
      zoomControl: true,
      attributionControl: false,
    });

    const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      noWrap: true,
      bounds: worldBounds,
      maxZoom: 19,
    });

    osmLayer.on('tileerror', () => {
      setTileError(true);
    });

    osmLayer.addTo(map);

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    // Custom Teal Location Pin
    const customIcon = L.divIcon({
      className: 'custom-pin-wrapper',
      html: `
        <div style="position: relative; width: 32px; height: 32px; transform: translate(-16px, -32px);">
          <div style="position: absolute; inset: -4px; border-radius: 50%; background: rgba(131, 197, 142, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <svg viewBox="0 0 24 24" width="32" height="32" fill="#83C58E" stroke="#07130C" stroke-width="1.8" style="filter: drop-shadow(0 4px 10px rgba(0,0,0,0.7));">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    const marker = L.marker([lat, lon], {
      icon: customIcon,
      draggable: true,
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      const clampedLat = Math.max(-85, Math.min(85, pos.lat));
      const clampedLon = Math.max(-180, Math.min(180, pos.lng));
      setManualLat(clampedLat.toFixed(4));
      setManualLon(clampedLon.toFixed(4));
      onChangeLocation(clampedLat, clampedLon, locationName);
      setStatusMessage('Location pin moved.');
    });

    // Map Click Handler: adds boundary vertex or moves pin depending on active tool
    map.on('click', (e: L.LeafletMouseEvent) => {
      const clickedLat = Number(e.latlng.lat.toFixed(5));
      const clickedLon = Number(e.latlng.lng.toFixed(5));

      if (activeTool === 'boundary') {
        setCurrentBoundary((prev) => {
          const next = [...prev, [clickedLat, clickedLon] as [number, number]];
          if (onChangeBoundary) {
            onChangeBoundary(next, computePolygonAreaHa(next));
          }
          return next;
        });
        setStatusMessage(`Added boundary vertex #${currentBoundary.length + 1}`);
      } else {
        marker.setLatLng([clickedLat, clickedLon]);
        setManualLat(clickedLat.toFixed(4));
        setManualLon(clickedLon.toFixed(4));
        onChangeLocation(clickedLat, clickedLon, locationName);
      }
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update polygon overlay when boundary points change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (polygonLayerRef.current) {
      polygonLayerRef.current.remove();
      polygonLayerRef.current = null;
    }

    vertexMarkersRef.current.forEach((m) => m.remove());
    vertexMarkersRef.current = [];

    if (currentBoundary.length >= 2) {
      const poly = L.polygon(currentBoundary, {
        color: '#83C58E',
        weight: 2,
        fillColor: '#83C58E',
        fillOpacity: 0.22,
      }).addTo(mapInstanceRef.current);
      polygonLayerRef.current = poly;
    }

    // Render subtle vertex circle markers
    currentBoundary.forEach((pt) => {
      const cm = L.circleMarker(pt, {
        radius: 4,
        color: '#FFFFFF',
        weight: 1.5,
        fillColor: '#83C58E',
        fillOpacity: 1,
      }).addTo(mapInstanceRef.current!);
      vertexMarkersRef.current.push(cm);
    });
  }, [currentBoundary]);

  // Center on updated lat/lon
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([lat, lon]);
    }
  }, [lat, lon]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setStatusMessage('Searching geographic location...');
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await resp.json();

      if (data && data.length > 0) {
        const found = data[0];
        const newLat = parseFloat(found.lat);
        const newLon = parseFloat(found.lon);
        const name = found.display_name.split(',')[0];

        onChangeLocation(newLat, newLon, name);
        setManualLat(newLat.toFixed(4));
        setManualLon(newLon.toFixed(4));

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([newLat, newLon], 11, { duration: 1.2 });
          markerRef.current.setLatLng([newLat, newLon]);
        }
        setStatusMessage(`Found: ${name}`);
      } else {
        setStatusMessage('Location not found. Try entering coordinates.');
      }
    } catch {
      setStatusMessage('Geocoding service unavailable. You can enter coordinates manually.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleApplyManual = () => {
    const parsedLat = parseFloat(manualLat);
    const parsedLon = parseFloat(manualLon);
    if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
      const clampedLat = Math.max(-85, Math.min(85, parsedLat));
      const clampedLon = Math.max(-180, Math.min(180, parsedLon));
      onChangeLocation(clampedLat, clampedLon, locationName);
      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.flyTo([clampedLat, clampedLon], 9);
        markerRef.current.setLatLng([clampedLat, clampedLon]);
      }
      setStatusMessage('Coordinates applied.');
    }
  };

  const handleClearBoundary = () => {
    setCurrentBoundary([]);
    if (onChangeBoundary) onChangeBoundary([], 0);
    setStatusMessage('Boundary cleared.');
  };

  const handleUndoVertex = () => {
    if (currentBoundary.length === 0) return;
    const next = currentBoundary.slice(0, -1);
    setCurrentBoundary(next);
    if (onChangeBoundary) onChangeBoundary(next, computePolygonAreaHa(next));
    setStatusMessage('Removed last vertex.');
  };

  const formatCoord = (val: number, isLat: boolean) => {
    const dir = isLat ? (val >= 0 ? '°N' : '°S') : val >= 0 ? '°E' : '°W';
    return `${Math.abs(val).toFixed(4)}${dir}`;
  };

  return (
    <div className="w-full flex flex-col space-y-3.5">
      {/* Search & Tool Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search Input */}
        <form onSubmit={handleSearch} className="relative flex-1">
          <input
            type="text"
            placeholder="Search address, city, or region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-9 pr-4 rounded-[10px] bg-[rgba(7,20,12,0.85)] border border-[rgba(226,241,228,0.14)] text-sm text-[#F1F6EF] placeholder-[#9BA99C] focus:outline-none focus:border-[#83C58E] focus:ring-1 focus:ring-[#83C58E]"
          />
          <Search className="w-4 h-4 text-[#9BA99C] absolute left-3 top-3.5" />
        </form>

        {/* Tool Mode Switcher (Pin vs Boundary) */}
        {showBoundaryTool && (
          <div className="flex items-center gap-1.5 p-1 rounded-[10px] glass-card">
            <button
              type="button"
              onClick={() => {
                setActiveTool('pin');
                setStatusMessage('Pin mode: Drag or click to set farm center point.');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTool === 'pin'
                  ? 'bg-[#183324] text-[#83C58E] border border-[rgba(131,197,142,0.3)] shadow-sm'
                  : 'text-[#C0CEC2] hover:text-[#F1F6EF]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Location Pin</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTool('boundary');
                setStatusMessage('Draw Boundary mode: Click map to place vertices for field polygon.');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTool === 'boundary'
                  ? 'bg-[#183324] text-[#83C58E] border border-[rgba(131,197,142,0.3)] shadow-sm'
                  : 'text-[#C0CEC2] hover:text-[#F1F6EF]'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Draw Boundary</span>
            </button>
          </div>
        )}
      </div>

      {/* Map Viewport */}
      <div className="relative w-full h-[320px] sm:h-[380px] rounded-[16px] overflow-hidden border border-[rgba(226,241,228,0.14)] shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Overlay HUD: Coordinates and Area */}
        <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-2 pointer-events-none">
          <div className="px-3 py-1.5 rounded-lg glass-card text-xs font-mono text-[#F1F6EF] shadow-md flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#83C58E]" />
            <span>
              {formatCoord(lat, true)}, {formatCoord(lon, false)}
            </span>
          </div>

          {calculatedAreaHa > 0 && (
            <div className="px-3 py-1.5 rounded-lg glass-card text-xs font-mono text-[#83C58E] shadow-md flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {calculatedAreaHa} ha ({(calculatedAreaHa * 2.471).toFixed(1)} ac)
              </span>
            </div>
          )}
        </div>

        {/* Boundary vertex actions (Undo, Clear) */}
        {activeTool === 'boundary' && currentBoundary.length > 0 && (
          <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5 glass-card p-1 rounded-lg">
            <button
              type="button"
              onClick={handleUndoVertex}
              className="px-2 py-1 text-xs text-[#C0CEC2] hover:text-[#F1F6EF] hover:bg-white/10 rounded flex items-center gap-1 transition-colors cursor-pointer"
              title="Undo last vertex"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
            <button
              type="button"
              onClick={handleClearBoundary}
              className="px-2 py-1 text-xs text-[#E97971] hover:bg-[#E97971]/15 rounded flex items-center gap-1 transition-colors cursor-pointer"
              title="Clear all vertices"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        )}

        {/* Tile error alert */}
        {tileError && (
          <div className="absolute bottom-3 left-3 right-3 z-[400] p-2.5 rounded-lg bg-[rgba(230,184,106,0.18)] border border-[#E6B86A]/40 text-xs text-[#E6B86A] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Map tiles may be throttled. You can still enter coordinates manually below.</span>
          </div>
        )}

        {/* Map attribution */}
        <div className="absolute bottom-1 right-2 z-[400] text-[10px] text-white/50 bg-black/40 px-1.5 rounded pointer-events-none">
          © OpenStreetMap contributors
        </div>
      </div>

      {/* Helper text / Status line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#9BA99C] gap-1">
        <div>
          {statusMessage ||
            (activeTool === 'boundary'
              ? 'Click around your field edges to outline the boundary. 3+ points calculate geodesic area.'
              : 'Drag the pin to center your farm location or search by city name.')}
        </div>
        <button
          type="button"
          onClick={() => setManualMode(!manualMode)}
          className="text-[#83C58E] hover:underline cursor-pointer text-left sm:text-right"
        >
          {manualMode ? 'Hide coordinate entry' : 'Enter coordinates manually'}
        </button>
      </div>

      {/* Manual Coordinate Form */}
      {manualMode && (
        <div className="p-3.5 rounded-[12px] glass-card space-y-2.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-[#9BA99C] mb-1">
                Latitude (-85 to +85)
              </label>
              <input
                type="number"
                step="any"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="w-full h-9 px-3 rounded-[8px] bg-[#020A10]/70 border border-white/10 text-xs font-mono text-[#F1F6EF] focus:outline-none focus:border-[#27D7B2]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-[#9BA99C] mb-1">
                Longitude (-180 to +180)
              </label>
              <input
                type="number"
                step="any"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
                className="w-full h-9 px-3 rounded-[8px] bg-[#020A10]/70 border border-white/10 text-xs font-mono text-[#F1F6EF] focus:outline-none focus:border-[#27D7B2]"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleApplyManual}
            className="px-3 py-1.5 rounded-[8px] bg-[#27D7B2]/20 hover:bg-[#27D7B2]/30 text-[#27D7B2] border border-[#27D7B2]/40 text-xs font-medium cursor-pointer transition-colors"
          >
            Apply Coordinates
          </button>
        </div>
      )}
    </div>
  );
};
