import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Layers, 
  Map as MapIcon, 
  Undo, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Maximize2
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';

interface FarmBoundaryDrawerProps {
  initialBoundary?: {
    type: 'Polygon';
    coordinates: number[][][]; // [ [ [lng, lat], ... ] ]
  } | null;
  initialCenter: { lat: number; lng: number };
  onBoundaryChange: (data: {
    boundary: { type: 'Polygon'; coordinates: number[][][] } | null;
    areaAcres: number;
    center: { lat: number; lng: number };
  }) => void;
}

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ESRI_SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

export const FarmBoundaryDrawer: React.FC<FarmBoundaryDrawerProps> = ({
  initialBoundary,
  initialCenter,
  onBoundaryChange,
}) => {
  const { t } = useTranslation();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapType, setMapType] = useState<'street' | 'satellite'>('satellite'); // Satellite preferred for farm outline
  const [points, setPoints] = useState<Array<[number, number]>>([]); // [lng, lat]
  const [calculatedArea, setCalculatedArea] = useState<number | null>(null);
  const [tileError, setTileError] = useState<boolean>(false);

  // Initialize points from existing boundary if available
  useEffect(() => {
    if (initialBoundary && initialBoundary.coordinates && initialBoundary.coordinates[0]) {
      const ring = initialBoundary.coordinates[0];
      // Exclude closing duplicated point if present
      const uniquePoints: Array<[number, number]> = [];
      for (let i = 0; i < ring.length; i++) {
        const pt = ring[i] as [number, number];
        if (i === ring.length - 1 && ring.length > 3) {
          const first = ring[0];
          if (pt[0] === first[0] && pt[1] === first[1]) {
            continue; // Skip closing point in internal state
          }
        }
        uniquePoints.push(pt);
      }
      setPoints(uniquePoints);
    }
  }, [initialBoundary]);

  // Recalculate area and centroid whenever points change
  useEffect(() => {
    if (points.length >= 3) {
      try {
        const closedRing = [...points, points[0]];
        const poly = turf.polygon([closedRing]);
        const areaSqM = turf.area(poly);
        const acres = Number((areaSqM * 0.000247105).toFixed(2));
        setCalculatedArea(acres);

        const centroid = turf.centroid(poly);
        const [cLng, cLat] = centroid.geometry.coordinates;

        onBoundaryChange({
          boundary: {
            type: 'Polygon',
            coordinates: [closedRing],
          },
          areaAcres: acres > 0 ? acres : 0.5,
          center: {
            lat: Number(cLat.toFixed(4)),
            lng: Number(cLng.toFixed(4)),
          },
        });
      } catch (err) {
        console.warn('[FarmBoundaryDrawer] Calculation error:', err);
      }
    } else {
      setCalculatedArea(null);
      if (points.length === 0) {
        onBoundaryChange({
          boundary: null,
          areaAcres: 0,
          center: initialCenter,
        });
      }
    }
  }, [points]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const startLat = initialCenter.lat || 20.5937;
      const startLng = initialCenter.lng || 78.9629;
      const startZoom = initialCenter.lat ? 15 : 6;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: false, // Custom attribution rendered in UI
      }).setView([startLat, startLng], startZoom);

      const tileLayer = L.tileLayer(ESRI_SATELLITE_URL, {
        maxZoom: 19,
      }).addTo(map);

      tileLayer.on('tileerror', () => {
        setTileError(true);
      });

      tileLayerRef.current = tileLayer;
      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Handle map clicks to add boundary corners
      map.on('click', (e: L.LeafletMouseEvent) => {
        const newLng = Number(e.latlng.lng.toFixed(6));
        const newLat = Number(e.latlng.lat.toFixed(6));
        setPoints((prev) => [...prev, [newLng, newLat]]);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch Tile Layer between Street and Satellite
  const handleSwitchMapType = (type: 'street' | 'satellite') => {
    setMapType(type);
    setTileError(false);
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    tileLayerRef.current.remove();
    const newUrl = type === 'street' ? OSM_TILE_URL : ESRI_SATELLITE_URL;
    const newLayer = L.tileLayer(newUrl, {
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    newLayer.on('tileerror', () => {
      setTileError(true);
    });

    tileLayerRef.current = newLayer;
  };

  // Render polygon and vertex markers whenever points or map change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    // Clear previous markers
    markersGroup.clearLayers();

    // Remove existing polygon layer if any
    if (polygonLayerRef.current) {
      polygonLayerRef.current.remove();
      polygonLayerRef.current = null;
    }

    if (points.length === 0) return;

    // Convert [lng, lat] to Leaflet [lat, lng]
    const latLngs = points.map((pt) => [pt[1], pt[0]] as [number, number]);

    // Draw vertex marker pins
    latLngs.forEach((latLng, idx) => {
      const isFirst = idx === 0;
      const vertexIcon = L.divIcon({
        className: 'agri-boundary-vertex',
        html: `
          <div style="width: 22px; height: 22px; border-radius: 50%; background: ${isFirst ? '#F59E0B' : '#1E4620'}; border: 2.5px solid #FFFFFF; color: #FFFFFF; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            ${idx + 1}
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker(latLng, { icon: vertexIcon });
      markersGroup.addLayer(marker);
    });

    // Draw polygon if 3 or more points, otherwise polyline
    if (latLngs.length >= 3) {
      const polygon = L.polygon(latLngs, {
        color: '#1E4620',
        weight: 3,
        fillColor: '#22c55e',
        fillOpacity: 0.25,
        dashArray: '4, 4',
      }).addTo(map);
      polygonLayerRef.current = polygon;
    } else if (latLngs.length === 2) {
      const line = L.polyline(latLngs, {
        color: '#1E4620',
        weight: 2.5,
        dashArray: '4, 4',
      }).addTo(map);
      polygonLayerRef.current = line as any;
    }
  }, [points]);

  // Undo last point
  const handleUndoPoint = () => {
    setPoints((prev) => prev.slice(0, -1));
  };

  // Clear all points
  const handleClearBoundary = () => {
    setPoints([]);
    setCalculatedArea(null);
  };

  // Generate Quick Sample Outline around initialCenter for testing/demo
  const handleGenerateSampleOutline = () => {
    const lat = initialCenter.lat || 20.5937;
    const lng = initialCenter.lng || 78.9629;
    const delta = 0.0015; // ~3.5 acres square

    const samplePoints: Array<[number, number]> = [
      [Number((lng - delta).toFixed(6)), Number((lat - delta).toFixed(6))],
      [Number((lng + delta).toFixed(6)), Number((lat - delta).toFixed(6))],
      [Number((lng + delta).toFixed(6)), Number((lat + delta).toFixed(6))],
      [Number((lng - delta).toFixed(6)), Number((lat + delta).toFixed(6))],
    ];

    setPoints(samplePoints);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16);
    }
  };

  return (
    <div className="space-y-3 bg-[#FBFBF9] p-4 rounded-2xl border border-stone-200">
      {/* Top Header & Layer Switch */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-[#1E4620]" />
            <span>{t('farm_boundary_title')}</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            {t('farm_boundary_desc')}
          </p>
        </div>

        {/* Street / Satellite Segmented Toggle */}
        <div className="inline-flex rounded-xl p-1 bg-stone-200/80 border border-stone-300/80">
          <button
            type="button"
            id="boundary-switch-street-btn"
            onClick={() => handleSwitchMapType('street')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              mapType === 'street'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5 text-[#1E4620]" />
            <span>{t('map_layer_street')}</span>
          </button>
          <button
            type="button"
            id="boundary-switch-satellite-btn"
            onClick={() => handleSwitchMapType('satellite')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              mapType === 'satellite'
                ? 'bg-[#1E4620] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-300" />
            <span>{t('map_layer_satellite')}</span>
          </button>
        </div>
      </div>

      {/* Tile Error Banner */}
      {tileError && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 text-xs p-2.5 rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{t('map_tile_error_msg')}</span>
          </div>
          <button
            type="button"
            onClick={() => setTileError(false)}
            className="text-[11px] font-bold text-amber-800 hover:underline"
          >
            {t('map_tile_error_dismiss')}
          </button>
        </div>
      )}

      {/* Map Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-stone-300 shadow-inner bg-stone-100">
        <div
          ref={mapContainerRef}
          id="farm-boundary-drawer-map"
          className="w-full h-64 sm:h-72 z-10"
          style={{ minHeight: '260px' }}
        />

        {/* Attribution Bar on Map */}
        <div className="absolute bottom-1 right-1 z-20 bg-black/60 backdrop-blur-xs text-[10px] text-white/90 px-2 py-0.5 rounded-md pointer-events-none max-w-[85%] truncate">
          {mapType === 'street' ? t('map_attr_street') : t('map_attr_satellite')}
        </div>

        {/* Floating Instruction Banner when 0 points */}
        {points.length === 0 && (
          <div className="absolute top-2 left-2 z-20 bg-white/90 backdrop-blur-xs border border-stone-300 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-800 shadow-xs pointer-events-none">
            {t('farm_boundary_help')}
          </div>
        )}
      </div>

      {/* Boundary Stats & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          {calculatedArea !== null ? (
            <span 
              id="boundary-calculated-acres-badge"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-100/90 text-emerald-900 border border-emerald-300 text-xs font-bold shadow-2xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t('farm_boundary_auto_calc')}: {calculatedArea} acres</span>
            </span>
          ) : (
            <span className="text-xs text-stone-500 font-medium">
              {t('farm_boundary_points_count', { count: points.length })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            id="boundary-undo-point-btn"
            disabled={points.length === 0}
            onClick={handleUndoPoint}
            className="h-8 px-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold flex items-center gap-1 transition disabled:opacity-40 cursor-pointer"
          >
            <Undo className="w-3 h-3 text-stone-600" />
            <span>{t('farm_boundary_undo')}</span>
          </button>

          <button
            type="button"
            id="boundary-clear-btn"
            disabled={points.length === 0}
            onClick={handleClearBoundary}
            className="h-8 px-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-rose-700 text-xs font-bold flex items-center gap-1 transition disabled:opacity-40 cursor-pointer"
          >
            <Trash2 className="w-3 h-3 text-rose-600" />
            <span>{t('farm_boundary_clear')}</span>
          </button>

          <button
            type="button"
            id="boundary-sample-btn"
            onClick={handleGenerateSampleOutline}
            className="h-8 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[#1E4620] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#1E4620]" />
            <span>{t('farm_boundary_auto_sample')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
