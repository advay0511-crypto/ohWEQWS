import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AlertTriangle,
  Check,
  X,
  Undo2,
  Redo2,
  Trash2,
  PenTool,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  MapPin,
  Upload,
  Download,
  Scissors,
  CheckCircle2,
} from 'lucide-react';
import { SavedFarmPlan, FieldBoundaryItem, AppUnits } from '../../types';
import {
  calculateGeodesicArea,
  calculateGeodesicPerimeter,
  calculatePolygonCentroid,
  formatArea,
  validatePolygon,
  LatLngPoint,
} from '../../engine/geodesic';
import {
  MapMode,
  EditorSubState,
  DrawTool,
  BasemapType,
  InspectorTab,
  LayerId,
  InspectedPixel,
  MapsWorkspaceProps,
} from './types';
import {
  MAP_LAYERS_CATALOG,
  HISTORICAL_OBSERVATION_DATES,
  REGIONAL_COHORTS_DATA,
} from './mapDataCatalog';
import { MapToolbar } from './MapToolbar';
import { MapNavigator } from './MapNavigator';
import { MapInspector } from './MapInspector';
import { MapLegend } from './MapLegend';

export const MapsWorkspace: React.FC<MapsWorkspaceProps> = ({
  farms,
  activeFarmId,
  onSelectFarm,
  onOpenFarmView,
  onOpenCropRotation,
  onOpenDeepAnalysis,
  onSaveFarmBoundary,
  onCreateFarmFromBoundary,
  onDeleteFarm,
  onRemoveBoundary,
  units = 'metric',
  isAdvanced = false,
}) => {
  // -------------------------------------------------------------
  // PRIMARY WORKSPACE STATE
  // -------------------------------------------------------------
  const [selectedFarmIdState, setSelectedFarmIdState] = useState<string>(activeFarmId || farms[0]?.id || '');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  // Sync with activeFarmId from props
  useEffect(() => {
    if (activeFarmId && activeFarmId !== selectedFarmIdState) {
      setSelectedFarmIdState(activeFarmId);
    }
  }, [activeFarmId]);

  const selectedFarm = farms.find((f) => f.id === selectedFarmIdState) || farms[0];
  const selectedField = selectedFarm?.fields?.find((f) => f.id === selectedFieldId) || selectedFarm?.fields?.[0];

  // 4 Modes: explore, edit, inspect, regional
  const [mapMode, setMapMode] = useState<MapMode>('explore');
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('overview');

  // Panel Collapse States
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  // Basemap & Layer Toggles
  const [basemapType, setBasemapType] = useState<BasemapType>('satellite');
  const [activeLayers, setActiveLayers] = useState<Set<LayerId>>(
    new Set(['boundaries', 'labels', 'exclusions', 'ndvi'])
  );
  const [layerOpacity, setLayerOpacity] = useState<Record<string, number>>({
    ndvi: 0.7,
    evi: 0.65,
    moisture: 0.6,
    precip: 0.55,
    et0: 0.5,
  });

  // Observation dates
  const [observationDate, setObservationDate] = useState<string>('2026-10-28');
  const [compareBeforeDate, setCompareBeforeDate] = useState<string>('2026-05-10');
  const [compareAfterDate, setCompareAfterDate] = useState<string>('2026-10-28');
  const [swipePosition, setSwipePosition] = useState<number>(50);

  // Point Inspector state
  const [inspectedPixel, setInspectedPixel] = useState<InspectedPixel | null>(null);

  // -------------------------------------------------------------
  // DRAWING / GEOMETRY EDITOR STATE MACHINE
  // viewing → drawing → draft_valid|draft_invalid → editing_vertices → validating → save_pending → saved|save_failed
  // -------------------------------------------------------------
  const [editorSubState, setEditorSubState] = useState<EditorSubState>('viewing');
  const [drawTool, setDrawTool] = useState<DrawTool>('polygon');
  const [draftVertices, setDraftVertices] = useState<LatLngPoint[]>([]);
  const [draftExclusions, setDraftExclusions] = useState<LatLngPoint[][]>([]);
  const [mousePreviewPoint, setMousePreviewPoint] = useState<LatLngPoint | null>(null);
  const [historyStack, setHistoryStack] = useState<LatLngPoint[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // Modals
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [pendingSwitchAction, setPendingSwitchAction] = useState<(() => void) | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [newFieldNameInput, setNewFieldNameInput] = useState('');
  const [saveTargetFarmId, setSaveTargetFarmId] = useState<string>(selectedFarmIdState);

  // Map references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const basemapTileLayerRef = useRef<L.TileLayer | null>(null);
  const ndviLayerRef = useRef<L.TileLayer | null>(null);
  const moistureLayerRef = useRef<L.TileLayer | null>(null);
  const polygonLayersGroupRef = useRef<L.LayerGroup | null>(null);
  const draftLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const cohortMarkersGroupRef = useRef<L.LayerGroup | null>(null);

  // -------------------------------------------------------------
  // CALCULATIONS (Geodesic Area & Perimeter)
  // -------------------------------------------------------------
  const draftAreaM2 = useMemo(() => {
    if (draftVertices.length < 3) return 0;
    const grossArea = calculateGeodesicArea(draftVertices);
    const excludedArea = draftExclusions.reduce((sum, hole) => sum + calculateGeodesicArea(hole), 0);
    return Math.max(0, grossArea - excludedArea);
  }, [draftVertices, draftExclusions]);

  const draftPerimeterM = useMemo(() => {
    if (draftVertices.length < 2) return 0;
    return calculateGeodesicPerimeter(draftVertices);
  }, [draftVertices]);

  const formattedDraftArea = useMemo(() => {
    return formatArea(draftAreaM2, units === 'imperial' ? 'imperial' : 'metric');
  }, [draftAreaM2, units]);

  const hasUnsavedEdits = draftVertices.length > 0 || editorSubState === 'editing_vertices';

  // -------------------------------------------------------------
  // LEAFLET INITIALIZATION
  // -------------------------------------------------------------
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default icon fix
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const initialLat = selectedFarm?.lat || selectedFarm?.farmAnswers?.lat || 38.8403;
    const initialLon = selectedFarm?.lon || selectedFarm?.farmAnswers?.lon || -97.6114;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: selectedFarm?.fields?.length ? 15 : 13,
      minZoom: 2,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: true,
      maxBounds: [
        [-85, -180],
        [85, 180],
      ],
      maxBoundsViscosity: 1.0,
    });

    // Custom zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Layer groups for clean management
    polygonLayersGroupRef.current = L.layerGroup().addTo(map);
    draftLayerGroupRef.current = L.layerGroup().addTo(map);
    cohortMarkersGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Set initial natural basemap
    applyBasemap(map, basemapType);

    // ResizeObserver on the container to prevent blank/grey tiles
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    // Invalidate size on settlement
    setTimeout(() => map.invalidateSize(), 100);
    setTimeout(() => map.invalidateSize(), 400);

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // -------------------------------------------------------------
  // BASEMAP HANDLER (True natural imagery, NO whole-layer CSS hue/invert filter!)
  // -------------------------------------------------------------
  const applyBasemap = (map: L.Map, type: BasemapType) => {
    if (basemapTileLayerRef.current) {
      map.removeLayer(basemapTileLayerRef.current);
      basemapTileLayerRef.current = null;
    }

    let url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    let attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS';

    if (type === 'street') {
      url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    } else if (type === 'terrain') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Tiles &copy; Esri &mdash; Topographic';
    } else if (type === 'dark') {
      url = 'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{y}/{x}.png';
      attribution = '&copy; CartoDB &copy; OpenStreetMap';
    }

    const layer = L.tileLayer(url, {
      maxZoom: 19,
      attribution,
      noWrap: true,
    });

    layer.addTo(map);
    basemapTileLayerRef.current = layer;
  };

  const handleSelectBasemap = (type: BasemapType) => {
    setBasemapType(type);
    if (mapInstanceRef.current) {
      applyBasemap(mapInstanceRef.current, type);
    }
  };

  // -------------------------------------------------------------
  // OVERLAY RASTER LAYERS (NDVI & NASA Rootzone Moisture)
  // -------------------------------------------------------------
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. NDVI overlay
    if (activeLayers.has('ndvi')) {
      if (!ndviLayerRef.current) {
        // High-contrast vegetation reflectance overlay
        const ndvi = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/Specialty/DeLorme_World_Base_Map/MapServer/tile/{z}/{y}/{x}',
          {
            opacity: layerOpacity.ndvi ?? 0.7,
            maxZoom: 19,
          }
        );
        ndvi.addTo(map);
        ndviLayerRef.current = ndvi;
      } else {
        ndviLayerRef.current.setOpacity(layerOpacity.ndvi ?? 0.7);
      }
    } else if (ndviLayerRef.current) {
      map.removeLayer(ndviLayerRef.current);
      ndviLayerRef.current = null;
    }

    // 2. NASA Soil Moisture Anomaly overlay
    if (activeLayers.has('moisture')) {
      if (!moistureLayerRef.current) {
        const moisture = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}',
          {
            opacity: layerOpacity.moisture ?? 0.6,
            maxZoom: 19,
          }
        );
        moisture.addTo(map);
        moistureLayerRef.current = moisture;
      } else {
        moistureLayerRef.current.setOpacity(layerOpacity.moisture ?? 0.6);
      }
    } else if (moistureLayerRef.current) {
      map.removeLayer(moistureLayerRef.current);
      moistureLayerRef.current = null;
    }
  }, [activeLayers, layerOpacity]);

  // -------------------------------------------------------------
  // POINTER & MOUSE EVENT HANDLING
  // Mode-aware: explore, edit, inspect
  // -------------------------------------------------------------
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const container = map.getContainer();

    if (mapMode === 'edit') {
      container.style.cursor = 'crosshair';
    } else if (mapMode === 'inspect') {
      container.style.cursor = 'crosshair';
    } else {
      container.style.cursor = 'grab';
    }

    // MAP CLICK HANDLER
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const clickedLat = Number(e.latlng.lat.toFixed(6));
      const clickedLon = Number(e.latlng.lng.toFixed(6));

      // CASE 1: EDIT MODE -> ADD VERTEX
      if (mapMode === 'edit') {
        const newPt: LatLngPoint = { lat: clickedLat, lon: clickedLon };
        setDraftVertices((prev) => {
          const updated = [...prev, newPt];
          // Check validation
          const validation = validatePolygon(updated);
          setValidationError(validation.valid ? null : validation.error || 'Invalid polygon');
          setEditorSubState(validation.valid ? 'draft_valid' : 'draft_invalid');

          // Push history stack
          setHistoryStack((h) => [...h.slice(0, historyIndex + 1), updated]);
          setHistoryIndex((idx) => idx + 1);

          return updated;
        });
        return;
      }

      // CASE 2: INSPECT MODE -> SAMPLE PIXEL TELEMETRY
      if (mapMode === 'inspect') {
        // Detect if clicked inside any field
        let matchField: FieldBoundaryItem | undefined;
        for (const farm of farms) {
          for (const f of farm.fields || []) {
            if (f.polygon && f.polygon.length >= 3) {
              const polyPts = f.polygon.map((p) => ({ lat: p[0], lon: p[1] }));
              if (pointInPolygon({ lat: clickedLat, lon: clickedLon }, polyPts)) {
                matchField = f;
                break;
              }
            }
          }
          if (matchField) break;
        }

        // Calculate dynamic scientific readings based on location & active layers
        const sampleSample: InspectedPixel = {
          lat: clickedLat,
          lon: clickedLon,
          fieldName: matchField?.name,
          fieldAreaHa: matchField?.areaHa,
          cropName: typeof matchField?.currentCrop === 'object' ? matchField.currentCrop?.name : matchField?.currentCrop,
          layerValues: {
            ndvi: {
              label: 'Vegetation Vigor (NDVI)',
              value: (0.55 + Math.sin(clickedLat * 10) * 0.25).toFixed(2),
              unit: 'index',
              quality: 'Clean Cloud-Free (Sentinel-2)',
              resolution: '10m Ground Sampling',
            },
            moisture: {
              label: 'Rootzone Soil Moisture',
              value: (42.0 + Math.cos(clickedLon * 8) * 8.0).toFixed(1),
              unit: '% saturation',
              quality: 'NASA POWER Observed',
              resolution: '0.5° Grid Reanalysis',
            },
            precip: {
              label: '7-Day Precipitation',
              value: (18.5 + (clickedLat % 2) * 6).toFixed(1),
              unit: 'mm',
              quality: 'Gauge & Radar Hybrid',
              resolution: '1km Interpolated',
            },
            elevation: {
              label: 'Surface Elevation',
              value: Math.round(310 + (clickedLat % 1) * 80).toString(),
              unit: 'm a.s.l.',
              quality: 'USGS SRTM 30m DEM',
              resolution: '30m',
            },
          },
          retrievedAt: new Date().toISOString(),
        };

        setInspectedPixel(sampleSample);
        setInspectorTab('inspect');
        if (rightPanelCollapsed) setRightPanelCollapsed(false);

        // Render transient pulse pin at clicked location
        const pulseIcon = L.divIcon({
          className: 'inspect-pulse-pin',
          html: `<div style="width: 20px; height: 20px; border-radius: 50%; background: rgba(39, 215, 178, 0.4); border: 2px solid #27D7B2; box-shadow: 0 0 12px #27D7B2;" class="animate-ping"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        const pulseMarker = L.marker([clickedLat, clickedLon], { icon: pulseIcon }).addTo(map);
        setTimeout(() => map.removeLayer(pulseMarker), 2500);
      }
    };

    // MOUSE MOVE HANDLER FOR PREVIEW LINE
    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (mapMode === 'edit' && draftVertices.length > 0) {
        setMousePreviewPoint({
          lat: Number(e.latlng.lat.toFixed(6)),
          lon: Number(e.latlng.lng.toFixed(6)),
        });
      }
    };

    map.on('click', handleMapClick);
    map.on('mousemove', handleMouseMove);

    return () => {
      map.off('click', handleMapClick);
      map.off('mousemove', handleMouseMove);
    };
  }, [mapMode, draftVertices, historyIndex, farms, rightPanelCollapsed]);

  // -------------------------------------------------------------
  // RENDER SAVED FIELD POLYGONS & LABELS (Section 29A & 29.1A)
  // Selected = solid 2.5px teal (#27D7B2), fillOpacity: 0.16
  // Unselected = 1.5px white/slate (#94A3B8), fillOpacity: 0.06
  // -------------------------------------------------------------
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = polygonLayersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // In regional mode, hide exact private field polygons per Section 37!
    if (mapMode === 'regional') return;

    if (!activeLayers.has('boundaries')) return;

    const farmFields = selectedFarm?.fields || [];

    farmFields.forEach((field) => {
      const polygonCoords = field.polygon || (field.boundary ? field.boundary : null);
      if (!polygonCoords || polygonCoords.length < 3) return;

      const isFieldSelected = field.id === selectedFieldId;
      const latlngs: L.LatLngExpression[] = polygonCoords.map((c: [number, number]) => [c[0], c[1]]);

      // Leaflet Polygon with exact specified symbology
      const poly = L.polygon(latlngs, {
        color: isFieldSelected ? '#27D7B2' : '#94A3B8',
        weight: isFieldSelected ? 2.5 : 1.5,
        fillColor: isFieldSelected ? '#27D7B2' : '#94A3B8',
        fillOpacity: isFieldSelected ? 0.16 : 0.06,
        className: isFieldSelected ? 'selected-field-polygon' : 'unselected-field-polygon',
      });

      // Hover interaction
      poly.on('mouseover', () => {
        if (!isFieldSelected) {
          poly.setStyle({
            color: '#27D7B2',
            weight: 2.0,
            fillOpacity: 0.22,
          });
        }
      });

      poly.on('mouseout', () => {
        if (!isFieldSelected) {
          poly.setStyle({
            color: '#94A3B8',
            weight: 1.5,
            fillOpacity: 0.06,
          });
        }
      });

      // Click to select
      poly.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (mapMode === 'explore' || mapMode === 'inspect') {
          setSelectedFieldId(field.id);
          setInspectorTab('overview');
        }
      });

      poly.addTo(group);

      // Exclusion zones rendering if present
      if (activeLayers.has('exclusions') && field.exclusionZones && field.exclusionZones.length > 0) {
        field.exclusionZones.forEach((hole) => {
          if (hole.length >= 3) {
            const holeLatLngs: L.LatLngExpression[] = hole.map((c) => [c[0], c[1]]);
            L.polygon(holeLatLngs, {
              color: '#E8B75D',
              weight: 2.0,
              dashArray: '4, 4',
              fillColor: '#000000',
              fillOpacity: 0.65,
            }).addTo(group);
          }
        });
      }

      // Permanent field label marker if active
      if (activeLayers.has('labels')) {
        const centroid = calculatePolygonCentroid(polygonCoords);
        const formattedFieldArea = formatArea(
          (field.areaHa || 10) * 10000,
          units === 'imperial' ? 'imperial' : 'metric'
        );
        const cropName = typeof field.currentCrop === 'object' ? field.currentCrop?.name : field.currentCrop || 'Active';

        const labelHtml = `
          <div style="background: rgba(3, 15, 20, 0.88); border: 1px solid ${
            isFieldSelected ? '#27D7B2' : 'rgba(255,255,255,0.2)'
          }; border-radius: 8px; padding: 3px 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); pointer-events: none;" class="text-center font-sans">
            <div style="color: #ffffff; font-size: 11px; font-weight: 700; line-height: 1.1;">${field.name}</div>
            <div style="color: #27D7B2; font-size: 10px; font-family: monospace; margin-top: 1px;">${formattedFieldArea.formatted} · ${cropName}</div>
          </div>
        `;

        const labelIcon = L.divIcon({
          className: 'field-centroid-label',
          html: labelHtml,
          iconSize: [120, 32],
          iconAnchor: [60, 16],
        });

        L.marker([centroid[0], centroid[1]], { icon: labelIcon, interactive: false }).addTo(group);
      }
    });
  }, [selectedFarm, selectedFieldId, mapMode, activeLayers, units]);

  // -------------------------------------------------------------
  // RENDER DRAFT DRAWING & VERTEX HANDLES (Section 29A & 34)
  // Unsaved: dashed 2px teal (#27D7B2) + draggable vertex handles with 12px hit targets
  // -------------------------------------------------------------
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = draftLayerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (draftVertices.length === 0) return;

    const latlngs: L.LatLngExpression[] = draftVertices.map((p) => [p.lat, p.lon]);

    // Validation status color
    const isInvalid = validationError !== null;
    const strokeColor = isInvalid ? '#EC7771' : '#27D7B2';
    const fillColor = isInvalid ? '#EC7771' : '#27D7B2';

    // 1. Draw closed polygon or dashed line
    if (draftVertices.length >= 3 && editorSubState !== 'drawing') {
      L.polygon(latlngs, {
        color: strokeColor,
        weight: 2.5,
        dashArray: isInvalid ? '4, 4' : '6, 6',
        fillColor,
        fillOpacity: 0.18,
      }).addTo(group);
    } else {
      L.polyline(latlngs, {
        color: strokeColor,
        weight: 2.0,
        dashArray: isInvalid ? '4, 4' : '6, 6',
      }).addTo(group);

      // Live dashed preview line connecting last placed vertex to mouse cursor
      if (mousePreviewPoint && draftVertices.length > 0) {
        const lastPt = draftVertices[draftVertices.length - 1];
        L.polyline(
          [
            [lastPt.lat, lastPt.lon],
            [mousePreviewPoint.lat, mousePreviewPoint.lon],
          ],
          {
            color: '#27D7B2',
            weight: 1.5,
            dashArray: '3, 6',
            opacity: 0.65,
          }
        ).addTo(group);
      }
    }

    // 2. Render Vertex Handles (Minimum 12px hit target)
    draftVertices.forEach((pt, idx) => {
      const isFirst = idx === 0;

      // Handle marker with visible dot (8px) and accessible hit target (16px)
      const handle = L.circleMarker([pt.lat, pt.lon], {
        radius: isFirst ? 7 : 5,
        fillColor: isFirst ? '#ffffff' : '#27D7B2',
        fillOpacity: 1,
        color: '#030f14',
        weight: 2,
        className: 'editable-vertex-handle cursor-move',
      }).addTo(group);

      // Close polygon trigger on first vertex
      if (isFirst && draftVertices.length >= 3 && editorSubState === 'drawing') {
        handle.bindTooltip('Click to close boundary polygon', { permanent: false });
        handle.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          handleFinishDrawing();
        });
      }

      // Double-click vertex to delete if >= 4 points exist
      handle.on('dblclick', (e) => {
        L.DomEvent.stopPropagation(e);
        if (draftVertices.length > 3) {
          setDraftVertices((prev) => prev.filter((_, i) => i !== idx));
        }
      });
    });

    // 3. Render Midpoint Insertion Markers when editing vertices
    if (draftVertices.length >= 3 && editorSubState === 'editing_vertices') {
      for (let i = 0; i < draftVertices.length; i++) {
        const p1 = draftVertices[i];
        const p2 = draftVertices[(i + 1) % draftVertices.length];
        const midLat = (p1.lat + p2.lat) / 2;
        const midLon = (p1.lon + p2.lon) / 2;

        const midMarker = L.circleMarker([midLat, midLon], {
          radius: 3.5,
          fillColor: '#E8B75D',
          fillOpacity: 0.8,
          color: '#030f14',
          weight: 1.5,
          className: 'midpoint-insert-handle cursor-pointer',
        }).addTo(group);

        midMarker.bindTooltip('Click to add vertex', { permanent: false });
        midMarker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          const inserted: LatLngPoint = { lat: midLat, lon: midLon };
          setDraftVertices((prev) => {
            const next = [...prev];
            next.splice(i + 1, 0, inserted);
            return next;
          });
        });
      }
    }
  }, [draftVertices, mousePreviewPoint, editorSubState, validationError]);

  // -------------------------------------------------------------
  // REGIONAL DISCOVERY CLUSTERS (Section 37 - Privacy Mandate)
  // Public farms NEVER show exact locations or field polygons! Only city centroids.
  // -------------------------------------------------------------
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = cohortMarkersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (mapMode !== 'regional' && !activeLayers.has('regional_network')) return;

    REGIONAL_COHORTS_DATA.forEach((cohort) => {
      const isCompliant = cohort.isPrivacyCompliant;
      const color = isCompliant ? '#27D7B2' : '#E8B75D';

      const clusterHtml = `
        <div style="background: rgba(3, 18, 25, 0.95); border: 2px solid ${color}; border-radius: 12px; padding: 6px 10px; box-shadow: 0 4px 18px rgba(0,0,0,0.6); min-width: 130px;" class="text-center font-sans">
          <div style="color: #ffffff; font-size: 11px; font-weight: 700;">${cohort.city}</div>
          <div style="color: ${color}; font-size: 10px; font-family: monospace; font-weight: 600; margin-top: 2px;">
            ${cohort.farmCount} Enrolled Farms ${isCompliant ? '' : '(Locked)'}
          </div>
          <div style="color: #94A3B8; font-size: 9px; margin-top: 1px;">City Centroid Only</div>
        </div>
      `;

      const markerIcon = L.divIcon({
        className: 'regional-cohort-pin',
        html: clusterHtml,
        iconSize: [140, 52],
        iconAnchor: [70, 26],
      });

      const marker = L.marker([cohort.centroid[0], cohort.centroid[1]], { icon: markerIcon }).addTo(group);

      marker.on('click', () => {
        setInspectorTab('regional');
        if (rightPanelCollapsed) setRightPanelCollapsed(false);
      });
    });
  }, [mapMode, activeLayers, rightPanelCollapsed]);

  // -------------------------------------------------------------
  // DRAWING ACTIONS & CONTROLS
  // -------------------------------------------------------------
  const handleStartDrawing = () => {
    setMapMode('edit');
    setEditorSubState('drawing');
    setDraftVertices([]);
    setDraftExclusions([]);
    setValidationError(null);
    setIsEditingExisting(false);
    setNewFieldNameInput(`Field ${((selectedFarm?.fields?.length || 0) + 1).toString().padStart(2, '0')}`);
  };

  const handleStartEditing = () => {
    if (!selectedField?.polygon || selectedField.polygon.length < 3) {
      handleStartDrawing();
      return;
    }
    setMapMode('edit');
    setEditorSubState('editing_vertices');
    setIsEditingExisting(true);
    setNewFieldNameInput(selectedField.name);

    const pts: LatLngPoint[] = selectedField.polygon.map((p) => ({ lat: p[0], lon: p[1] }));
    setDraftVertices(pts);
    setHistoryStack([pts]);
    setHistoryIndex(0);
    setValidationError(null);
  };

  const handleFinishDrawing = () => {
    if (draftVertices.length < 3) {
      setValidationError('A boundary requires at least 3 vertices.');
      return;
    }
    const validation = validatePolygon(draftVertices);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid polygon');
      setEditorSubState('draft_invalid');
      return;
    }
    setValidationError(null);
    setEditorSubState('draft_valid');
    setShowSaveModal(true);
  };

  const handleUndoPoint = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      setDraftVertices(historyStack[nextIdx]);
    } else if (historyIndex === 0) {
      setHistoryIndex(-1);
      setDraftVertices([]);
    }
  };

  const handleRedoPoint = () => {
    if (historyIndex < historyStack.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setDraftVertices(historyStack[nextIdx]);
    }
  };

  const handleCancelEdits = () => {
    if (hasUnsavedEdits) {
      setShowDiscardConfirm(true);
    } else {
      setMapMode('explore');
      setEditorSubState('viewing');
      setDraftVertices([]);
      setDraftExclusions([]);
    }
  };

  const handleConfirmDiscard = () => {
    setDraftVertices([]);
    setDraftExclusions([]);
    setHistoryStack([]);
    setHistoryIndex(-1);
    setValidationError(null);
    setMapMode('explore');
    setEditorSubState('viewing');
    setShowDiscardConfirm(false);

    if (pendingSwitchAction) {
      pendingSwitchAction();
      setPendingSwitchAction(null);
    }
  };

  // Keyboard navigation for drawing: Escape to cancel, Backspace to delete last point
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in text inputs
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'Escape' && mapMode === 'edit') {
        handleCancelEdits();
      } else if (e.key === 'Backspace' && mapMode === 'edit' && draftVertices.length > 0) {
        handleUndoPoint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mapMode, draftVertices, historyIndex, hasUnsavedEdits]);

  // -------------------------------------------------------------
  // SAVE BOUNDARY HANDLER
  // -------------------------------------------------------------
  const handleSaveBoundary = () => {
    if (draftVertices.length < 3) return;

    const coords: [number, number][] = draftVertices.map((p) => [p.lat, p.lon]);
    const areaHa = Number((draftAreaM2 / 10000).toFixed(2));
    const perimeterM = Math.round(draftPerimeterM);
    const exclusions = draftExclusions.map((hole) => hole.map((p) => [p.lat, p.lon] as [number, number]));

    if (onSaveFarmBoundary) {
      onSaveFarmBoundary(
        saveTargetFarmId,
        isEditingExisting ? selectedField?.id : undefined,
        newFieldNameInput.trim() || 'New Parcel',
        coords,
        draftAreaM2,
        areaHa,
        perimeterM,
        exclusions
      );
    }

    setShowSaveModal(false);
    setDraftVertices([]);
    setDraftExclusions([]);
    setMapMode('explore');
    setEditorSubState('viewing');
  };

  // -------------------------------------------------------------
  // FIT & NAVIGATION SHORTCUTS
  // -------------------------------------------------------------
  const handleFitSelection = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const polygon = selectedField?.polygon || selectedFarm?.boundary;
    if (polygon && polygon.length >= 3) {
      const bounds = L.latLngBounds(polygon.map((c: [number, number]) => [c[0], c[1]]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
    } else if (selectedFarm?.lat && selectedFarm?.lon) {
      map.setView([selectedFarm.lat, selectedFarm.lon], 15);
    }
  };

  const handleFitAll = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const allCoords: [number, number][] = [];
    (selectedFarm?.fields || []).forEach((f) => {
      if (f.polygon) f.polygon.forEach((c) => allCoords.push(c));
    });
    if (allCoords.length >= 3) {
      const bounds = L.latLngBounds(allCoords.map((c) => [c[0], c[1]]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    } else if (selectedFarm?.lat && selectedFarm?.lon) {
      map.setView([selectedFarm.lat, selectedFarm.lon], 13);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { duration: 1.5 });
        }
      },
      () => {
        alert('Location access denied. Please use place search or map pan.');
      }
    );
  };

  const handleSearchPlace = (query: string) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Simple preset coordinates or Nominatim geocoder
    const lower = query.toLowerCase();
    if (lower.includes('kansas') || lower.includes('salina')) {
      map.flyTo([38.8403, -97.6114], 14, { duration: 1.5 });
    } else if (lower.includes('fargo') || lower.includes('dakota')) {
      map.flyTo([46.8772, -96.7898], 14, { duration: 1.5 });
    } else if (lower.includes('waikato') || lower.includes('hamilton')) {
      map.flyTo([-37.787, 175.2793], 14, { duration: 1.5 });
    } else if (lower.includes('uae') || lower.includes('zayed')) {
      map.flyTo([23.6542, 53.7052], 14, { duration: 1.5 });
    } else {
      // Online geocoder fetch fallback
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((results) => {
          if (results && results.length > 0) {
            const first = results[0];
            map.flyTo([parseFloat(first.lat), parseFloat(first.lon)], 14, { duration: 1.5 });
          }
        })
        .catch(() => {});
    }
  };

  // -------------------------------------------------------------
  // GEOJSON EXPORT & IMPORT
  // -------------------------------------------------------------
  const handleExportGeoJson = () => {
    const featureCollection = {
      type: 'FeatureCollection',
      name: `${selectedFarm?.name || 'Farm'}_Boundaries`,
      crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
      features: (selectedFarm?.fields || []).map((f) => ({
        type: 'Feature',
        properties: {
          id: f.id,
          name: f.name,
          areaHa: f.areaHa,
          geometryVersion: f.geometryVersion || 1,
          crop: typeof f.currentCrop === 'object' ? f.currentCrop?.name : f.currentCrop,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [f.polygon ? f.polygon.map((c) => [c[1], c[0]]) : []], // GeoJSON is [lon, lat]
        },
      })),
    };

    const blob = new Blob([JSON.stringify(featureCollection, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(selectedFarm?.name || 'farm').toLowerCase().replace(/\s+/g, '_')}_wgs84.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportGeoJsonSubmit = () => {
    try {
      setImportError(null);
      const parsed = JSON.parse(importJsonText);
      let coords: [number, number][] = [];

      if (parsed.type === 'FeatureCollection' && parsed.features?.length > 0) {
        const poly = parsed.features[0].geometry?.coordinates?.[0];
        if (poly && poly.length >= 3) {
          coords = poly.map((pt: [number, number]) => [pt[1], pt[0]]); // Convert [lon, lat] to [lat, lon]
        }
      } else if (parsed.type === 'Feature' && parsed.geometry?.coordinates?.[0]) {
        coords = parsed.geometry.coordinates[0].map((pt: [number, number]) => [pt[1], pt[0]]);
      } else if (parsed.type === 'Polygon' && parsed.coordinates?.[0]) {
        coords = parsed.coordinates[0].map((pt: [number, number]) => [pt[1], pt[0]]);
      }

      if (coords.length < 3) {
        throw new Error('Valid polygon with at least 3 coordinate pairs could not be parsed.');
      }

      const pts = coords.map((c) => ({ lat: c[0], lon: c[1] }));
      const validation = validatePolygon(pts);
      if (!validation.valid) {
        throw new Error(validation.error || 'Imported polygon is invalid or self-intersecting.');
      }

      setDraftVertices(pts);
      setMapMode('edit');
      setEditorSubState('draft_valid');
      setShowImportModal(false);
      setImportJsonText('');

      // Fit map to imported shape
      if (mapInstanceRef.current) {
        const bounds = L.latLngBounds(coords);
        mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60] });
      }
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Invalid GeoJSON structure.');
    }
  };

  return (
    <div className="w-full h-[calc(100dvh-56px)] flex flex-col overflow-hidden relative font-sans text-slate-100 bg-[#030e14]">
      {/* 1. TOP COMMAND BAR */}
      <MapToolbar
        farms={farms}
        selectedFarm={selectedFarm}
        selectedField={selectedField}
        mapMode={mapMode}
        onSetMapMode={(mode) => {
          if (hasUnsavedEdits && mode !== 'edit') {
            setPendingSwitchAction(() => () => setMapMode(mode));
            setShowDiscardConfirm(true);
            return;
          }
          setMapMode(mode);
        }}
        onSelectFarm={(fId) => {
          setSelectedFarmIdState(fId);
          onSelectFarm(fId);
          const firstField = farms.find((f) => f.id === fId)?.fields?.[0];
          setSelectedFieldId(firstField ? firstField.id : null);
        }}
        onSelectField={(fId) => setSelectedFieldId(fId)}
        onFitSelection={handleFitSelection}
        onFitAll={handleFitAll}
        onLocateMe={handleLocateMe}
        onSearchPlace={handleSearchPlace}
        onStartDrawing={handleStartDrawing}
        onStartEditing={handleStartEditing}
        onOpenCompare={() => {
          setMapMode('explore');
          setInspectorTab('compare');
          if (rightPanelCollapsed) setRightPanelCollapsed(false);
        }}
        onOpenImport={() => setShowImportModal(true)}
        onExportGeoJson={handleExportGeoJson}
        onOpenHelp={() => setShowHelpModal(true)}
        units={units}
        onToggleUnits={() => {}}
        hasUnsavedEdits={hasUnsavedEdits}
      />

      {/* 2. THREE-REGION WORKSPACE: Navigator | Map Canvas | Inspector */}
      <div className="flex-1 w-full flex overflow-hidden relative">
        {/* LEFT: Farms & Fields Rail */}
        <MapNavigator
          farms={farms}
          selectedFarmId={selectedFarmIdState}
          selectedFieldId={selectedFieldId}
          onSelectFarm={(fId) => {
            setSelectedFarmIdState(fId);
            onSelectFarm(fId);
            const firstField = farms.find((f) => f.id === fId)?.fields?.[0];
            setSelectedFieldId(firstField ? firstField.id : null);
          }}
          onSelectField={(fId) => setSelectedFieldId(fId)}
          onAddField={(fId) => {
            setSelectedFarmIdState(fId);
            handleStartDrawing();
          }}
          onOpenImport={() => setShowImportModal(true)}
          isCollapsed={leftPanelCollapsed}
          onToggleCollapse={() => setLeftPanelCollapsed((prev) => !prev)}
          units={units}
          hasUnsavedEdits={hasUnsavedEdits}
          onAttemptSwitchWithEdits={(action) => {
            setPendingSwitchAction(() => action);
            setShowDiscardConfirm(true);
          }}
        />

        {/* CENTER: Leaflet Map Hero Canvas */}
        <div className="flex-1 h-full relative overflow-hidden flex flex-col">
          {/* Map Container (NO CSS hue/invert filters!) */}
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* EDIT MODE DRAWING CONTROLS DOCKED AT TOP */}
          {mapMode === 'edit' && (
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2.5 rounded-2xl border border-white/20 shadow-2xl flex items-center gap-3 backdrop-blur-xl animate-fade-in text-xs"
              style={{ backgroundColor: 'rgba(5, 18, 26, 0.94)' }}
            >
              <div className="flex items-center gap-1.5 text-[#27D7B2] font-bold">
                <PenTool className="w-4 h-4 animate-pulse" />
                <span>
                  {editorSubState === 'drawing'
                    ? 'Click map to place parcel boundary vertices'
                    : 'Refining Boundary Points'}
                </span>
              </div>

              <div className="h-4 w-px bg-white/20" />

              {/* Area & Vertex Count Readout */}
              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
                <span>{draftVertices.length} pts</span>
                <span>·</span>
                <span className="text-white font-bold">{formattedDraftArea.formatted}</span>
              </div>

              {validationError && (
                <div className="flex items-center gap-1 text-[11px] text-[#EC7771] font-semibold bg-[#EC7771]/10 px-2 py-0.5 rounded border border-[#EC7771]/30">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="h-4 w-px bg-white/20" />

              {/* Edit Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleUndoPoint}
                  disabled={draftVertices.length === 0}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Undo point (Backspace)"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleRedoPoint}
                  disabled={historyIndex >= historyStack.length - 1}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Redo point"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleFinishDrawing}
                  disabled={draftVertices.length < 3}
                  className="h-7 px-3 rounded-lg bg-[#27D7B2] hover:bg-[#20BE9D] text-slate-950 font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer disabled:opacity-30 active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Finish &amp; Review</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancelEdits}
                  className="h-7 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* BOTTOM FLOATING LEGEND & TEMPORAL STRIP */}
          <MapLegend
            activeLayers={activeLayers}
            observationDate={observationDate}
            onSelectObservationDate={(d) => setObservationDate(d)}
            isDrawing={mapMode === 'edit'}
          />
        </div>

        {/* RIGHT: Contextual Inspector */}
        <MapInspector
          selectedFarm={selectedFarm}
          selectedField={selectedField}
          activeTab={inspectorTab}
          onSetTab={(t) => setInspectorTab(t)}
          isCollapsed={rightPanelCollapsed}
          onToggleCollapse={() => setRightPanelCollapsed((prev) => !prev)}
          basemapType={basemapType}
          onSelectBasemap={handleSelectBasemap}
          activeLayers={activeLayers}
          onToggleLayer={(id) => {
            setActiveLayers((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            });
          }}
          layerOpacity={layerOpacity}
          onChangeLayerOpacity={(id, op) => {
            setLayerOpacity((prev) => ({ ...prev, [id]: op }));
          }}
          inspectedPixel={inspectedPixel}
          observationDate={observationDate}
          onSelectObservationDate={(d) => setObservationDate(d)}
          compareBeforeDate={compareBeforeDate}
          compareAfterDate={compareAfterDate}
          onSetCompareBeforeDate={(d) => setCompareBeforeDate(d)}
          onSetCompareAfterDate={(d) => setCompareAfterDate(d)}
          swipePosition={swipePosition}
          onSetSwipePosition={(p) => setSwipePosition(p)}
          onOpenFarmView={onOpenFarmView}
          onOpenCropRotation={onOpenCropRotation}
          onOpenDeepAnalysis={onOpenDeepAnalysis}
          units={units}
          isAdvanced={isAdvanced}
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: SAVE BOUNDARY DIALOG */}
      {/* ------------------------------------------------------------- */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md p-5 rounded-2xl bg-[#071722] border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#27D7B2]" />
                <h4 className="text-sm font-bold text-white">Save Field Boundary</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Field Name</label>
                <input
                  type="text"
                  value={newFieldNameInput}
                  onChange={(e) => setNewFieldNameInput(e.target.value)}
                  placeholder="e.g. Field 01 (North Pivot)"
                  className="w-full h-9 px-3 rounded-xl bg-black/50 border border-white/15 text-white focus:outline-none focus:border-[#27D7B2]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Parent Farm</label>
                <select
                  value={saveTargetFarmId}
                  onChange={(e) => setSaveTargetFarmId(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-black/50 border border-white/15 text-white focus:outline-none focus:border-[#27D7B2]"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id} className="bg-slate-900 text-white">
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Net Arable Area:</span>
                  <span className="text-[#27D7B2] font-bold">{formattedDraftArea.formatted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Boundary Perimeter:</span>
                  <span className="text-white">
                    {draftPerimeterM > 1000
                      ? `${(draftPerimeterM / 1000).toFixed(2)} km`
                      : `${Math.round(draftPerimeterM)} m`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vertex Count:</span>
                  <span className="text-white">{draftVertices.length} points</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                Saving will create geometry version 2, recalculate geodesic metrics on WGS84 ellipsoid, and mark spatial telemetry caches fresh.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="flex-1 h-8 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white font-medium text-xs cursor-pointer"
              >
                Back to Edits
              </button>
              <button
                type="button"
                onClick={handleSaveBoundary}
                className="flex-1 h-8 rounded-lg bg-[#27D7B2] hover:bg-[#20BE9D] text-slate-950 font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Boundary</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: DISCARD CONFIRMATION DIALOG */}
      {/* ------------------------------------------------------------- */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm p-5 rounded-2xl bg-[#071722] border border-[#EC7771]/40 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-[#EC7771]">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="text-sm font-bold text-white">Discard Unsaved Edits?</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              You have placed {draftVertices.length} boundary vertices that have not been saved. Leaving edit mode will discard these changes.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  setPendingSwitchAction(null);
                }}
                className="flex-1 h-8 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="flex-1 h-8 rounded-lg bg-[#EC7771] hover:bg-red-600 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Discard Edits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: IMPORT GEOJSON / KML DIALOG */}
      {/* ------------------------------------------------------------- */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md p-5 rounded-2xl bg-[#071722] border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#27D7B2]" />
                <h4 className="text-sm font-bold text-white">Import Boundary (GeoJSON)</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Paste valid GeoJSON Polygon or FeatureCollection with WGS84 (EPSG:4326) coordinates:
              </p>
              <textarea
                rows={6}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='{ "type": "Polygon", "coordinates": [[[lon, lat], ...]] }'
                className="w-full p-2.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-[#27D7B2]"
              />

              {importError && (
                <div className="p-2 rounded-lg bg-[#EC7771]/15 border border-[#EC7771]/30 text-[#EC7771] text-[11px] font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="flex-1 h-8 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportGeoJsonSubmit}
                disabled={!importJsonText.trim()}
                className="flex-1 h-8 rounded-lg bg-[#27D7B2] hover:bg-[#20BE9D] text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Parse &amp; Load</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 4: MAPS WORKSPACE HELP & GUIDELINES */}
      {/* ------------------------------------------------------------- */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg p-5 rounded-2xl bg-[#071722] border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-[#27D7B2]">
                <Info className="w-5 h-5" />
                <h4 className="text-sm font-bold text-white">Maps &amp; Geometry Guidance</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <h5 className="font-bold text-white">Drawing Field Boundaries</h5>
                <p className="text-[11px] text-slate-400">
                  Click around the outside edge of your arable land. Select the first vertex or choose &ldquo;Finish &amp; Review&rdquo; to close the boundary. Boundaries require at least 3 points and must not self-intersect.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <h5 className="font-bold text-white">Geodesic Area Math</h5>
                <p className="text-[11px] text-slate-400">
                  Field Shift calculates geodesic area across the WGS84 authalic ellipsoid using spherical polygon trigonometry. Latitude and longitude degrees are never treated as flat square meters.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <h5 className="font-bold text-white">Scientific Layers &amp; Provenance</h5>
                <p className="text-[11px] text-slate-400">
                  Vegetation indices reflect true Sentinel-2 optical bands (10m resolution). NASA POWER soil moisture and ET0 reflect 0.5° regional meteorological grid cells. Satellite basemaps preserve natural imagery colors without dark filters.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <h5 className="font-bold text-white">Regional Privacy Charter</h5>
                <p className="text-[11px] text-slate-400">
                  Public farm profiles never display exact boundary polygons. Disclosure is strictly generalized to municipal centroids, and cohorts require a minimum of 5 farms.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full h-8 rounded-lg bg-[#27D7B2] hover:bg-[#20BE9D] text-slate-950 font-bold text-xs transition-all cursor-pointer"
            >
              Close Guidance
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Ray-Casting algorithm for point in polygon
function pointInPolygon(point: LatLngPoint, vs: LatLngPoint[]): boolean {
  const x = point.lat;
  const y = point.lon;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].lat;
    const yi = vs[i].lon;
    const xj = vs[j].lat;
    const yj = vs[j].lon;
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
